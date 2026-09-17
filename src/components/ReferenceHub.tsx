import { BookOpenCheck, ChevronRight, CircleHelp, GraduationCap, Newspaper, Route, UserRound } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';

interface Props{
  onOpenInstructions:()=>void;
  onOpenExamGuide:()=>void;
  onOpenHowTo:()=>void;
  onOpenAccount:()=>void;
  onOpenNews:()=>void;
}

export function ReferenceHub({onOpenInstructions,onOpenExamGuide,onOpenHowTo,onOpenAccount,onOpenNews}:Props){
  const items=[
    {title:'Как выполнять задания',copy:'Короткие правила работы с заданиями OTTO.',Icon:CircleHelp,onClick:onOpenInstructions},
    {title:'Как проходит экзамен A1',copy:'Структура экзамена и важные ориентиры по частям.',Icon:GraduationCap,onClick:onOpenExamGuide},
    {title:'Как тренироваться',copy:'Как сочетать ежедневную тренировку и самостоятельные модули.',Icon:Route,onClick:onOpenHowTo},
    {title:'Мой прогресс',copy:'Статистика попыток и результаты по навыкам.',Icon:UserRound,onClick:onOpenAccount},
    {title:'Новости A1',copy:'Обновления и полезная информация внутри OTTO.',Icon:Newspaper,onClick:onOpenNews},
  ];
  return <div className="animate-fade-in pb-8">
    <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-[#dff2ed] p-5 sm:p-6">
      <div className="relative z-10 max-w-[70%]"><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#0F7D74]">OTTO A1</p><h1 className="mt-1 text-2xl font-black text-slate-950">Справочник</h1><p className="mt-2 text-sm leading-6 text-slate-600">Все уже существующие полезные материалы — в одном месте, без дублирования.</p></div>
      <OttoScene scene="guide" className="absolute -bottom-16 -right-7 h-48 w-auto max-w-none sm:-bottom-20 sm:right-0 sm:h-56"/>
    </section>
    <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,.07)] sm:p-5">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4f0] text-[#0F7D74]"><BookOpenCheck className="h-5 w-5"/></span><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#0F7D74]">Материалы</p><h2 className="text-xl font-black text-slate-950">Что открыть</h2></div></div>
      <div className="mt-4 space-y-2">{items.map(({title,copy,Icon,onClick})=><button key={title} type="button" onClick={onClick} className="flex min-h-[74px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0F7D74]"><Icon className="h-5 w-5"/></span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-950">{title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{copy}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-slate-400"/></button>)}</div>
    </section>
  </div>;
}
