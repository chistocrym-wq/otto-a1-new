import { BookOpen, Home, Settings, Target, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OttoProductMode } from '@/lib/productMode';
import { useUiLanguage, type UiKey } from '@/lib/i18n';

export type BottomTab='home'|'modules'|'readiness'|'account'|'settings';
interface Props{active:BottomTab;onNavigate:(tab:BottomTab)=>void;mode?:OttoProductMode}
const fullItems:[BottomTab,UiKey,typeof Home][]=[['home','today',Home],['modules','modules',BookOpen],['readiness','readiness',Target],['account','account',UserRound],['settings','settings',Settings]];
const basicItems:[BottomTab,UiKey,typeof Home][]=[['home','home',Home],['modules','modules',BookOpen],['account','account',UserRound],['settings','settings',Settings]];
export function BottomNav({active,onNavigate,mode='full'}:Props){const{lang,t}=useUiLanguage();const items=mode==='basic'?basicItems:fullItems;return <nav className="otto-bottom-nav" aria-label={lang==='de'?'Hauptnavigation':'Основная навигация'}><div className="otto-bottom-nav-inner">{items.map(([id,key,Icon])=>{const selected=active===id;return <button key={id} type="button" onClick={()=>onNavigate(id)} className={cn('otto-bottom-nav-item',selected&&'is-active')} aria-current={selected?'page':undefined}><Icon className="otto-bottom-nav-icon"/><span>{t(key)}</span></button>})}</div></nav>}
