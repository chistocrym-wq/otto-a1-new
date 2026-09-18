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
        skip_unsubscribe: 1,
        global_language: 'ru',
        template_engine: 'none',
        idempotence_key: challengeId,
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  const failed = payload?.failed_emails && Object.prototype.hasOwnProperty.call(payload.failed_emails, email);
  if (!response.ok || payload?.status !== 'success' || failed) {
    return { ok: false };
  }
  return { ok: true, jobId: typeof payload.job_id === 'string' ? payload.job_id : null };
}
