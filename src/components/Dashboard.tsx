import { useMemo, useState } from 'react';
import { ArrowRight, BarChart3, BookOpen, Clock3, Headphones, Lightbulb, MessageCircleMore, PenLine, Share2 } from 'lucide-react';
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
const serifFont={fontFamily:'Georgia, "Times New Roman", serif'};
const sansFont={fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'};

export function Dashboard(props:DashboardProps){
 const{lang,t}=useUiLanguage();
 const[minutes,setMinutes]=useState<Minutes>(()=>{const s=Number(localStorage.getItem('otto-a1-session-minutes'));return s===5||s===15||s===30?s:15});
 const readiness=useMemo(()=>getReadiness(props.progress,props.activity),[props.progress,props.activity]);
 const today=useMemo(()=>getTodayActivity(props.activity),[props.activity]);
 const overall=readiness.overall;
 const chooseMinutes=(value:Minutes)=>{setMinutes(value);try{localStorage.setItem('otto-a1-session-minutes',String(value))}catch{/* ignore */}props.onOpenDailyTraining(value)};

 return <div className="animate-fade-in h-full space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain pb-5 text-[var(--otto-ink)] [scrollbar-width:none]" style={sansFont}>
   <section className="relative overflow-hidden rounded-[28px] border border-[var(--otto-line)] bg-[var(--otto-petrol-soft)] px-5 py-4 shadow-[0_14px_36px_rgba(43,54,54,.07)] sm:px-6">
     <div className="relative z-10 max-w-[72%]"><p className="text-[11px] font-[850] uppercase tracking-[.16em] text-[var(--otto-petrol-dark)]">OTTO A1</p><h1 className="mt-1 text-2xl font-bold leading-[1.05] text-[var(--otto-ink)] sm:text-3xl" style={serifFont}>{lang==='de'?'Heute weiter zum A1':'Сегодня — ещё шаг к A1'}</h1><p className="mt-1 text-sm leading-6 text-[var(--otto-muted)]">{lang==='de'?'Wählen Sie eine kurze Trainingseinheit oder einen Bereich.':'Выберите короткую тренировку или нужный навык.'}</p></div>
     <OttoScene scene="home" className="absolute -bottom-16 -right-7 h-48 w-auto max-w-none sm:-bottom-20 sm:right-0 sm:h-56" />
   </section>

   <button type="button" onClick={props.onOpenReadiness} className="w-full rounded-[24px] border border-[var(--otto-line)] bg-[var(--otto-surface)] p-4 text-left shadow-[0_12px_30px_rgba(43,54,54,.07)] sm:p-5">
     <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]"><BarChart3 className="h-5 w-5"/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><strong className="text-base text-[var(--otto-ink)]">{lang==='de'?'A1-Bereitschaft':'Готовность к A1'}</strong><b className="text-xl text-[var(--otto-ink)]">{overall===null?'—':`${overall}%`}</b></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--otto-sage-soft)]"><div className="h-full rounded-full bg-[var(--otto-petrol)] transition-all" style={{width:`${overall??0}%`}}/></div><p className="mt-2 text-xs leading-5 text-[var(--otto-muted)]">{readiness.evidenceLabel}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-[var(--otto-muted)]"/></div>
   </button>

   <section className="rounded-[24px] border border-[var(--otto-line)] bg-[var(--otto-surface)] p-4 shadow-[0_12px_30px_rgba(43,54,54,.07)] sm:p-5">
     <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">{t('today')}</p><h2 className="text-xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>{lang==='de'?'Training':'Тренировка'}</h2></div><Clock3 className="h-5 w-5 text-[var(--otto-muted)]"/></div>
     <p className="mt-1 text-sm text-[var(--otto-muted)]">{lang==='de'?'Wie viel Zeit haben Sie?':'Сколько времени есть на тренировку?'}</p>
     <div className="mt-4 grid grid-cols-3 gap-2">{([5,15,30] as Minutes[]).map(value=><button key={value} type="button" onClick={()=>chooseMinutes(value)} aria-pressed={minutes===value} className={`min-h-16 rounded-2xl border px-2 transition ${minutes===value?'border-[var(--otto-petrol)] bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]':'border-[var(--otto-line)] bg-[var(--otto-bg-soft)] text-[var(--otto-muted)]'}`}><strong className="block text-xl">{value}</strong><span className="text-xs font-bold">{t('minutes')}</span></button>)}</div>
     {today.attempts>0&&<p className="mt-3 text-xs font-semibold text-[var(--otto-muted)]">Попытки сегодня: {today.attempts}{today.minutes?` · ${today.minutes} мин`:''}</p>}
   </section>

   <section className="rounded-[24px] border border-[var(--otto-line)] bg-[var(--otto-surface)] p-4 shadow-[0_12px_30px_rgba(43,54,54,.07)] sm:p-5">
     <div className="flex items-end justify-between gap-3"><div><p className="text-[11px] font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">A1</p><h2 className="text-xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>{lang==='de'?'Selbstständig üben':'Самостоятельные занятия'}</h2></div><button type="button" onClick={props.onOpenHowTo} title="Как тренироваться" aria-label="Как тренироваться" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--otto-line)] bg-[var(--otto-surface)] text-[var(--otto-muted)]"><Lightbulb className="h-4 w-4"/></button></div>
     <div className="mt-4 grid grid-cols-2 gap-3">{moduleOrder.map(id=>{const Icon=moduleIcons[id];const module=readiness.modules[id];return <button key={id} type="button" onClick={()=>props.onSelectModule(id)} className="min-h-[118px] rounded-2xl border border-[var(--otto-line)] bg-[var(--otto-bg-soft)] p-4 text-left transition hover:border-[var(--otto-petrol)]"><span className="flex items-start justify-between gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--otto-surface)] text-[var(--otto-petrol-dark)]"><Icon className="h-5 w-5"/></span><b className="text-sm text-[var(--otto-muted)]">{module.dataSufficient?`${module.score}%`:'—'}</b></span><strong className="mt-3 block text-base text-[var(--otto-ink)]">{MODULE_META[id].title}</strong><span className="mt-1 block text-xs text-[var(--otto-muted)]">{MODULE_META[id].label}</span></button>})}</div>
   </section>

   <div className="grid gap-2 sm:grid-cols-2">
     <button type="button" onClick={props.onOpenNews} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--otto-line)] bg-[var(--otto-surface)] px-4 text-sm font-bold text-[var(--otto-ink)]"><BookOpen className="h-4 w-4"/>Новости A1</button>
     <button type="button" onClick={props.onShare} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--otto-line)] bg-[var(--otto-surface)] px-4 text-sm font-bold text-[var(--otto-ink)]"><Share2 className="h-4 w-4"/>Поделиться</button>
   </div>
 </div>;
}
