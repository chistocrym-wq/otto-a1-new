import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, AtSign, CheckCircle2, Mail, Send, Sparkles } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';
import { useAccess } from '@/hooks/useAccess';
import type { ContactType, Gender, LearningMode, UserProfile, UserProfileDraft } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';

interface Props {
  onComplete: (profile: UserProfileDraft) => void;
  initialProfile?: UserProfile | null;
  onCancel?: () => void;
}

type Step = 'welcome' | 'profile' | 'otp' | 'mode';
type BusyState = 'request' | 'verify' | null;

const serifFont={fontFamily:'Georgia, "Times New Roman", serif'};
const sansFont={fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value.trim());
}

function validTelegram(value: string) {
  return /^@?[A-Za-z0-9_]{5,32}$/u.test(value.trim());
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeTelegram(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function maskEmail(value: string) {
  const normalized = normalizeEmail(value);
  const at = normalized.indexOf('@');
  if (at <= 0) return normalized;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function otpMessage(code?: string) {
  if (code === 'invalid_code') return 'Код не подходит. Проверьте цифры и попробуйте ещё раз.';
  if (code === 'expired' || code === 'used') return 'Срок действия кода истёк. Отправьте новый код.';
  if (code === 'too_many_attempts') return 'Слишком много неверных попыток. Отправьте новый код.';
  return 'Не удалось проверить код. Попробуйте ещё раз.';
}

export function Onboarding({ onComplete, initialProfile = null, onCancel }: Props) {
  const { status } = useAccess();
  const [step, setStep] = useState<Step>(initialProfile ? 'profile' : 'welcome');
  const [name, setName] = useState(initialProfile?.name ?? status.firstName ?? '');
  const [contactType, setContactType] = useState<ContactType>(initialProfile?.contactType ?? 'email');
  const [contact, setContact] = useState(initialProfile?.contact ?? '');
  const [gender, setGender] = useState<Gender | null>(initialProfile?.gender ?? null);
  const [mode, setMode] = useState<LearningMode>(initialProfile?.learningMode ?? 'guided');
  const [verifiedEmail, setVerifiedEmail] = useState(
    initialProfile?.contactType === 'email' && initialProfile.contactVerified ? normalizeEmail(initialProfile.contact) : '',
  );
  const [challengeId, setChallengeId] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(6).fill(''));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [busy, setBusy] = useState<BusyState>(null);
  const [sendFailed, setSendFailed] = useState(false);
  const [showDelayHint, setShowDelayHint] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const telegramVerified = contactType === 'telegram' && status.authenticated && Boolean(status.telegramUserId);
  const normalizedEmail = normalizeEmail(contact);
  const emailVerified = contactType === 'email' && Boolean(verifiedEmail) && verifiedEmail === normalizedEmail;

  const contactValue = telegramVerified ? String(status.telegramUserId) : contact.trim();
  const contactValid = useMemo(() => {
    if (telegramVerified) return true;
    return contactType === 'email' ? validEmail(contact) : validTelegram(contact);
  }, [contact, contactType, telegramVerified]);
  const genderRequired = !initialProfile;
  const profileValid = name.trim().length >= 2 && contactValid && (!genderRequired || gender !== null);
  const otpValue = otpDigits.join('');

  useEffect(() => {
    if (step !== 'otp' || resendSeconds <= 0) return undefined;
    const id = window.setInterval(() => {
      setResendSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendSeconds, step]);

  useEffect(() => {
    if (step !== 'otp' || !challengeId) {
      setShowDelayHint(false);
      return undefined;
    }
    setShowDelayHint(false);
    const id = window.setTimeout(() => setShowDelayHint(true), 75_000);
    return () => window.clearTimeout(id);
  }, [challengeId, step]);

  const requestOtp = async () => {
    if (!profileValid || contactType !== 'email' || busy) return;
    setBusy('request');
    setOtpError(null);
    setSendFailed(false);
    try {
      const response = await fetch('/api/email-otp-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.challengeId !== 'string') {
        if (response.status === 429 && Number(data.retryAfter) > 0) {
          setResendSeconds(Number(data.retryAfter));
          setOtpError(`Код можно отправить повторно через ${Number(data.retryAfter)} сек.`);
        } else {
          setOtpError('Не удалось отправить код.');
          setSendFailed(true);
        }
        return;
      }
      setChallengeId(data.challengeId);
      setOtpDigits(Array(6).fill(''));
      setSendFailed(false);
      setShowDelayHint(false);
      setResendSeconds(Number(data.resendAfter) > 0 ? Number(data.resendAfter) : 60);
      setStep('otp');
      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch {
      setOtpError('Не удалось отправить код.');
      setSendFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const continueProfile = () => {
    if (!profileValid || busy) return;
    if (contactType === 'email') {
      if (emailVerified) {
        setStep('mode');
      } else {
        void requestOtp();
      }
      return;
    }
    setStep('mode');
  };

  const verifyOtp = async () => {
    if (busy || otpValue.length !== 6 || !challengeId) return;
    setBusy('verify');
    setOtpError(null);
    try {
      const response = await fetch('/api/email-otp-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challengeId, email: normalizedEmail, code: otpValue }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.verified !== true) {
        setOtpError(otpMessage(data.code));
        if (data.code === 'expired' || data.code === 'used' || data.code === 'too_many_attempts') {
          setChallengeId('');
          setResendSeconds(0);
        }
        return;
      }
      setVerifiedEmail(normalizedEmail);
      setChallengeId('');
      setOtpDigits(Array(6).fill(''));
      setStep('mode');
    } catch {
      setOtpError('Не удалось проверить код. Попробуйте ещё раз.');
    } finally {
      setBusy(null);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/gu, '').slice(-1);
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    setOtpError(null);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;
    if (otpDigits[index]) return;
    if (index > 0) {
      setOtpDigits((current) => {
        const next = [...current];
        next[index - 1] = '';
        return next;
      });
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const digits = event.clipboardData.getData('text').replace(/\D/gu, '').slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    const next = Array(6).fill('');
    digits.split('').forEach((digit, index) => { next[index] = digit; });
    setOtpDigits(next);
    setOtpError(null);
    otpRefs.current[Math.min(digits.length, 6) - 1]?.focus();
  };

  const cancelCurrentChallenge = async () => {
    if (!challengeId || !validEmail(normalizedEmail)) return;
    try {
      await fetch('/api/email-otp-cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challengeId, email: normalizedEmail }),
      });
    } catch {
      // Cancellation is best-effort for UX; server TTL still limits an unreachable challenge.
    }
  };

  const changeEmail = async () => {
    await cancelCurrentChallenge();
    setChallengeId('');
    setOtpDigits(Array(6).fill(''));
    setOtpError(null);
    setResendSeconds(0);
    setSendFailed(false);
    setShowDelayHint(false);
    setStep('profile');
    window.setTimeout(() => emailInputRef.current?.focus(), 0);
  };

  const continueAsGuest = async () => {
    if (busy || contactType !== 'email' || !profileValid) return;
    setBusy('verify');
    await cancelCurrentChallenge();
    onComplete({
      name: name.trim(),
      contactType: 'email',
      contact: normalizedEmail,
      contactVerified: false,
      authStatus: 'guest',
      gender: gender ?? initialProfile?.gender,
      learningMode: mode,
    });
  };

  const save = () => {
    if (!profileValid) return;
    if (contactType === 'email' && !emailVerified) return;
    onComplete({
      name: name.trim(),
      contactType,
      contact: contactType === 'email'
        ? normalizedEmail
        : contactType === 'telegram' && !telegramVerified
          ? normalizeTelegram(contactValue)
          : contactValue,
      contactVerified: contactType === 'email' ? emailVerified : telegramVerified,
      authStatus: contactType === 'email' ? (emailVerified ? 'verified' : 'guest') : (telegramVerified ? 'verified' : 'guest'),
      gender: gender ?? initialProfile?.gender,
      learningMode: mode,
    });
  };

  const progressStep = step === 'otp' ? 'profile' : step;

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[var(--otto-bg)] px-4 py-5 text-[var(--otto-ink)] sm:px-6 sm:py-8" style={sansFont}>
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-xl flex-col justify-center">
        {onCancel && (
          <button type="button" onClick={onCancel} className="mb-3 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-[var(--otto-line)] bg-[var(--otto-surface)] px-4 text-sm font-bold text-[var(--otto-ink)]">
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>
        )}

        <section className="overflow-hidden rounded-[30px] border border-[var(--otto-line)] bg-[var(--otto-surface)] shadow-[0_24px_70px_rgba(43,54,54,.12)]">
          <div className="relative min-h-[176px] overflow-hidden bg-[var(--otto-petrol-soft)] px-5 pt-5 sm:min-h-[205px] sm:px-7">
            <div className="relative z-10 max-w-[62%]">
              <span className="inline-flex rounded-full bg-[var(--otto-surface)] px-3 py-1 text-[11px] font-[850] uppercase tracking-[.16em] text-[var(--otto-petrol-dark)]">OTTO A1</span>
              <h1 className="mt-3 text-2xl font-bold leading-[1.05] text-[var(--otto-ink)] sm:text-3xl" style={serifFont}>Подготовка к экзамену — шаг за шагом</h1>
            </div>
            <OttoScene scene="home" eager className="absolute -bottom-20 -right-8 h-[270px] w-auto max-w-none sm:-bottom-24 sm:right-0 sm:h-[320px]" />
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-5 flex gap-2" aria-label="Шаги регистрации">
              {(['welcome', 'profile', 'mode'] as const).map((item, index) => {
                const order = ['welcome', 'profile', 'mode'] as const;
                const active = order.indexOf(progressStep as 'welcome' | 'profile' | 'mode') >= index;
                return <span key={item} className={cn('h-1.5 flex-1 rounded-full transition-colors', active ? 'bg-[var(--otto-petrol)]' : 'bg-[var(--otto-sand)]')} />;
              })}
            </div>

            {step === 'welcome' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 text-[var(--otto-petrol-dark)]"><Sparkles className="h-5 w-5" /><b>Привет! Я Отто.</b></div>
                <p className="mt-3 text-base leading-7 text-[var(--otto-muted)]">Я помогу подготовиться к A1 шаг за шагом: будем тренироваться, разбирать ошибки и повышать готовность к экзамену.</p>
                <button type="button" onClick={() => setStep('profile')} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--otto-petrol-dark)] px-5 font-[850] text-white">
                  Настроить мой профиль <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 'profile' && (
              <div className="animate-fade-in">
                <p className="text-xs font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">Профиль</p>
                <h2 className="mt-1 text-2xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>Как к вам обращаться?</h2>
                <label className="mt-5 block text-sm font-bold text-[var(--otto-ink)]">
                  Имя
                  <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={60} placeholder="Например, Анна" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--otto-line-strong)] bg-[var(--otto-surface-strong)] px-4 text-base text-[var(--otto-ink)] outline-none focus:border-[var(--otto-petrol)] focus:ring-2 focus:ring-[var(--otto-petrol)]/15" />
                </label>

                <fieldset className="mt-5">
                  <legend className="text-sm font-bold text-[var(--otto-ink)]">Ваш пол</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setGender('female')} aria-pressed={gender === 'female'} className={cn('min-h-12 rounded-xl border px-3 font-bold', gender === 'female' ? 'border-[var(--otto-petrol)] bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]' : 'border-[var(--otto-line)] bg-[var(--otto-surface)] text-[var(--otto-muted)]')}>Женский</button>
                    <button type="button" onClick={() => setGender('male')} aria-pressed={gender === 'male'} className={cn('min-h-12 rounded-xl border px-3 font-bold', gender === 'male' ? 'border-[var(--otto-petrol)] bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]' : 'border-[var(--otto-line)] bg-[var(--otto-surface)] text-[var(--otto-muted)]')}>Мужской</button>
                  </div>
                </fieldset>

                <fieldset className="mt-5">
                  <legend className="text-sm font-bold text-[var(--otto-ink)]">Контакт</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setContactType('email'); setOtpError(null); }} aria-pressed={contactType === 'email'} className={cn('min-h-12 rounded-xl border px-3 font-bold', contactType === 'email' ? 'border-[var(--otto-petrol)] bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]' : 'border-[var(--otto-line)] bg-[var(--otto-surface)] text-[var(--otto-muted)]')}><Mail className="mr-2 inline h-4 w-4" />Email</button>
                    <button type="button" onClick={() => { setContactType('telegram'); setOtpError(null); setChallengeId(''); }} aria-pressed={contactType === 'telegram'} className={cn('min-h-12 rounded-xl border px-3 font-bold', contactType === 'telegram' ? 'border-[var(--otto-petrol)] bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]' : 'border-[var(--otto-line)] bg-[var(--otto-surface)] text-[var(--otto-muted)]')}><Send className="mr-2 inline h-4 w-4" />Telegram</button>
                  </div>
                </fieldset>

                {contactType === 'email' ? (
                  <label className="mt-4 block text-sm font-bold text-[var(--otto-ink)]">Email<input ref={emailInputRef} value={contact} onChange={(event) => { setContact(event.target.value); setOtpError(null); setSendFailed(false); }} inputMode="email" autoComplete="email" placeholder="name@example.com" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--otto-line-strong)] bg-[var(--otto-surface-strong)] px-4 text-base text-[var(--otto-ink)] outline-none focus:border-[var(--otto-petrol)] focus:ring-2 focus:ring-[var(--otto-petrol)]/15" /></label>
                ) : telegramVerified ? (
                  <div className="mt-4 rounded-2xl border border-[var(--otto-line)] bg-[var(--otto-sage-soft)] p-4 text-sm text-[var(--otto-petrol-dark)]"><div className="flex items-center gap-2 font-[850]"><CheckCircle2 className="h-5 w-5" />Telegram подтверждён</div><p className="mt-1 leading-6">Telegram подтверждён{status.firstName ? `: ${status.firstName}` : ''}. Повторно вводить логин не нужно.</p></div>
                ) : (
                  <label className="mt-4 block text-sm font-bold text-[var(--otto-ink)]">Telegram username<div className="relative mt-2"><AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--otto-muted)]" /><input value={contact.replace(/^@/u, '')} onChange={(event) => setContact(event.target.value)} autoCapitalize="none" autoCorrect="off" placeholder="username" className="min-h-12 w-full rounded-xl border border-[var(--otto-line-strong)] bg-[var(--otto-surface-strong)] pl-10 pr-4 text-base text-[var(--otto-ink)] outline-none focus:border-[var(--otto-petrol)] focus:ring-2 focus:ring-[var(--otto-petrol)]/15" /></div></label>
                )}

                <p className="mt-3 text-xs leading-5 text-[var(--otto-muted)]">{contactType === 'email' ? 'Подтвердите email кодом из письма. После этого откроется главный экран OTTO.' : 'Telegram подтверждается автоматически, когда OTTO открыт внутри Telegram.'}</p>
                {!profileValid && (name.trim() || contact.trim() || gender !== null) && <p className="mt-2 text-sm font-semibold text-[var(--otto-danger)]">Проверьте имя, пол и выбранный контакт.</p>}
                {otpError && <p className="mt-2 text-sm font-semibold text-[var(--otto-danger)]" role="alert">{otpError}</p>}
                {sendFailed && contactType === 'email' ? (
                  <div className="mt-4 space-y-2">
                    <button type="button" disabled={busy !== null} onClick={() => void requestOtp()} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--otto-petrol-dark)] px-5 font-[850] text-white disabled:opacity-45">Попробовать ещё раз</button>
                    <button type="button" disabled={busy !== null} onClick={() => { setSendFailed(false); setOtpError(null); emailInputRef.current?.focus(); }} className="min-h-11 w-full rounded-xl border border-[var(--otto-line)] bg-[var(--otto-surface)] px-4 text-sm font-bold text-[var(--otto-petrol-dark)] disabled:opacity-45">Изменить email</button>
                    <p className="px-1 text-xs leading-5 text-[var(--otto-muted)]">Подтвердите email, чтобы восстановить доступ и прогресс на другом устройстве.</p>
                    <button type="button" disabled={busy !== null || !profileValid} onClick={() => void continueAsGuest()} className="min-h-11 w-full rounded-xl px-4 text-sm font-bold text-[var(--otto-muted)] disabled:opacity-45">Продолжить как гость</button>
                  </div>
                ) : (
                  <button type="button" disabled={!profileValid || busy !== null} onClick={continueProfile} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--otto-petrol-dark)] px-5 font-[850] text-white disabled:cursor-not-allowed disabled:opacity-35">
                    {busy === 'request' ? 'Отправляем код…' : contactType === 'email' && !emailVerified ? 'Получить код' : 'Продолжить'} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {step === 'otp' && (
              <div className="animate-fade-in">
                <p className="text-xs font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">Подтверждение email</p>
                <h2 className="mt-1 text-2xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>Введите код</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--otto-muted)]">Мы отправили 6-значный код на<br/><strong className="text-[var(--otto-ink)]">{maskEmail(normalizedEmail)}</strong></p>

                <div className="mt-5 grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => { otpRefs.current[index] = node; }}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      aria-label={`Цифра ${index + 1} из 6`}
                      className="aspect-square min-w-0 rounded-xl border border-[var(--otto-line-strong)] bg-[var(--otto-surface-strong)] text-center text-xl font-[850] text-[var(--otto-ink)] outline-none focus:border-[var(--otto-petrol)] focus:ring-2 focus:ring-[var(--otto-petrol)]/15"
                    />
                  ))}
                </div>

                {otpError && <p className="mt-3 text-sm font-semibold leading-5 text-[var(--otto-danger)]" role="alert">{otpError}</p>}
                {showDelayHint && <p className="mt-3 rounded-xl bg-[var(--otto-sand)]/45 px-3 py-2 text-sm leading-5 text-[var(--otto-muted)]">Письмо задерживается? Проверьте папку «Спам» или отправьте код ещё раз.</p>}

                <button type="button" disabled={otpValue.length !== 6 || busy !== null || !challengeId} onClick={() => void verifyOtp()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--otto-petrol-dark)] px-5 font-[850] text-white disabled:cursor-not-allowed disabled:opacity-35">
                  {busy === 'verify' ? 'Проверяем…' : 'Подтвердить email'} <CheckCircle2 className="h-5 w-5" />
                </button>

                <button type="button" disabled={resendSeconds > 0 || busy !== null} onClick={() => void requestOtp()} className="mt-3 min-h-11 w-full rounded-xl border border-[var(--otto-line)] bg-[var(--otto-surface)] px-4 text-sm font-bold text-[var(--otto-petrol-dark)] disabled:cursor-not-allowed disabled:opacity-45">
                  {resendSeconds > 0 ? `Отправить код ещё раз через ${resendSeconds} сек.` : busy === 'request' ? 'Отправляем код…' : 'Отправить код ещё раз'}
                </button>
                <button type="button" disabled={busy !== null} onClick={() => void changeEmail()} className="mt-2 min-h-11 w-full rounded-xl px-4 text-sm font-bold text-[var(--otto-muted)] disabled:opacity-45">Изменить email</button>
                <p className="mt-3 px-1 text-xs leading-5 text-[var(--otto-muted)]">Подтвердите email, чтобы восстановить доступ и прогресс на другом устройстве.</p>
                <button type="button" disabled={busy !== null || !profileValid} onClick={() => void continueAsGuest()} className="mt-1 min-h-11 w-full rounded-xl px-4 text-sm font-bold text-[var(--otto-muted)] disabled:opacity-45">Продолжить как гость</button>
              </div>
            )}

            {step === 'mode' && (
              <div className="animate-fade-in">
                <p className="text-xs font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">Как Отто будет помогать</p>
                <h2 className="mt-1 text-2xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>Выберите режим обучения</h2>
                <div className="mt-5 space-y-3">
                  <ModeCard active={mode === 'guided'} title="Начинаю с нуля" description="Отто будет объяснять новые типы заданий и давать короткую подготовку перед тренировкой." onClick={() => setMode('guided')} />
                  <ModeCard active={mode === 'direct'} title="Я уже немного знаю немецкий" description="Сразу к тренировкам без дополнительных объяснений." onClick={() => setMode('direct')} />
                </div>
                <button type="button" onClick={save} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--otto-terracotta)] px-5 font-[850] text-white"><CheckCircle2 className="h-5 w-5" />{initialProfile ? 'Сохранить профиль' : 'Начать заниматься'}</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ModeCard({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn('w-full rounded-2xl border p-4 text-left transition', active ? 'border-[var(--otto-petrol)] bg-[var(--otto-petrol-soft)] ring-2 ring-[var(--otto-petrol)]/10' : 'border-[var(--otto-line)] bg-[var(--otto-surface)]')}><span className="flex items-start gap-3"><span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border', active ? 'border-[var(--otto-petrol)] bg-[var(--otto-petrol)] text-white' : 'border-[var(--otto-line-strong)] bg-[var(--otto-surface)]')}>{active ? <CheckCircle2 className="h-4 w-4" /> : null}</span><span><strong className="block text-base text-[var(--otto-ink)]">{title}</strong><span className="mt-1 block text-sm leading-6 text-[var(--otto-muted)]">{description}</span></span></span></button>;
}
