import { ArrowLeft, ArrowRight, Brain, CheckCircle2, CircleAlert, Clock3, Quote, Target, Trophy } from 'lucide-react';
import type { ActivityEntry, ModuleId, Progress } from '@/types';
import { loadLearningProfile } from '@/lib/learningProfile';
import { getReadiness, getTodayActivity, MODULE_META, MODULE_ORDER } from '@/lib/preparation';

interface Props {
  progress: Progress;
  activity: ActivityEntry[];
  onBack: () => void;
  onSelectModule: (module: ModuleId) => void;
  onOpenMockExam: () => void;
  onOpenPhrases: () => void;
}

const dot = {
  ready: 'bg-emerald-500',
  almost: 'bg-amber-400',
  train: 'bg-rose-500',
} as const;

const statusText = {
  ready: 'готово',
  almost: 'почти готово',
  train: 'ещё тренируем',
} as const;

const pathSteps = [
  'Пишу с подсказкой',
  'Пишу самостоятельно',
  'Отвечаю с подсказкой',
  'Говорю самостоятельно',
  'Понимаю задания',
  'Понимаю речь',
  'Смешанная тренировка',
  'Первый пробный экзамен',
  'Работа над ошибками',
  'Готов к A1',
];

export function ReadinessPage({ progress, activity, onBack, onSelectModule, onOpenMockExam, onOpenPhrases }: Props) {
  const readiness = getReadiness(progress);
  const today = getTodayActivity(activity);
  const learning = loadLearningProfile();
  const week = activity.filter((entry) => Date.now() - new Date(entry.at).getTime() <= 7 * 24 * 60 * 60 * 1000);
  const weekMinutes = Math.round(week.reduce((sum, entry) => sum + (entry.durationSeconds ?? 0), 0) / 60);
  const weak = readiness.modules[readiness.weakest];
  const topError = learning.errors[0];

  return (
    <div className="otto-readiness-screen animate-fade-in pb-8">
      <div className="mb-4 flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white" aria-label="Назад"><ArrowLeft className="h-5 w-5" /></button>
        <div><p className="text-xs font-black uppercase tracking-[.14em] text-teal-700">Мой путь к A1</p><h1 className="text-2xl font-black text-slate-950">Готовность к экзамену</h1></div>
      </div>

      <section className="otto-readiness-hero rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,.15)] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-white/65">Текущая тренировочная готовность</p><strong className="mt-1 block text-5xl font-black">{readiness.overall}%</strong></div><Target className="h-9 w-9 text-teal-300" /></div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-teal-400" style={{ width: `${readiness.overall}%` }} /></div>
        <p className="mt-3 text-sm leading-6 text-white/70">Процент учитывает точность, последние попытки, повторяемость результата и количество реальных тренировок. Одна удачная попытка не даёт 100% готовности.</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><Clock3 className="h-5 w-5 text-teal-700" /><strong className="mt-2 block text-2xl text-slate-950">{today.minutes || 0} мин</strong><span className="text-xs text-slate-500">активной практики сегодня</span></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><strong className="mt-2 block text-2xl text-slate-950">{today.attempts}</strong><span className="text-xs text-slate-500">завершённых попыток сегодня</span></div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-black text-slate-950">Карта готовности</h2>
        <div className="mt-3 space-y-3">
          {MODULE_ORDER.map((id) => {
            const item = readiness.modules[id];
            return (
              <button key={id} type="button" onClick={() => onSelectModule(id)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,.04)]">
                <div className="flex items-center gap-3"><span className={`h-3 w-3 shrink-0 rounded-full ${dot[item.status]}`} /><span className="min-w-0 flex-1"><strong className="block text-base text-slate-950">{MODULE_META[id].title}</strong><small className="text-slate-500">{statusText[item.status]}</small></span><b className="text-xl text-slate-950">{item.score}%</b><ArrowRight className="h-4 w-4 text-slate-300" /></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${item.score}%` }} /></div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="text-xs font-black uppercase tracking-[.13em] text-amber-800">Что сейчас мешает выйти на пробник</p><h2 className="mt-1 text-lg font-black text-slate-950">{MODULE_META[readiness.weakest].title} — {weak.score}%</h2><p className="mt-1 text-sm leading-6 text-slate-700">Это самый слабый из навыков, которые приложение может измерить по вашим реальным результатам.{topError ? ` В письмах чаще всего повторяется: ${topError.tag} (${topError.count}).` : ' Конкретные типы ошибок появятся здесь после того, как Отто действительно их зафиксирует.'}</p></div></div>
        <button type="button" onClick={() => onSelectModule(readiness.weakest)} className="mt-4 min-h-11 w-full rounded-xl bg-amber-900 px-4 font-black text-white">Потренировать слабое место</button>
      </section>

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2"><Brain className="h-5 w-5 text-amber-700" /><h2 className="text-lg font-black text-slate-950">Мои ошибки</h2></div>
        {learning.errors.length ? (
          <div className="mt-3 space-y-2">
            {learning.errors.slice(0, 5).map((error) => (
              <div key={error.tag} className="rounded-xl bg-amber-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3"><strong className="text-sm text-slate-900">{error.tag}</strong><span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-black text-amber-800">{error.count}</span></div>
                {error.examples[0] && <p className="mt-1 text-xs leading-5 text-slate-600"><span className="line-through">{error.examples[0].original}</span> → <span className="font-semibold text-emerald-700">{error.examples[0].corrected}</span></p>}
              </div>
            ))}
          </div>
        ) : <p className="mt-2 text-sm leading-6 text-slate-500">Пока здесь пусто. После проверки писем Отто начнёт объединять повторяющиеся проблемы, а не показывать страшный список красных ошибок.</p>}
      </section>

      <section className="mt-6 rounded-[24px] border border-teal-100 bg-teal-50/60 p-4 sm:p-5">
        <div className="flex items-center gap-2"><Quote className="h-5 w-5 text-teal-700" /><h2 className="text-lg font-black text-slate-950">Мои фразы</h2></div>
        {learning.phrases.length ? (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {learning.phrases.slice(0, 8).map((phrase) => <span key={phrase.text} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">{phrase.text}</span>)}
            </div>
            <button type="button" onClick={onOpenPhrases} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 font-black text-white">Сказать мои фразы вслух <ArrowRight className="h-4 w-4" /></button>
          </>
        ) : <p className="mt-2 text-sm leading-6 text-slate-500">Полезные конструкции будут появляться из ваших реальных писем и исправлений. Отдельно зубрить список из 100 фраз не нужно.</p>}
      </section>

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-lg font-black text-slate-950">Что уже умею</h2>
        <div className="mt-3 space-y-2">
          {MODULE_ORDER.map((id) => {
            const item = readiness.modules[id];
            const text = item.attempts === 0
              ? `${MODULE_META[id].title}: ещё нет измеренных попыток.`
              : item.score >= 80
                ? `${MODULE_META[id].title}: результат уже повторяется достаточно уверенно.`
                : item.score >= 65
                  ? `${MODULE_META[id].title}: основа есть, но нужна устойчивость.`
                  : `${MODULE_META[id].title}: этот навык пока требует поддержки Отто.`;
            return <p key={id} className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700">{text}</p>;
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-teal-100 bg-teal-50/70 p-4 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[.14em] text-teal-700">Эта неделя</p>
        <div className="mt-2 flex items-end gap-3"><strong className="text-3xl font-black text-slate-950">{week.length}</strong><span className="pb-1 text-sm text-slate-600">завершённых попыток</span></div>
        {weekMinutes > 0 && <p className="mt-1 text-sm text-slate-600">Активная практика: около {weekMinutes} мин.</p>}
      </section>

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3"><Trophy className="h-6 w-6 shrink-0 text-teal-700" /><div><p className="text-xs font-black uppercase tracking-[.13em] text-slate-400">Пробный экзамен</p><h2 className="mt-1 text-xl font-black text-slate-950">{readiness.mockLabel}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{readiness.mockStatus === 'recommended' ? 'У вас есть запас выше внутреннего ориентира 75–80%, нет критически слабого раздела и результаты повторяются.' : 'Пробник доступен всегда. Статус — рекомендация Отто, а не запрет.'}</p></div></div>
        <button type="button" onClick={onOpenMockExam} className="mt-4 min-h-11 w-full rounded-xl bg-slate-950 px-4 font-black text-white">Открыть пробный экзамен</button>
      </section>

      <section className="otto-readiness-path mt-6">
        <h2 className="text-xl font-black text-slate-950">Ваш путь</h2>
        <div className="mt-3 space-y-2">
          {pathSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-700"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span>{step}</div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Это маршрут, а не блокировка: любой раздел можно открыть в любой момент.</p>
      </section>
    </div>
  );
}
