import { useEffect, useState } from 'react';
import { Bell, BookOpenCheck, Globe2, LifeBuoy, Play, Share2, Smartphone, UserRound, Volume1, Volume2 } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';
import type { LearningMode, UserProfile } from '@/hooks/useUserProfile';
import { UI_LANGUAGES, useUiLanguage } from '@/lib/i18n';
import { notificationCapability, readReminder, requestNotifications, saveReminder, type ReminderSettings } from '@/lib/reminders';
import { canPromptInstall, isStandaloneApp, manualInstallHint, requestPwaInstall, subscribePwaInstall } from '@/lib/pwaInstall';

type SpeechMode='normal'|'slow';
type OttoSpeechApi={play?:(text:string,options?:{mode?:SpeechMode})=>Promise<boolean>;setMode?:(mode:SpeechMode)=>void};
interface Props{
  onOpenSupport:()=>void;
  onShare:()=>void|Promise<void>;
  profile:UserProfile|null;
  learningMode:LearningMode;
  onLearningModeChange:(mode:LearningMode)=>void;
  onEditProfile:()=>void;
  onOpenAccount:()=>void;
}
function speechApi(){return(window as Window&{OttoSpeech?:OttoSpeechApi}).OttoSpeech}
const DAY_KEYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;

export function SettingsPage({onOpenSupport,onShare,profile,learningMode,onLearningModeChange,onEditProfile,onOpenAccount}:Props){
  const{lang,setLanguage,t}=useUiLanguage();
  const[voiceMode,setVoiceMode]=useState<SpeechMode>(()=>{try{return localStorage.getItem('ottoSpeechModeV1')==='slow'?'slow':'normal'}catch{return'normal'}});
  const[reminder,setReminder]=useState<ReminderSettings>(readReminder);
  const[permission,setPermission]=useState(()=>notificationCapability());
  const[notice,setNotice]=useState('');
  const[installNotice,setInstallNotice]=useState('');
  const[installing,setInstalling]=useState(false);
  const[,setInstallStateVersion]=useState(0);
  useEffect(()=>{document.documentElement.lang=lang},[lang]);
  useEffect(()=>subscribePwaInstall(()=>setInstallStateVersion(v=>v+1)),[]);
  const changeVoice=(mode:SpeechMode)=>{setVoiceMode(mode);speechApi()?.setMode?.(mode);try{localStorage.setItem('ottoSpeechModeV1',mode)}catch{}};
  const testVoice=()=>void speechApi()?.play?.('Hallo. Ich heiße Otto. Schön, dass du da bist.',{mode:voiceMode});
  const toggleDay=(day:number)=>setReminder(v=>({...v,days:v.days.includes(day)?v.days.filter(x=>x!==day):[...v.days,day].sort()}));
  const enableNotifications=async()=>{const next=await requestNotifications();setPermission(next);setNotice(next==='granted'?t('notificationSaved'):next==='unsupported'?t('notificationUnsupported'):t('notificationDenied'))};
  const commitReminder=()=>{const next={...reminder,enabled:reminder.days.length>0};saveReminder(next);setReminder(next);setNotice(t('notificationSaved'))};
  const install=async()=>{setInstalling(true);setInstallNotice('');const result=await requestPwaInstall();setInstalling(false);if(result==='already-installed'){setInstallNotice(lang==='de'?'OTTO ist bereits als App installiert.':'OTTO уже установлен как отдельное приложение.');return}if(result==='accepted'){setInstallNotice(lang==='de'?'Die Installation wurde gestartet.':'Установка приложения запущена.');return}if(result==='dismissed'){setInstallNotice(lang==='de'?'Die Installation wurde abgebrochen. Sie können es später erneut versuchen.':'Установка отменена. Вы сможете повторить её позже.');return}setInstallNotice(manualInstallHint(lang))};
  const installed=isStandaloneApp();
  const promptReady=canPromptInstall();
  return <div className="otto-hub-screen otto-settings-screen animate-fade-in">
    <section className="otto-page-hero"><div><p className="otto-kicker">{t('settings')}</p><h1>OTTO A1</h1><p className="mt-1 max-w-lg text-sm text-slate-600">{lang==='de'?'Profil, Lernmodus, Sprache, Erinnerungen und Audio.':'Профиль, режим обучения, язык, напоминания и звук.'}</p></div><div className="otto-page-hero-character" aria-hidden="true"><OttoScene scene="guide" className="otto-page-hero-scene"/></div></section>

    <section className="rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,.08)] sm:p-5">
      <div className="flex items-start gap-3"><span className="otto-setting-icon"><UserRound/></span><div className="min-w-0 flex-1"><p className="otto-kicker">Профиль</p><h2 className="text-xl font-black text-slate-950">{profile?.name || 'Профиль пользователя'}</h2><p className="mt-1 break-words text-sm leading-6 text-slate-600">{profile ? `${profile.contactType==='email'?'Email':'Telegram'}: ${profile.contact}${profile.contactVerified?' · подтверждён':''}` : 'Существующий прогресс сохранён. Профиль можно заполнить в любое время.'}</p></div></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onEditProfile} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700">{profile?'Изменить профиль':'Создать профиль'}</button><button type="button" onClick={onOpenAccount} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700">Мой прогресс</button></div>
    </section>

    <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,.08)] sm:p-5">
      <div className="flex items-start gap-3"><span className="otto-setting-icon"><BookOpenCheck/></span><div><p className="otto-kicker">Обучение</p><h2 className="text-xl font-black text-slate-950">Режим помощи Отто</h2></div></div>
      <p className="mt-3 text-sm leading-6 text-slate-600">Режим можно менять в любой момент. Сохранённые результаты и задания от этого не меняются.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={()=>onLearningModeChange('guided')} aria-pressed={learningMode==='guided'} className={`min-h-[76px] rounded-xl border px-4 text-left ${learningMode==='guided'?'border-[#0F7D74] bg-[#EAF4F0] text-[#285C59]':'border-slate-200 bg-white text-slate-600'}`}><b className="block">Начинаю с нуля</b><span className="mt-1 block text-xs leading-5">Короткие объяснения перед новыми типами заданий.</span></button><button type="button" onClick={()=>onLearningModeChange('direct')} aria-pressed={learningMode==='direct'} className={`min-h-[76px] rounded-xl border px-4 text-left ${learningMode==='direct'?'border-[#0F7D74] bg-[#EAF4F0] text-[#285C59]':'border-slate-200 bg-white text-slate-600'}`}><b className="block">Я уже немного знаю немецкий</b><span className="mt-1 block text-xs leading-5">Сразу к тренировкам без дополнительного вступления.</span></button></div>
    </section>

    <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,.08)] sm:p-5">
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

    <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 sm:p-5"><div className="flex gap-3"><span className="otto-setting-icon"><Smartphone/></span><div className="min-w-0 flex-1"><h2 className="font-black text-slate-950">{t('install')}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{installed?(lang==='de'?'OTTO läuft bereits als eigenständige App.':'OTTO уже запускается как отдельное приложение.'):(lang==='de'?'Installieren Sie OTTO auf diesem Gerät und öffnen Sie es anschließend wie eine normale App.':'Установите OTTO на это устройство и запускайте его затем как отдельное приложение.')}</p><button type="button" onClick={()=>void install()} disabled={installing} className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 disabled:opacity-50">{installing?(lang==='de'?'Installation…':'Установка…'):installed?(lang==='de'?'App ist installiert':'Приложение установлено'):promptReady?(lang==='de'?'App installieren':'Установить приложение'):(lang==='de'?'App installieren':'Установить приложение')}</button>{installNotice&&<p role="status" className="mt-3 rounded-xl bg-[#F4F7F2] px-3 py-2 text-sm leading-6 text-slate-700">{installNotice}</p>}</div></div></section>

    <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 sm:p-5"><div className="flex gap-3"><span className="otto-setting-icon"><LifeBuoy/></span><div className="min-w-0 flex-1"><h2 className="font-black text-slate-950">{lang==='de'?'Support kontaktieren':'Написать в поддержку'}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{lang==='de'?'Öffnen Sie den bereits vorhandenen OTTO-Supportbereich.':'Откройте уже предусмотренный в OTTO раздел поддержки.'}</p><button type="button" onClick={onOpenSupport} className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700">{lang==='de'?'Support öffnen':'Написать в поддержку'}</button></div></div></section>

    <section className="mt-4 rounded-[24px] border border-white/90 bg-white p-4 sm:p-5"><div className="flex gap-3"><span className="otto-setting-icon"><Share2/></span><div className="min-w-0 flex-1"><h2 className="font-black text-slate-950">{lang==='de'?'Teilen':'Поделиться'}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{lang==='de'?'Teilen Sie OTTO über das Systemmenü Ihres Geräts.':'Поделитесь OTTO через системное меню вашего устройства.'}</p><button type="button" onClick={()=>void onShare()} className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700">{lang==='de'?'Teilen':'Поделиться'}</button></div></div></section>
  </div>;
}
