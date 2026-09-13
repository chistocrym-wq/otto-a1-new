import { useEffect, useState } from 'react';
import { Bell, Globe2, Play, Smartphone, Volume1, Volume2 } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';
import { UI_LANGUAGES, useUiLanguage } from '@/lib/i18n';
import { notificationCapability, readReminder, requestNotifications, saveReminder, type ReminderSettings } from '@/lib/reminders';

type SpeechMode='normal'|'slow';
type OttoSpeechApi={play?:(text:string,options?:{mode?:SpeechMode})=>Promise<boolean>;setMode?:(mode:SpeechMode)=>void};
function speechApi(){return(window as Window&{OttoSpeech?:OttoSpeechApi}).OttoSpeech}
const DAY_KEYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;

export function SettingsPage(){
  const{lang,setLanguage,t}=useUiLanguage();
  const[voiceMode,setVoiceMode]=useState<SpeechMode>(()=>{try{return localStorage.getItem('ottoSpeechModeV1')==='slow'?'slow':'normal'}catch{return'normal'}});
  const[reminder,setReminder]=useState<ReminderSettings>(readReminder);
  const[permission,setPermission]=useState(()=>notificationCapability());
  const[notice,setNotice]=useState('');
  useEffect(()=>{document.documentElement.lang=lang},[lang]);
  const changeVoice=(mode:SpeechMode)=>{setVoiceMode(mode);speechApi()?.setMode?.(mode);try{localStorage.setItem('ottoSpeechModeV1',mode)}catch{}};
  const testVoice=()=>void speechApi()?.play?.('Hallo. Ich heiße Otto. Schön, dass du da bist.',{mode:voiceMode});
  const toggleDay=(day:number)=>setReminder(v=>({...v,days:v.days.includes(day)?v.days.filter(x=>x!==day):[...v.days,day].sort()}));
  const enableNotifications=async()=>{const next=await requestNotifications();setPermission(next);setNotice(next==='granted'?t('notificationSaved'):next==='unsupported'?t('notificationUnsupported'):t('notificationDenied'))};
  const commitReminder=()=>{const next={...reminder,enabled:reminder.days.length>0};saveReminder(next);setReminder(next);setNotice(t('notificationSaved'))};
  return <div className="otto-hub-screen otto-settings-screen animate-fade-in">
    <section className="otto-page-hero"><div><p className="otto-kicker">{t('settings')}</p><h1>OTTO A1</h1><p className="mt-1 max-w-lg text-sm text-slate-600">{lang==='de'?'Sprache, Trainingserinnerungen und Audio-Einstellungen.':'Язык интерфейса, напоминания о тренировках и звук.'}</p></div><div className="otto-page-hero-character" aria-hidden="true"><OttoScene scene="guide" className="otto-page-hero-scene"/></div></section>

    <section className="rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,.08)] sm:p-5">
      <div className="flex items-start gap-3"><span className="otto-setting-icon"><Globe2/></span><div><p className="otto-kicker">{t('language')}</p><h2 className="text-xl font-black text-slate-950">{lang==='de'?'Oberflächensprache':'Язык приложения'}</h2></div></div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{t('uiLanguageHint')}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">{UI_LANGUAGES.map(item=><button key={item.id} type="button" onClick={()=>setLanguage(item.id)} className={`min-h-12 rounded-xl border px-4 font-bold ${lang===item.id?'border-[#0F7D74] bg-[#EAF4F0] text-[#285C59]':'border-slate-200 bg-white text-slate-600'}`} aria-pressed={lang===item.id}>{item.native}</button>)}</div>
    </section>

    <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,.08)] sm:p-5">
      <div className="flex items-start gap-3"><span className="otto-setting-icon"><Bell/></span><div><p className="otto-kicker">{t('reminders')}</p><h2 className="text-xl font-black text-slate-950">{lang==='de'?'Wann soll OTTO erinnern?':'Когда напомнить о тренировке?'}</h2></div></div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{t('notificationNote')}</p>
      <div className="mt-4"><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">{t('days')}</p><div className="grid grid-cols-7 gap-1">{DAY_KEYS.map((key,day)=><button key={key} type="button" onClick={()=>toggleDay(day)} className={`min-h-10 rounded-lg border text-xs font-black ${reminder.days.includes(day)?'border-[#0F7D74] bg-[#EAF4F0] text-[#285C59]':'border-slate-200 bg-white text-slate-500'}`}>{t(key)}</button>)}</div></div>
      <label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-400">{t('time')}<input type="time" value={reminder.time} onChange={e=>setReminder(v=>({...v,time:e.target.value}))} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"/></label>
      <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={enableNotifications} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700">{permission==='granted'?(lang==='de'?'Benachrichtigungen erlaubt':'Уведомления разрешены'):t('notificationPermission')}</button><button type="button" onClick={commitReminder} className="min-h-12 rounded-xl bg-[#9E543C] px-4 font-black text-white">{t('save')}</button></div>
      {notice&&<p role="status" className="mt-3 rounded-xl bg-[#F4F7F2] px-3 py-2 text-sm text-slate-700">{notice}</p>}
    </section>

    <section className="otto-voice-settings mt-4" aria-labelledby="otto-voice-heading"><div className="otto-voice-heading-row"><span className="otto-setting-icon"><Volume2/></span><div><p className="otto-kicker">{lang==='de'?'OTTO-Stimme':'Фирменный голос'}</p><h2 id="otto-voice-heading">{lang==='de'?'Sprechtempo':'Как говорит Отто'}</h2></div></div><p className="otto-voice-copy">{lang==='de'?'Wählen Sie normales oder etwas langsameres Deutsch.':'Выберите естественный темп или чуть более медленную немецкую речь.'}</p><div className="otto-voice-mode" role="group"><button type="button" className={voiceMode==='normal'?'is-active':''} onClick={()=>changeVoice('normal')}><Volume2/>{lang==='de'?'Normal':'Нормально'}</button><button type="button" className={voiceMode==='slow'?'is-active':''} onClick={()=>changeVoice('slow')}><Volume1/>{lang==='de'?'Langsamer':'Медленнее'}</button></div><button type="button" className="otto-voice-test" onClick={testVoice}><Play/>{lang==='de'?'OTTO anhören':'Послушать голос Отто'}</button></section>

    <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 sm:p-5"><div className="flex gap-3"><span className="otto-setting-icon"><Smartphone/></span><div><h2 className="font-black text-slate-950">{t('install')}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{lang==='de'?'Wenn Ihr Browser „App installieren“ oder „Zum Startbildschirm hinzufügen“ anbietet, können Sie OTTO als eigene App öffnen.':'Если браузер предлагает «Установить приложение» или «Добавить на главный экран», OTTO можно запускать как отдельное приложение.'}</p></div></div></section>
  </div>;
}
