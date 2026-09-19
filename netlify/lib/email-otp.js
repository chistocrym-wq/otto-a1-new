import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_REQUEST_LIMIT = 5;
const IP_REQUEST_LIMIT = 20;
const STORE_NAME = 'otto-email-otp';

export function env(name) {
  return Netlify.env.get(name) || '';
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email) && email.length <= 254;
}

function store() {
  const options = { consistency: 'strong' };
  if (Netlify.context?.deploy?.context === 'production') {
    return getStore(STORE_NAME, options);
  }
  return getDeployStore(STORE_NAME, options);
}

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function challengeKey(challengeId) {
  return `challenge:${challengeId}`;
}

function emailRateKey(email) {
  return `rate:email:${sha256(email)}`;
}

function ipRateKey(ip) {
  return `rate:ip:${sha256(ip || 'unknown')}`;
}

function getClientIp(req) {
  const direct = req.headers.get('x-nf-client-connection-ip');
  if (direct) return direct.trim();
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function createOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function otpHmac(apiKey, challengeId, email, code) {
  return createHmac('sha256', apiKey)
    .update(`otto-email-otp:v1:${challengeId}:${email}:${code}`)
    .digest('hex');
}

function safeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

async function readRate(key, now) {
  const current = (await store().get(key, { type: 'json' })) || {};
  const windowStart = Number(current.windowStart || 0);
  if (!windowStart || now - windowStart >= REQUEST_WINDOW_MS) {
    return { windowStart: now, count: 0, nextAllowedAt: 0, activeChallengeId: current.activeChallengeId || null };
  }
  return {
    windowStart,
    count: Number(current.count || 0),
    nextAllowedAt: Number(current.nextAllowedAt || 0),
    activeChallengeId: current.activeChallengeId || null,
  };
}

function retryAfterSeconds(timestamp, now) {
  return Math.max(1, Math.ceil((timestamp - now) / 1000));
}

export async function reserveOtpRequest(req, email) {
  const now = Date.now();
  const emailKey = emailRateKey(email);
  const ipKey = ipRateKey(getClientIp(req));
  const [emailRate, ipRate] = await Promise.all([readRate(emailKey, now), readRate(ipKey, now)]);

  if (emailRate.nextAllowedAt > now) {
    return { allowed: false, retryAfter: retryAfterSeconds(emailRate.nextAllowedAt, now), reason: 'cooldown' };
  }
  if (emailRate.count >= EMAIL_REQUEST_LIMIT) {
    return {
      allowed: false,
      retryAfter: retryAfterSeconds(emailRate.windowStart + REQUEST_WINDOW_MS, now),
      reason: 'email_limit',
    };
  }
  if (ipRate.count >= IP_REQUEST_LIMIT) {
    return {
      allowed: false,
      retryAfter: retryAfterSeconds(ipRate.windowStart + REQUEST_WINDOW_MS, now),
      reason: 'ip_limit',
    };
  }

  await Promise.all([
    store().setJSON(emailKey, {
      ...emailRate,
      count: emailRate.count + 1,
      nextAllowedAt: now + OTP_RESEND_MS,
      updatedAt: now,
    }),
    store().setJSON(ipKey, {
      ...ipRate,
      count: ipRate.count + 1,
      updatedAt: now,
    }),
  ]);

  return { allowed: true, previousChallengeId: emailRate.activeChallengeId || null, emailKey };
}

export async function createChallenge(email, apiKey) {
  const challengeId = randomUUID();
  const code = createOtpCode();
  const now = Date.now();
  const record = {
    version: 1,
    emailDigest: sha256(email),
    codeHmac: otpHmac(apiKey, challengeId, email, code),
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    attemptsRemaining: OTP_MAX_ATTEMPTS,
    usedAt: null,
    lockedAt: null,
  };
  await store().setJSON(challengeKey(challengeId), record);
  return { challengeId, code, expiresAt: record.expiresAt };
}

export async function activateChallenge(email, challengeId, previousChallengeId = null) {
  const key = emailRateKey(email);
  const now = Date.now();
  const rate = await readRate(key, now);
  await store().setJSON(key, { ...rate, activeChallengeId: challengeId, updatedAt: now });
  if (previousChallengeId && previousChallengeId !== challengeId) {
    await store().delete(challengeKey(previousChallengeId));
  }
}

export async function releaseOtpCooldown(email) {
  const now = Date.now();
  const key = emailRateKey(email);
  const rate = await readRate(key, now);
  await store().setJSON(key, { ...rate, nextAllowedAt: 0, updatedAt: now });
}

export async function cancelChallenge({ challengeId, email }) {
  if (!/^[0-9a-f-]{20,80}$/iu.test(String(challengeId || ''))) return true;
  const key = challengeKey(challengeId);
  const record = await store().get(key, { type: 'json' });
  if (!record) return true;
  if (record.emailDigest !== sha256(email)) return false;

  const now = Date.now();
  const rateKey = emailRateKey(email);
  const rate = await readRate(rateKey, now);
  await Promise.all([
    store().delete(key),
    store().setJSON(rateKey, {
      ...rate,
      activeChallengeId: rate.activeChallengeId === challengeId ? null : rate.activeChallengeId,
      updatedAt: now,
    }),
  ]);
  return true;
}

export async function discardChallenge(challengeId) {
  if (challengeId) await store().delete(challengeKey(challengeId));
}

export async function verifyChallenge({ challengeId, email, code, apiKey }) {
  if (!/^[0-9a-f-]{20,80}$/iu.test(String(challengeId || ''))) {
    return { ok: false, reason: 'not_found' };
  }
  if (!/^\d{6}$/u.test(String(code || ''))) {
    return { ok: false, reason: 'invalid_code' };
  }

  const key = challengeKey(challengeId);
  const record = await store().get(key, { type: 'json' });
  if (!record) return { ok: false, reason: 'not_found' };

  const now = Date.now();
  if (record.usedAt) return { ok: false, reason: 'used' };
  if (record.lockedAt || Number(record.attemptsRemaining || 0) <= 0) {
    return { ok: false, reason: 'too_many_attempts' };
  }
  if (Number(record.expiresAt || 0) <= now) {
    return { ok: false, reason: 'expired' };
  }
  if (record.emailDigest !== sha256(email)) {
    return { ok: false, reason: 'invalid_code' };
  }

  const rate = await readRate(emailRateKey(email), now);
  if (rate.activeChallengeId && rate.activeChallengeId !== challengeId) {
    return { ok: false, reason: 'not_found' };
  }

  const actual = otpHmac(apiKey, challengeId, email, code);
  if (!safeEqualHex(actual, record.codeHmac)) {
    const attemptsRemaining = Math.max(0, Number(record.attemptsRemaining || 0) - 1);
    await store().setJSON(key, {
      ...record,
      attemptsRemaining,
      lockedAt: attemptsRemaining === 0 ? now : null,
    });
    return { ok: false, reason: attemptsRemaining === 0 ? 'too_many_attempts' : 'invalid_code', attemptsRemaining };
  }

  await Promise.all([
    store().setJSON(key, {
      ...record,
      codeHmac: null,
      attemptsRemaining: 0,
      usedAt: now,
    }),
    store().setJSON(emailRateKey(email), {
      ...rate,
      activeChallengeId: null,
      updatedAt: now,
    }),
  ]);

  return { ok: true };
}

function maskEmailForLog(value) {
  const email = String(value || '');
  const at = email.indexOf('@');
  if (at <= 0) return '[redacted-email]';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible))}@${domain}`;
}

function sanitizeUniSenderLogValue(value, secrets = [], depth = 0) {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;

  if (typeof value === 'string') {
    let safe = value;
    for (const secret of secrets) {
      if (secret) safe = safe.split(secret).join('[redacted-secret]');
    }
    safe = safe.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, (match) => maskEmailForLog(match));
    safe = safe.replace(/\b\d{6}\b/gu, '[redacted-6-digit]');
    return safe;
  }

  if (depth >= 5) return '[truncated]';

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => sanitizeUniSenderLogValue(item, secrets, depth + 1));
  }

  if (typeof value === 'object') {
    const safeObject = {};
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      const safeKey = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(key) ? maskEmailForLog(key) : key;
      if (/^(?:x-api-key|authorization|password|secret|token|otp|otp_code|code)$/iu.test(key) || /api[_-]?key/iu.test(key)) {
        safeObject[safeKey] = '[redacted]';
      } else {
        safeObject[safeKey] = sanitizeUniSenderLogValue(item, secrets, depth + 1);
      }
    }
    return safeObject;
  }

  return String(value);
}

export async function sendOtpEmail({ email, code, challengeId, apiKey, fromEmail }) {
  const endpoint = 'https://goapi.unisender.ru/ru/transactional/api/v1/email/send.json';
  const safeCode = String(code);
  const html = `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:0;background:#f7f5ef;font-family:Arial,Helvetica,sans-serif;color:#2b3636;">
    <div style="max-width:520px;margin:0 auto;padding:28px 18px;">
      <div style="background:#ffffff;border:1px solid #e4e0d7;border-radius:18px;padding:28px 24px;">
        <div style="font-size:14px;font-weight:700;letter-spacing:.08em;color:#356b67;">OTTO A1</div>
        <h1 style="margin:14px 0 18px;font-size:22px;line-height:1.25;">Код подтверждения</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Ваш код подтверждения:</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:.22em;line-height:1.2;margin:8px 0 20px;">${safeCode}</div>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#596565;">Код действует 10 минут.</p>
        <p style="margin:0;font-size:14px;line-height:1.55;color:#7a8582;">Если вы не запрашивали этот код, просто проигнорируйте письмо.</p>
      </div>
    </div>
  </body>
</html>`;
  const plaintext = `Ваш код подтверждения: ${safeCode}\n\nКод действует 10 минут.\n\nЕсли вы не запрашивали этот код, просто проигнорируйте письмо.`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      message: {
        recipients: [{ email }],
        body: { html, plaintext },
        subject: 'Код подтверждения OTTO',
        from_email: fromEmail,
        from_name: 'OTTO',
        idempotence_key: challengeId,
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  const failed = payload?.failed_emails && Object.prototype.hasOwnProperty.call(payload.failed_emails, email);
  if (!response.ok || payload?.status !== 'success' || failed) {
    const hasKnownDiagnosticFields = payload && typeof payload === 'object'
      ? ['status', 'message', 'error', 'errors', 'failed_emails', 'job_id']
          .some((key) => Object.prototype.hasOwnProperty.call(payload, key))
      : false;

    const diagnostic = {
      httpStatus: response.status,
      responseOk: response.ok,
      uniStatus: payload?.status ?? null,
      message: sanitizeUniSenderLogValue(payload?.message ?? payload?.error ?? null, [apiKey]),
      errors: sanitizeUniSenderLogValue(payload?.errors ?? null, [apiKey]),
      failedEmails: sanitizeUniSenderLogValue(payload?.failed_emails ?? null, [apiKey]),
      jobId: sanitizeUniSenderLogValue(payload?.job_id ?? null, [apiKey]),
    };

    if (!hasKnownDiagnosticFields) {
      diagnostic.payload = sanitizeUniSenderLogValue(payload, [apiKey]);
    }

    console.error('UniSender OTP send failed', diagnostic);
    return { ok: false };
  }
  return { ok: true, jobId: typeof payload.job_id === 'string' ? payload.job_id : null };
}
