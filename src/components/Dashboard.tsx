import { useMemo, useState } from 'react';
import { ArrowRight, BarChart3, BookOpen, Clock3, Headphones, Lightbulb, MessageCircleMore, PenLine, Share2, Trophy } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';
import type { ActivityEntry, ModuleId, Progress } from '@/types';
import { getReadiness, getTodayActivity, MODULE_META } from '@/lib/preparation';
import { useUiLanguage } from '@/lib/i18n';

interface DashboardProps {
  onSelectModule:(module:ModuleId)=>void;
  onOpenInstructions:()=>void;
  onOpenExamGuide:()=>void;
  onOpenMockExam:()=>void;
  onOpenNews:()=>void;
  onOpenAccount:()=>void;
  onOpenSettings:()=>void;
  onOpenReadiness:()=>void;
  onShare:()=>void;
  onOpenSupport:()=>void;
  onOpenDailyTraining:(minutes:Minutes)=>void;
  onOpenHowTo:()=>void;
  progress:Progress;
  activity:ActivityEntry[];
}

export type Minutes=5|15|30;
const moduleIcons:Record<ModuleId,typeof PenLine>={schreiben:PenLine,sprechen:MessageCircleMore,lesen:BookOpen,horen:Headphones};
const moduleOrder:ModuleId[]=['schreiben','sprechen','horen','lesen'];

export function Dashboard(props:DashboardProps){
 const{lang,t}=useUiLanguage();
 const[minutes,setMinutes]=useState<Minutes>(()=>{const s=Number(localStorage.getItem('otto-a1-session-minutes'));return s===5||s===15||s===30?s:15});
 const readiness=useMemo(()=>getReadiness(props.progress,props.activity),[props.progress,props.activity]);
 const today=useMemo(()=>getTodayActivity(props.activity),[props.activity]);
 const overall=readiness.overall;
 const chooseMinutes=(value:Minutes)=>{setMinutes(value);try{localStorage.setItem('otto-a1-session-minutes',String(value))}catch{/* ignore */}props.onOpenDailyTraining(value)};

 return <div className="animate-fade-in space-y-4 pb-5">
   <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-[#dff2ed] px-5 py-4 shadow-[0_14px_36px_rgba(15,23,42,.07)] sm:px-6">
     <div className="relative z-10 max-w-[72%]"><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#0F7D74]">OTTO A1</p><h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">{lang==='de'?'Heute weiter zum A1':'Сегодня — ещё шаг к A1'}</h1><p className="mt-1 text-sm leading-6 text-slate-600">{lang==='de'?'Wählen Sie eine kurze Trainingseinheit oder einen Bereich.':'Выберите короткую тренировку или нужный навык.'}</p></div>
     <OttoScene scene="home" className="absolute -bottom-16 -right-7 h-48 w-auto max-w-none sm:-bottom-20 sm:right-0 sm:h-56" />
   </section>

   <button type="button" onClick={props.onOpenReadiness} className="w-full rounded-[24px] border border-white/90 bg-white p-4 text-left shadow-[0_12px_30px_rgba(15,23,42,.07)] sm:p-5">
     <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf4f0] text-[#0F7D74]"><BarChart3 className="h-5 w-5"/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><strong className="text-base text-slate-950">{lang==='de'?'A1-Bereitschaft':'Готовность к A1'}</strong><b className="text-xl text-slate-950">{overall===null?'—':`${overall}%`}</b></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{width:`${overall??0}%`,background:'linear-gradient(90deg,#c96558 0%,#d9ad4a 52%,#3f9b78 100%)'}}/></div><p className="mt-2 text-xs leading-5 text-slate-500">{readiness.evidenceLabel}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-400"/></div>
   </button>

   <section className="rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,.07)] sm:p-5">
     <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#0F7D74]">{t('today')}</p><h2 className="text-xl font-black text-slate-950">{lang==='de'?'Training':'Тренировка'}</h2></div><Clock3 className="h-5 w-5 text-slate-400"/></div>
     <p className="mt-1 text-sm text-slate-500">{lang==='de'?'Wie viel Zeit haben Sie?':'Сколько времени есть сейчас?'}</p>
     <div className="mt-4 grid grid-cols-3 gap-2">{([5,15,30] as Minutes[]).map(value=><button key={value} type="button" onClick={()=>chooseMinutes(value)} aria-pressed={minutes===value} className={`min-h-16 rounded-2xl border px-2 transition ${minutes===value?'border-[#0F7D74] bg-[#eaf4f0] text-[#205f5a]':'border-slate-200 bg-slate-50 text-slate-700'}`}><strong className="block text-xl">{value}</strong><span className="text-xs font-bold">{t('minutes')}</span></button>)}</div>
     {today.attempts>0&&<p className="mt-3 text-xs font-semibold text-slate-500">Сегодня: {today.attempts} попыток{today.minutes?` · ${today.minutes} мин`:''}</p>}
   </section>

   <section className="rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,.07)] sm:p-5">
     <div className="flex items-end justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#0F7D74]">A1</p><h2 className="text-xl font-black text-slate-950">{lang==='de'?'Selbstständig üben':'Самостоятельные занятия'}</h2></div><button type="button" onClick={props.onOpenHowTo} title="Как тренироваться" aria-label="Как тренироваться" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"><Lightbulb className="h-4 w-4"/></button></div>
     <div className="mt-4 grid grid-cols-2 gap-3">{moduleOrder.map(id=>{const Icon=moduleIcons[id];const module=readiness.modules[id];return <button key={id} type="button" onClick={()=>props.onSelectModule(id)} className="min-h-[118px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#78bdb5]"><span className="flex items-start justify-between gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F7D74]"><Icon className="h-5 w-5"/></span><b className="text-sm text-slate-500">{module.dataSufficient?`${module.score}%`:'—'}</b></span><strong className="mt-3 block text-base text-slate-950">{MODULE_META[id].title}</strong><span className="mt-1 block text-xs text-slate-500">{MODULE_META[id].label}</span></button>})}</div>
   </section>

   <div className="grid gap-2 sm:grid-cols-3">
     <button type="button" onClick={props.onOpenMockExam} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><Trophy className="h-4 w-4 text-amber-600"/>Пробный экзамен</button>
     <button type="button" onClick={props.onOpenNews} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><BookOpen className="h-4 w-4"/>Новости A1</button>
     <button type="button" onClick={props.onShare} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><Share2 className="h-4 w-4"/>Поделиться</button>
   </div>
 </div>;
}
