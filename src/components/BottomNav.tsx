import { BookOpen, ClipboardCheck, Home, Settings, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OttoProductMode } from '@/lib/productMode';

export type BottomTab='mock-exam'|'errors'|'home'|'reference'|'settings';
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
  {id:'reference',label:'Справочник',Icon:BookOpen},
  {id:'settings',label:'Настройки',Icon:Settings},
];

export function BottomNav({active,onNavigate,mode}:Props){
 const items=mode==='full'?fullItems:basicItems;
 return <nav className="otto-bottom-nav" aria-label="Основная навигация"><div className="otto-bottom-nav-inner">{items.map(({id,label,Icon})=>{
   const selected=active===id;const home=id==='home';
   return <button key={id} type="button" onClick={()=>onNavigate(id)} aria-current={selected?'page':undefined} className={cn('otto-bottom-nav-item',selected&&'is-active',home&&'is-home')}><span className={cn('otto-bottom-nav-icon',home&&'rounded-2xl bg-[#0F7D74] p-2 text-white shadow-sm')}><Icon/></span><span>{label}</span></button>
 })}</div></nav>;
}
