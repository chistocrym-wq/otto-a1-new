import { BookOpen, ClipboardCheck, Home, Settings, TriangleAlert, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OttoProductMode } from '@/lib/productMode';

export type BottomTab='mock-exam'|'errors'|'home'|'reference'|'settings'|'modules'|'account';
interface Props{active:BottomTab;onNavigate:(tab:BottomTab)=>void;mode:OttoProductMode}

type NavItem={id:BottomTab;label:string;Icon:typeof Home};
const fullItems:NavItem[]=[
  {id:'mock-exam',label:'Пробный экзамен',Icon:ClipboardCheck},
  {id:'errors',label:'Мои ошибки',Icon:TriangleAlert},
  {id:'home',label:'Главная',Icon:Home},
  {id:'reference',label:'Справочник',Icon:BookOpen},
  {id:'settings',label:'Настройки',Icon:Settings},
];
const basicItems:NavItem[]=[
  {id:'home',label:'Главная',Icon:Home},
  {id:'modules',label:'Разделы',Icon:BookOpen},
  {id:'account',label:'Прогресс',Icon:UserRound},
  {id:'settings',label:'Настройки',Icon:Settings},
];

export function BottomNav({active,onNavigate,mode}:Props){
 const items=mode==='full'?fullItems:basicItems;
 return <nav className="otto-bottom-nav" aria-label="Основная навигация"><div className="otto-bottom-nav-inner">{items.map(({id,label,Icon})=>{
   const selected=active===id;const home=id==='home';
   return <button key={id} type="button" onClick={()=>onNavigate(id)} aria-current={selected?'page':undefined} className={cn('otto-bottom-nav-item',selected&&'is-active',home&&'is-home')}><span className={home?'flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--otto-petrol-dark)] text-white shadow-sm':'otto-bottom-nav-icon'}><Icon className={home?'h-5 w-5':undefined}/></span><span>{label}</span></button>
 })}</div></nav>;
}
