import { ArrowRight, CheckCircle2, Target, TriangleAlert } from 'lucide-react';
import type { ActivityEntry, ModuleId, Progress } from '@/types';
import { buildLearningInsights, moduleInsightLabel } from '@/lib/learningInsights';

interface Props{progress:Progress;activity:ActivityEntry[];onSelectModule:(module:ModuleId)=>void}

export function MyErrorsPage({progress,activity,onSelectModule}:Props){
  const insights=buildLearningInsights(progress,activity);
  const strongest=insights.strongest;
  const weakest=insights.weakest;
  const topProblems=insights.problems.slice(0,4);
  const nextModule=topProblems[0]?.module??weakest?.id??null;

  return <div className="animate-fade-in space-y-4 pb-8">
    <section className="rounded-[28px] border border-white/90 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,.07)] sm:p-6">
      <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#0F7D74]">Персональная работа</p>
      <h1 className="mt-1 text-2xl font-black text-slate-950">Мои ошибки</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Отто использует только реальные результаты тренировок: ошибки Lesen/Hören, разбор Schreiben и измеренные результаты Sprechen. Если данных мало, слабое место не придумывается.</p>
    </section>

    {!insights.hasData&&<section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><Target className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"/><div><h2 className="font-black text-amber-950">Сначала нужна небольшая диагностика</h2><p className="mt-1 text-sm leading-6 text-amber-900">Выполните несколько заданий хотя бы в двух модулях. После этого здесь появятся сильная сторона, повторяющиеся проблемы и следующий шаг.</p></div></div></section>}

    <div className="grid gap-3 sm:grid-cols-2">
      <section className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-center gap-2 text-emerald-800"><CheckCircle2 className="h-5 w-5"/><b>Что уже получается</b></div>
        {strongest?<><h2 className="mt-3 text-xl font-black text-slate-950">{moduleInsightLabel(strongest.id)}</h2><p className="mt-1 text-sm leading-6 text-slate-600">Средний результат по доступным попыткам: <b>{strongest.average}%</b>. Сейчас это наиболее устойчивый навык по накопленным данным.</p></>:<p className="mt-3 text-sm leading-6 text-slate-600">Пока недостаточно попыток, чтобы назвать самый сильный навык.</p>}
      </section>
      <section className="rounded-[24px] border border-rose-100 bg-rose-50 p-5">
        <div className="flex items-center gap-2 text-rose-800"><TriangleAlert className="h-5 w-5"/><b>Что требует внимания</b></div>
        {topProblems[0]?<><h2 className="mt-3 text-xl font-black text-slate-950">{topProblems[0].label}</h2><p className="mt-1 text-sm leading-6 text-slate-600">Эта проблема встречалась <b>{topProblems[0].count}</b> {topProblems[0].count===1?'раз':'раз(а)'}.{topProblems[0].example?` Пример: ${topProblems[0].example}`:''}</p></>:weakest?<><h2 className="mt-3 text-xl font-black text-slate-950">{moduleInsightLabel(weakest.id)}</h2><p className="mt-1 text-sm leading-6 text-slate-600">Средний результат: <b>{weakest.average}%</b>. Детальные повторяющиеся ошибки появятся после следующих заданий.</p></>:<p className="mt-3 text-sm leading-6 text-slate-600">Слабое место появится после нескольких тренировок.</p>}
      </section>
    </div>

    {topProblems.length>0&&<section className="rounded-[24px] border border-white/90 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.06)]"><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#0F7D74]">Повторяющиеся проблемы</p><h2 className="mt-1 text-xl font-black text-slate-950">Что именно повторить</h2><div className="mt-4 space-y-2">{topProblems.map(problem=><div key={problem.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><b className="text-slate-950">{problem.label}</b><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500">{problem.count}×</span></div>{problem.example&&<p className="mt-2 break-words text-xs leading-5 text-slate-600">{problem.example}</p>}</div>)}</div></section>}

    <section className="rounded-[24px] border border-white/90 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.06)]">
      <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#0F7D74]">Сегодня потренируем</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{nextModule?moduleInsightLabel(nextModule):'Любой основной модуль'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{nextModule?'Отто направляет в модуль, связанный с самой частой фактической проблемой или самым слабым измеренным навыком. После новых результатов маршрут изменится автоматически.':'Начните с любого раздела — после первых результатов Отто сможет дать персональное направление.'}</p>
      {nextModule&&<button type="button" onClick={()=>onSelectModule(nextModule)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">Тренировать {moduleInsightLabel(nextModule)} <ArrowRight className="h-4 w-4"/></button>}
    </section>
  </div>;
}
