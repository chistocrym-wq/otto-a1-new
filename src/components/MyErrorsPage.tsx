import { ArrowRight, CheckCircle2, Target, TriangleAlert } from 'lucide-react';
import type { ActivityEntry, ModuleId, Progress } from '@/types';
import { buildLearningInsights, moduleInsightLabel } from '@/lib/learningInsights';

interface Props{progress:Progress;activity:ActivityEntry[];onSelectModule:(module:ModuleId)=>void}

export function MyErrorsPage({progress,activity,onSelectModule}:Props){
  const insights=buildLearningInsights(progress,activity);
  const strongest=insights.strongest;
  const weakest=insights.weakest;
  const writing=insights.writingErrors.slice(0,3);

  return <div className="animate-fade-in space-y-4 pb-8">
    <section className="rounded-[28px] border border-white/90 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,.07)] sm:p-6">
      <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#0F7D74]">Персональная работа</p>
      <h1 className="mt-1 text-2xl font-black text-slate-950">Мои ошибки</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Отто использует только реальные результаты ваших тренировок. Если данных пока мало, он не придумывает слабые места.</p>
    </section>

    {!insights.hasData&&writing.length===0&&<section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><Target className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"/><div><h2 className="font-black text-amber-950">Сначала нужна небольшая диагностика</h2><p className="mt-1 text-sm leading-6 text-amber-900">Выполните несколько заданий хотя бы в двух модулях. После этого здесь появятся сильные стороны и направления для тренировки.</p></div></div></section>}

    <div className="grid gap-3 sm:grid-cols-2">
      <section className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-center gap-2 text-emerald-800"><CheckCircle2 className="h-5 w-5"/><b>Что уже получается</b></div>
        {strongest?<><h2 className="mt-3 text-xl font-black text-slate-950">{moduleInsightLabel(strongest.id)}</h2><p className="mt-1 text-sm leading-6 text-slate-600">Средний результат по доступным попыткам: <b>{strongest.average}%</b>. Это ваш наиболее устойчивый навык по накопленным данным.</p></>:<p className="mt-3 text-sm leading-6 text-slate-600">Пока недостаточно попыток, чтобы назвать самый сильный навык.</p>}
      </section>
      <section className="rounded-[24px] border border-rose-100 bg-rose-50 p-5">
        <div className="flex items-center gap-2 text-rose-800"><TriangleAlert className="h-5 w-5"/><b>Что стоит подтянуть</b></div>
        {weakest?<><h2 className="mt-3 text-xl font-black text-slate-950">{moduleInsightLabel(weakest.id)}</h2><p className="mt-1 text-sm leading-6 text-slate-600">Средний результат: <b>{weakest.average}%</b>{weakest.mistakes>0?` · зафиксировано ошибок: ${weakest.mistakes}`:''}.</p></>:<p className="mt-3 text-sm leading-6 text-slate-600">Слабый навык появится после нескольких тренировок.</p>}
      </section>
    </div>

    {writing.length>0&&<section className="rounded-[24px] border border-white/90 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.06)]"><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#0F7D74]">Schreiben</p><h2 className="mt-1 text-xl font-black text-slate-950">Повторяющиеся ошибки в письме</h2><div className="mt-4 space-y-2">{writing.map(item=><div key={item.tag} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><b className="text-slate-950">{item.tag}</b><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500">{item.count}×</span></div>{item.examples[0]&&<p className="mt-2 text-xs leading-5 text-slate-600"><span className="text-rose-700">{item.examples[0].original}</span><span className="mx-1 text-slate-400">→</span><span className="text-emerald-700">{item.examples[0].corrected}</span></p>}</div>)}</div></section>}

    <section className="rounded-[24px] border border-white/90 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.06)]">
      <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#0F7D74]">Сегодня потренируем</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{weakest?moduleInsightLabel(weakest.id):'Любой основной модуль'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{weakest?'Отто предлагает начать с навыка, где текущий средний результат ниже остальных. После новых попыток рекомендация обновится автоматически.':'Начните с любого раздела — после первых результатов Отто сможет дать персональное направление.'}</p>
      {weakest&&<button type="button" onClick={()=>onSelectModule(weakest.id)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">Тренировать {moduleInsightLabel(weakest.id)} <ArrowRight className="h-4 w-4"/></button>}
    </section>
  </div>;
}
