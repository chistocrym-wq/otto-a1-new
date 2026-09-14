import { useState } from 'react';
import { Bell, Globe2, Play, Smartphone, Volume1, Volume2 } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';
import { AVAILABLE_LOCALES, getLocale, setLocale } from '@/lib/i18n';
import { readReminderConfig, saveReminderConfig, type ReminderConfig } from '@/lib/reminders';

type SpeechMode = 'normal' | 'slow';
type OttoSpeechApi = { play?: (text:string, options?:{mode?:SpeechMode})=>Promise<boolean>; setMode?:(mode:SpeechMode)=>void; getMode?:()=>SpeechMode };
function speechApi(){return (window as Window & {OttoSpeech?:OttoSpeechApi}).OttoSpeech}
const DAY_OPTIONS=[{id:1,label:'Пн'},{id:2,label:'Вт'},{id:3,label:'Ср'},{id:4,label:'Чт'},{id:5,label:'Пт'},{id:6,label:'Сб'},{id:0,label:'Вс'}];

export function SettingsPage(){
  const[voiceMode,setVoiceMode]=useState<SpeechMode>(()=>{try{return localStorage.getItem('ottoSpeechModeV1')==='slow'?'slow':'normal'}catch{return'normal'}});
  const[reminder,setReminder]=useState<ReminderConfig>(readReminderConfig);
  const[permission,setPermission]=useState<string>(()=>typeof Notification==='undefined'?'unsupported':Notification.permission);
  const[locale,setLocaleState]=useState(getLocale);

  const changeVoiceMode=(mode:SpeechMode)=>{setVoiceMode(mode);speechApi()?.setMode?.(mode);try{localStorage.setItem('ottoSpeechModeV1',mode)}catch{}};
  const testVoice=()=>{void speechApi()?.play?.('Hallo. Ich heiße Otto. Schön, dass du da bist.',{mode:voiceMode})};
  const updateReminder=(next:ReminderConfig)=>{setReminder(next);saveReminderConfig(next)};
  const requestNotifications=async()=>{if(!('Notification'in window)){setPermission('unsupported');return}const result=await Notification.requestPermission();setPermission(result);if(result==='granted')updateReminder({...reminder,enabled:true})};
  const toggleDay=(day:number)=>{const days=reminder.days.includes(day)?reminder.days.filter(d=>d!==day):[...reminder.days,day];updateReminder({...reminder,days:days.sort()})};

  return <div className="otto-hub-screen otto-settings-screen animate-fade-in">
    <section className="otto-page-hero"><div><p className="otto-kicker">Настройки</p><h1>Тренажёр OTTO</h1><p className="mt-1 max-w-lg text-sm text-slate-600">Комфортная речь, честные напоминания и только полностью проверенные языки интерфейса.</p></div><div className="otto-page-hero-character" aria-hidden="true"><OttoScene scene="guide" className="otto-page-hero-scene"/></div></section>

    <section className="otto-voice-settings" aria-labelledby="otto-voice-heading">
      <div className="otto-voice-heading-row"><span className="otto-setting-icon"><Volume2/></span><div><p className="otto-kicker">Фирменный голос</p><h2 id="otto-voice-heading">Как говорит Отто</h2></div></div>
      <p className="otto-voice-copy">Выберите естественный темп или чуть более медленную речь. Медленный режим сохраняет нормальный немецкий ритм.</p>
      <div className="otto-voice-mode" role="group" aria-label="Скорость немецкой речи"><button type="button" className={voiceMode==='normal'?'is-active':''} onClick={()=>changeVoiceMode('normal')}><Volume2/>Нормально</button><button type="button" className={voiceMode==='slow'?'is-active':''} onClick={()=>changeVoiceMode('slow')}><Volume1/>Медленнее</button></div>
      <button type="button" className="otto-voice-test" onClick={testVoice}><Play/>Послушать голос Отто</button>
    </section>

    <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3"><span className="otto-setting-icon"><Bell/></span><div className="min-w-0 flex-1"><p className="otto-kicker">Напоминания</p><h2 className="text-lg font-black text-slate-950">Когда напомнить о тренировке</h2><p className="mt-1 text-sm leading-6 text-slate-600">Выберите дни и время. Браузер покажет системное уведомление, если разрешение выдано и Otto открыт.</p></div></div>
      <div className="mt-4 flex flex-wrap gap-2">{DAY_OPTIONS.map(day=><button key={day.id} type="button" onClick={()=>toggleDay(day.id)} className={`min-h-10 min-w-10 rounded-xl border px-3 text-sm font-bold ${reminder.days.includes(day.id)?'border-teal-600 bg-teal-50 text-teal-900':'border-slate-200 bg-white text-slate-500'}`}>{day.label}</button>)}</div>
      <label className="mt-4 block text-sm font-bold text-slate-700">Время<input type="time" value={reminder.time} onChange={e=>updateReminder({...reminder,time:e.target.value})} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"/></label>
      {permission==='granted'?<label className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-teal-50 px-4 py-3 text-sm font-bold text-teal-900"><span>Напоминания включены</span><input type="checkbox" checked={reminder.enabled} onChange={e=>updateReminder({...reminder,enabled:e.target.checked})} className="h-5 w-5"/></label>:<button type="button" onClick={requestNotifications} disabled={permission==='unsupported'} className="mt-4 min-h-11 w-full rounded-xl bg-slate-950 px-4 font-bold text-white disabled:opacity-40">{permission==='denied'?'Уведомления запрещены в браузере':permission==='unsupported'?'Уведомления не поддерживаются':'Разрешить уведомления'}</button>}
      <p className="mt-3 text-xs leading-5 text-slate-500">Важно: текущая web/PWA-версия не обещает фоновую доставку после полного закрытия приложения — это зависит от браузера и ОС. Otto не показывает ложный статус «уведомления работают», если разрешения нет.</p>
    </section>

    <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3"><span className="otto-setting-icon"><Globe2/></span><div><p className="otto-kicker">Язык интерфейса</p><h2 className="text-lg font-black text-slate-950">Проверенные языки</h2></div></div>
      <div className="mt-4 space-y-2">{AVAILABLE_LOCALES.filter(item=>item.verified).map(item=><button type="button" key={item.id} onClick={()=>{setLocale(item.id);setLocaleState(item.id)}} className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left font-bold ${locale===item.id?'border-teal-600 bg-teal-50 text-teal-900':'border-slate-200'}`}><span>{item.label}</span><span>{locale===item.id?'✓':''}</span></button>)}</div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Другие языки появятся только после полной проверки всех экранов, системных сообщений и учебной оболочки. Частично переведённый интерфейс не выдаётся за доступный язык.</p>
    </section>

    <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3"><span className="otto-setting-icon"><Smartphone/></span><div><p className="otto-kicker">Установка</p><h2 className="text-lg font-black text-slate-950">OTTO на главном экране</h2><p className="mt-1 text-sm leading-6 text-slate-600">В меню браузера выберите «Добавить на главный экран» или «Установить приложение», если устройство поддерживает этот режим.</p></div></div>
    </section>
  </div>;
}
