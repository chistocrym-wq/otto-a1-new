import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  HelpCircle,
  Lightbulb,
  MessageCircleMore,
  PenLine,
  Share2,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import type { ActivityEntry, ModuleId, Progress } from '@/types';
import {
  buildDailyPlan,
  getGreeting,
  getReadiness,
  getTodayActivity,
  MODULE_META,
  MODULE_ORDER,
} from '@/lib/preparation';

interface DashboardProps {
  onSelectModule: (module: ModuleId) => void;
  onOpenInstructions: () => void;
  onOpenExamGuide: () => void;
  onOpenMockExam: () => void;
  onOpenNews: () => void;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
  onOpenReadiness: () => void;
  onShare: () => void;
  onOpenSupport: () => void;
  progress: Progress;
  activity: ActivityEntry[];
}

type Minutes = 5 | 15 | 30;

const moduleIcons: Record<ModuleId, typeof PenLine> = {
  schreiben: PenLine,
  sprechen: MessageCircleMore,
  lesen: BookOpen,
  horen: Headphones,
};

const statusStyle = {
  ready: 'bg-emerald-100 text-emerald-800',
  almost: 'bg-amber-100 text-amber-800',
  train: 'bg-rose-100 text-rose-800',
} as const;

const statusLabel = {
  ready: 'готово',
  almost: 'почти готово',
  train: 'тренируем',
} as const;

export function Dashboard({
  onSelectModule,
  onOpenInstructions,
  onOpenExamGuide,
  onOpenMockExam,
  onOpenNews,
  onOpenAccount,
  onOpenSettings,
  onOpenReadiness,
  onShare,
  onOpenSupport,
  progress,
  activity,
}: DashboardProps) {
  const [minutes, setMinutes] = useState<Minutes>(() => {
    const stored = Number(localStorage.getItem('otto-a1-session-minutes'));
    return stored === 5 || stored === 15 || stored === 30 ? stored : 15;
  });
  const readiness = useMemo(() => getReadiness(progress), [progress]);
  const plan = useMemo(() => buildDailyPlan(progress, minutes), [progress, minutes]);
  const today = useMemo(() => getTodayActivity(activity), [activity]);
  const firstTask = plan[0];

  const chooseMinutes = (value: Minutes) => {
    setMinutes(value);
    try { localStorage.setItem('otto-a1-session-minutes', String(value)); } catch { /* ignore */ }
  };

  return (
    <div className="animate-fade-in pb-8">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0b756d] via-[#11877c] to-[#23a395] px-5 pb-5 pt-5 text-white shadow-[0_22px_55px_rgba(15,118,110,.22)] sm:px-7 sm:py-7">
        <div className="relative z-10 max-w-[72%] sm:max-w-[65%]">
          <p className="text-sm font-bold text-white/80">{getGreeting()}</p>
          <h1 className="mt-1 text-[28px] font-black leading-[1.04] sm:text-4xl">Мой путь к сертификату A1</h1>
          <p className="mt-3 text-sm leading-6 text-white/88">Отто сам подбирает, что тренировать сегодня, чтобы вы не думали, с чего начать.</p>
        </div>
        <img
          src="/otto/otto-home-documents.webp?v=2"
          alt="OTTO"
          className="pointer-events-none absolute -bottom-5 -right-7 h-[185px] w-auto select-none object-contain sm:-right-1 sm:h-[245px]"
          draggable={false}
        />
      </section>

      <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,.07)] sm:p-5">
        <button type="button" onClick={onOpenReadiness} className="w-full text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-teal-700">Готовность к A1</p>
              <div className="mt-1 flex items-end gap-2"><strong className="text-4xl font-black text-slate-950">{readiness.overall}%</strong><span className="pb-1 text-sm font-semibold text-slate-500">тренировочная готовность</span></div>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Target className="h-6 w-6" /></span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${readiness.overall}%` }} /></div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-600">Посмотреть карту готовности</span><ChevronRight className="h-5 w-5 text-slate-400" /></div>
        </button>
      </section>

      <section className="mt-4 rounded-[24px] border border-teal-100 bg-[#f7fffd] p-4 shadow-[0_12px_35px_rgba(15,23,42,.05)] sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[.15em] text-teal-700">Отто рекомендует</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{readiness.recommendation}</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Сегодня</p><h2 className="mt-1 text-2xl font-black text-slate-950">Ваша тренировка</h2></div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"><Clock3 className="h-3.5 w-3.5" />≈ {minutes} мин</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5" aria-label="Выберите длительность тренировки">
          {([5, 15, 30] as Minutes[]).map((value) => (
            <button key={value} type="button" onClick={() => chooseMinutes(value)} className={`min-h-10 rounded-xl text-sm font-black transition ${minutes === value ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}>{value} минут</button>
          ))}
        </div>

        <div className="mt-3 space-y-2.5">
          {plan.map((item, index) => {
            const Icon = moduleIcons[item.module];
            return (
              <button key={`${item.module}-${index}`} type="button" onClick={() => onSelectModule(item.module)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,.04)] transition active:scale-[.99]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-950">{index + 1}. {item.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.detail}</span></span>
                <span className="shrink-0 text-xs font-bold text-slate-400">{item.minutes} мин</span>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => firstTask && onSelectModule(firstTask.module)} disabled={!firstTask} className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-900/10 disabled:opacity-40">
          НАЧАТЬ СЕГОДНЯШНЮЮ ТРЕНИРОВКУ <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {(today.attempts > 0 || today.minutes > 0) && (
        <section className="mt-6 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-700" /><div><h2 className="font-black text-slate-950">Сегодня уже сделано</h2><p className="text-sm text-slate-600">{today.attempts} завершённых попыток{today.minutes ? ` · около ${today.minutes} мин активной практики` : ''}</p></div></div>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black text-slate-950">Навыки</h2><button type="button" onClick={onOpenReadiness} className="text-sm font-bold text-teal-700">Подробнее</button></div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {MODULE_ORDER.map((id) => {
            const metric = readiness.modules[id];
            const Icon = moduleIcons[id];
            return (
              <button key={id} type="button" onClick={() => onSelectModule(id)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,.04)]">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-base text-slate-950">{MODULE_META[id].title}</strong><small className="text-slate-500">{MODULE_META[id].label}</small></span><b className="text-lg text-slate-950">{metric.score}%</b></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${metric.score}%` }} /></div>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${statusStyle[metric.status]}`}>{statusLabel[metric.status]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.05)] sm:p-5">
        <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><Trophy className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Пробный экзамен</p><h2 className="mt-1 text-lg font-black text-slate-950">{readiness.mockLabel}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{readiness.mockStatus === 'recommended' ? 'Результаты достаточно устойчивы. Пора проверить себя целиком.' : readiness.mockStatus === 'try' ? 'Можно пройти пробник для диагностики, но Отто ещё видит слабые места.' : `Отто рекомендует сначала укрепить ${MODULE_META[readiness.weakest].title}. Открыть пробник всё равно можно.`}</p></div></div>
        <button type="button" onClick={onOpenMockExam} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-black text-slate-900">Попробовать как на экзамене <ArrowRight className="h-4 w-4" /></button>
      </section>

      <details className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer list-none font-black text-slate-950">Хочу выбрать раздел сама</summary>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {MODULE_ORDER.map((id) => {
            const Icon = moduleIcons[id];
            return <button key={id} type="button" onClick={() => onSelectModule(id)} className="flex min-h-12 items-center gap-2 rounded-xl bg-slate-50 px-3 text-left text-sm font-bold text-slate-700"><Icon className="h-4 w-4 text-teal-700" />{MODULE_META[id].title}</button>;
          })}
        </div>
      </details>

      <details className="mt-3 rounded-[24px] border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer list-none font-black text-slate-950">Полезные материалы</summary>
        <p className="mt-2 text-sm leading-6 text-slate-500">Справочник остаётся доступным, но читать всё заранее не нужно: основные подсказки должны появляться по ходу тренировки.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onOpenInstructions} className="flex min-h-11 items-center gap-2 rounded-xl bg-amber-50 px-3 text-sm font-bold text-amber-900"><Lightbulb className="h-4 w-4" />Как выполнять задания</button><button type="button" onClick={onOpenExamGuide} className="flex min-h-11 items-center gap-2 rounded-xl bg-teal-50 px-3 text-sm font-bold text-teal-900"><BookOpen className="h-4 w-4" />Справочник по экзамену</button></div>
      </details>

      <div className="mt-6 grid grid-cols-4 gap-2 text-center text-[11px] font-bold text-slate-500">
        <button type="button" onClick={onOpenAccount} className="rounded-xl bg-white px-2 py-3">Кабинет</button>
        <button type="button" onClick={onOpenSupport} className="rounded-xl bg-white px-2 py-3"><HelpCircle className="mx-auto mb-1 h-4 w-4" />Поддержка</button>
        <button type="button" onClick={onShare} className="rounded-xl bg-white px-2 py-3"><Share2 className="mx-auto mb-1 h-4 w-4" />Поделиться</button>
        <button type="button" onClick={onOpenNews} className="rounded-xl bg-white px-2 py-3">Новости</button>
      </div>

      <button type="button" onClick={onOpenSettings} className="sr-only">Настройки</button>
    </div>
  );
}
