import { BarChart3, BookOpenCheck, CheckCircle2, Clock3, Target } from 'lucide-react';
import type { ActivityEntry, Progress } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';
import { OttoScene } from '@/components/OttoScene';
import { getReadiness, MODULE_META, MODULE_ORDER } from '@/lib/preparation';

interface Props { progress: Progress; activity: ActivityEntry[] }

function getUserName(){
  try{
    const saved=localStorage.getItem('otto-user-name')?.trim();
    if(saved)return saved;
    const telegram=(window as Window & {Telegram?:{WebApp?:{initDataUnsafe?:{user?:{first_name?:string}}}}}).Telegram?.WebApp?.initDataUnsafe?.user?.first_name?.trim();
    if(telegram){localStorage.setItem('otto-user-name',telegram);return telegram}
  }catch{/* ignore */}
  return '';
}
function formatMinutes(seconds:number){const min=Math.round(seconds/60);if(min<60)return `${min} мин`;const h=Math.floor(min/60),m=min%60;return m?`${h} ч ${m} мин`:`${h} ч`}

export function AccountPage({ progress, activity }: Props) {
  const readiness=getReadiness(progress),name=getUserName();
  let answered=0,correct=0,attempts=0;
  MODULE_ORDER.forEach((id)=>{answered+=progress[id]?.answered??0;correct+=progress[id]?.correct??0;attempts+=progress[id]?.attempts??0});
  const accuracy=answered?Math.round((correct/answered)*100):0;
  const seconds=activity.reduce((sum,item)=>sum+Math.max(0,item.durationSeconds??0),0);
  const weak=MODULE_META[readiness.weakest];
  const recent=activity.slice(0,6);

  return <div className="otto-hub-screen animate-fade-in">
    <section className="otto-page-hero otto-account-hero"><div><p className="otto-kicker">Личный кабинет</p><h1>{name?`${name}, ваш прогресс A1`:'Ваш прогресс в подготовке A1'}</h1></div><div className="otto-page-hero-character" aria-hidden="true"><OttoScene scene="home" className="otto-page-hero-scene"/></div></section>

    <section className="otto-account-card">
      <div className="otto-account-stat"><span><BarChart3/></span><strong>{answered}</strong><small>проверенных ответов</small></div>
      <div className="otto-account-stat"><span><CheckCircle2/></span><strong>{answered?`${accuracy}%`:'—'}</strong><small>точность</small></div>
      <div className="otto-account-stat"><span><Clock3/></span><strong>{seconds?formatMinutes(seconds):'0 мин'}</strong><small>активной практики</small></div>
    </section>

    <section className="otto-account-summary otto-card rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,.08)]">
      <div className="mb-2 flex items-center justify-between"><div><p className="otto-kicker">Что потренировать сейчас</p><h2 className="text-lg font-black text-slate-950">{readiness.hasEnoughData?weak.title:'Собираем устойчивые данные'}</h2></div><Target className="h-7 w-7 text-[#0F7D74]"/></div>
      {readiness.hasEnoughData?<><ProgressBar value={readiness.overall} max={100}/><p className="mt-3 text-sm leading-6 text-slate-600">Общая готовность: {readiness.overall}%. {readiness.riskMessage??`Сейчас слабее остальных — ${weak.title}.`}</p></>:<p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Пройдите ещё {readiness.remainingAttempts} заданий/попыток, чтобы Отто мог показать устойчивую оценку, а не случайный процент.</p>}
      <p className="mt-2 text-xs text-slate-500">В статистику входят только реально проверенные действия. Повторное открытие уже выполненного задания само по себе ничего не начисляет.</p>
    </section>

    <section className="mt-5 grid gap-3 sm:grid-cols-2">
      {MODULE_ORDER.map(id=>{const m=readiness.modules[id];return <div key={id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><strong>{MODULE_META[id].title}</strong><b>{m.attempts?`${m.score}%`:'—'}</b></div><p className="mt-1 text-xs text-slate-500">Попыток: {m.attempts} · ответов: {Math.round(m.answered)}</p><p className="mt-2 text-xs leading-5 text-slate-600">{m.note}</p></div>})}
    </section>

    <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-teal-700"/><h2 className="text-lg font-black text-slate-950">Последние результаты</h2></div>
      {recent.length?<div className="mt-3 space-y-2">{recent.map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"><div><strong className="text-sm text-slate-900">{MODULE_META[item.module as keyof typeof MODULE_META]?.title??item.module}</strong><p className="mt-0.5 text-xs text-slate-500">{new Date(item.at).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</p></div><b className="text-teal-800">{item.percent}%</b></div>)}</div>:<p className="mt-2 text-sm text-slate-500">Пока нет завершённых попыток.</p>}
    </section>
  </div>;
}
