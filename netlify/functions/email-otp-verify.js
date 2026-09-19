import {
  env,
  isValidEmail,
  json,
  normalizeEmail,
  verifyChallenge,
} from '../lib/email-otp.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });

  const apiKey = env('UNISENDER_GO_API_KEY');
  if (!apiKey) {
    return json({ error: 'Email verification is not configured.', code: 'email_not_configured' }, 503);
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const challengeId = typeof body.challengeId === 'string' ? body.challengeId.trim() : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';

  if (!isValidEmail(email) || !challengeId || !/^\d{6}$/u.test(code)) {
    return json({ error: 'Некорректные данные проверки.', code: 'invalid_request' }, 400);
  }

  const result = await verifyChallenge({ challengeId, email, code, apiKey });
  if (result.ok) return json({ verified: true });

  if (result.reason === 'expired') {
    return json({ error: 'Срок действия кода истёк. Отправьте новый код.', code: 'expired' }, 410);
  }
  if (result.reason === 'used') {
    return json({ error: 'Этот код уже использован. Отправьте новый код.', code: 'used' }, 409);
  }
  if (result.reason === 'too_many_attempts') {
    return json({ error: 'Слишком много неверных попыток. Отправьте новый код.', code: 'too_many_attempts' }, 429);
  }
  if (result.reason === 'not_found') {
    return json({ error: 'Срок действия кода истёк. Отправьте новый код.', code: 'expired' }, 410);
  }

  return json({
    error: 'Код не подходит. Проверьте цифры и попробуйте ещё раз.',
    code: 'invalid_code',
    attemptsRemaining: result.attemptsRemaining,
  }, 400);
};

export const config = { path: '/api/email-otp-verify' };
