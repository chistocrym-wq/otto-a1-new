import { BookOpenCheck, ChevronRight, CircleHelp, GraduationCap, Newspaper, Route, UserRound } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';

interface Props{
  onOpenInstructions:()=>void;
  onOpenExamGuide:()=>void;
  onOpenHowTo:()=>void;
  onOpenAccount:()=>void;
  onOpenNews:()=>void;
}
const serifFont={fontFamily:'Georgia, "Times New Roman", serif'};
const sansFont={fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'};

export function ReferenceHub({onOpenInstructions,onOpenExamGuide,onOpenHowTo,onOpenAccount,onOpenNews}:Props){
  const items=[
    {title:'Как выполнять задания',copy:'Короткие правила работы с заданиями OTTO.',Icon:CircleHelp,onClick:onOpenInstructions},
    {title:'Как проходит экзамен A1',copy:'Структура экзамена и важные ориентиры по частям.',Icon:GraduationCap,onClick:onOpenExamGuide},
    {title:'Как тренироваться',copy:'Как сочетать ежедневную тренировку и самостоятельные модули.',Icon:Route,onClick:onOpenHowTo},
    {title:'Мой прогресс',copy:'Статистика попыток и результаты по навыкам.',Icon:UserRound,onClick:onOpenAccount},
    {title:'Новости A1',copy:'Обновления и полезная информация внутри OTTO.',Icon:Newspaper,onClick:onOpenNews},
  ];
  return <div className="animate-fade-in pb-8 text-[var(--otto-ink)]" style={sansFont}>
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--otto-line)] bg-[var(--otto-petrol-soft)] p-5 sm:p-6">
      <div className="relative z-10 max-w-[70%]"><p className="text-[11px] font-[850] uppercase tracking-[.16em] text-[var(--otto-petrol-dark)]">OTTO A1</p><h1 className="mt-1 text-2xl font-bold leading-[1.05] text-[var(--otto-ink)]" style={serifFont}>Справочник</h1><p className="mt-2 text-sm leading-6 text-[var(--otto-muted)]">Все уже существующие полезные материалы — в одном месте, без дублирования.</p></div>
      <OttoScene scene="guide" className="absolute -bottom-16 -right-7 h-48 w-auto max-w-none sm:-bottom-20 sm:right-0 sm:h-56"/>
    </section>
    <section className="mt-4 rounded-[24px] border border-[var(--otto-line)] bg-[var(--otto-surface)] p-4 shadow-[0_12px_30px_rgba(43,54,54,.07)] sm:p-5">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]"><BookOpenCheck className="h-5 w-5"/></span><div><p className="text-xs font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">Материалы</p><h2 className="text-xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>Что открыть</h2></div></div>
      <div className="mt-4 space-y-2">{items.map(({title,copy,Icon,onClick})=><button key={title} type="button" onClick={onClick} className="flex min-h-[74px] w-full items-center gap-3 rounded-2xl border border-[var(--otto-line)] bg-[var(--otto-bg-soft)] p-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--otto-surface)] text-[var(--otto-petrol-dark)]"><Icon className="h-5 w-5"/></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[var(--otto-ink)]">{title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--otto-muted)]">{copy}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-[var(--otto-muted)]"/></button>)}</div>
    </section>
  </div>;
}
