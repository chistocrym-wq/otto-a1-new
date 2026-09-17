import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, AtSign, CheckCircle2, Mail, Send, Sparkles } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';
import { useAccess } from '@/hooks/useAccess';
import type { ContactType, LearningMode, UserProfile, UserProfileDraft } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';

interface Props {
  onComplete: (profile: UserProfileDraft) => void;
  initialProfile?: UserProfile | null;
  onCancel?: () => void;
}

type Step = 'welcome' | 'profile' | 'mode';
const serifFont={fontFamily:'Georgia, "Times New Roman", serif'};
const sansFont={fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value.trim());
}

function validTelegram(value: string) {
  return /^@?[A-Za-z0-9_]{5,32}$/u.test(value.trim());
}

function normalizeTelegram(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export function Onboarding({ onComplete, initialProfile = null, onCancel }: Props) {
  const { status } = useAccess();
  const [step, setStep] = useState<Step>(initialProfile ? 'profile' : 'welcome');
  const [name, setName] = useState(initialProfile?.name ?? status.firstName ?? '');
  const [contactType, setContactType] = useState<ContactType>(initialProfile?.contactType ?? 'email');
  const [contact, setContact] = useState(initialProfile?.contact ?? '');
  const [mode, setMode] = useState<LearningMode>(initialProfile?.learningMode ?? 'guided');
  const telegramVerified = contactType === 'telegram' && status.authenticated && Boolean(status.telegramUserId);

  const contactValue = telegramVerified ? String(status.telegramUserId) : contact.trim();
  const contactValid = useMemo(() => {
    if (telegramVerified) return true;
    return contactType === 'email' ? validEmail(contact) : validTelegram(contact);
  }, [contact, contactType, telegramVerified]);
  const profileValid = name.trim().length >= 2 && contactValid;

  const save = () => {
    if (!profileValid) return;
    onComplete({
      name: name.trim(),
      contactType,
      contact: contactType === 'telegram' && !telegramVerified ? normalizeTelegram(contactValue) : contactValue,
      contactVerified: telegramVerified || (initialProfile?.contactVerified === true && initialProfile.contact === contactValue),
      learningMode: mode,
    });
  };

  return (
    <main
      className={cn(
        'min-h-[100dvh] overflow-x-hidden bg-[var(--otto-bg)] px-4 text-[var(--otto-ink)] sm:px-6 sm:py-8',
        step === 'profile'
          ? 'overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3'
          : 'py-5',
      )}
      style={sansFont}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-xl flex-col',
          step === 'profile'
            ? 'min-h-0 justify-start sm:min-h-[calc(100dvh-4rem)] sm:justify-center'
            : 'min-h-[calc(100dvh-2.5rem)] justify-center',
        )}
      >
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
              {(['welcome', 'profile', 'mode'] as Step[]).map((item, index) => {
                const order = ['welcome', 'profile', 'mode'] as Step[];
                const active = order.indexOf(step) >= index;
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
                  <legend className="text-sm font-bold text-[var(--otto-ink)]">Контакт</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setContactType('email')} aria-pressed={contactType === 'email'} className={cn('min-h-12 rounded-xl border px-3 font-bold', contactType === 'email' ? 'border-[var(--otto-petrol)] bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]' : 'border-[var(--otto-line)] bg-[var(--otto-surface)] text-[var(--otto-muted)]')}><Mail className="mr-2 inline h-4 w-4" />Email</button>
                    <button type="button" onClick={() => setContactType('telegram')} aria-pressed={contactType === 'telegram'} className={cn('min-h-12 rounded-xl border px-3 font-bold', contactType === 'telegram' ? 'border-[var(--otto-petrol)] bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]' : 'border-[var(--otto-line)] bg-[var(--otto-surface)] text-[var(--otto-muted)]')}><Send className="mr-2 inline h-4 w-4" />Telegram</button>
                  </div>
                </fieldset>

                {contactType === 'email' ? (
                  <label className="mt-4 block text-sm font-bold text-[var(--otto-ink)]">Email<input value={contact} onChange={(event) => setContact(event.target.value)} inputMode="email" autoComplete="email" placeholder="name@example.com" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--otto-line-strong)] bg-[var(--otto-surface-strong)] px-4 text-base text-[var(--otto-ink)] outline-none focus:border-[var(--otto-petrol)] focus:ring-2 focus:ring-[var(--otto-petrol)]/15" /></label>
                ) : telegramVerified ? (
                  <div className="mt-4 rounded-2xl border border-[var(--otto-line)] bg-[var(--otto-sage-soft)] p-4 text-sm text-[var(--otto-petrol-dark)]"><div className="flex items-center gap-2 font-[850]"><CheckCircle2 className="h-5 w-5" />Telegram подтверждён</div><p className="mt-1 leading-6">Mini App подтвердил Telegram-пользователя{status.firstName ? `: ${status.firstName}` : ''}. Мы не просим вводить логин повторно.</p></div>
                ) : (
                  <label className="mt-4 block text-sm font-bold text-[var(--otto-ink)]">Telegram username<div className="relative mt-2"><AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--otto-muted)]" /><input value={contact.replace(/^@/u, '')} onChange={(event) => setContact(event.target.value)} autoCapitalize="none" autoCorrect="off" placeholder="username" className="min-h-12 w-full rounded-xl border border-[var(--otto-line-strong)] bg-[var(--otto-surface-strong)] pl-10 pr-4 text-base text-[var(--otto-ink)] outline-none focus:border-[var(--otto-petrol)] focus:ring-2 focus:ring-[var(--otto-petrol)]/15" /></div></label>
                )}

                <p className="mt-3 text-xs leading-5 text-[var(--otto-muted)]">Email сохраняется как контакт без подтверждения владения. Telegram считается подтверждённым только когда OTTO открыт как Mini App и сервер успешно проверил Telegram initData.</p>
                {!profileValid && (name.trim() || contact.trim()) && <p className="mt-2 text-sm font-semibold text-[var(--otto-danger)]">Проверьте имя и выбранный контакт.</p>}
                <button type="button" disabled={!profileValid} onClick={() => setStep('mode')} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--otto-petrol-dark)] px-5 font-[850] text-white disabled:cursor-not-allowed disabled:opacity-35">Продолжить <ArrowRight className="h-4 w-4" /></button>
              </div>
            )}

            {step === 'mode' && (
              <div className="animate-fade-in">
                <p className="text-xs font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">Как Отто будет помогать</p>
                <h2 className="mt-1 text-2xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>Выберите режим обучения</h2>
                <div className="mt-5 space-y-3">
                  <ModeCard active={mode === 'guided'} title="Начинаю с нуля" description="Отто будет объяснять новые типы заданий и давать короткую подготовку перед тренировкой." onClick={() => setMode('guided')} />
                  <ModeCard active={mode === 'direct'} title="Я уже немного знаю немецкий" description="Сразу к тренировкам — максимально близко к нынешнему режиму OTTO." onClick={() => setMode('direct')} />
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
