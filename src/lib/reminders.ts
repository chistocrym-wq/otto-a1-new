export interface ReminderSettings{enabled:boolean;days:number[];time:string;lastSentDate?:string}
export const REMINDER_KEY='otto-a1-reminder-v1';
export const DEFAULT_REMINDER:ReminderSettings={enabled:false,days:[1,3,5],time:'19:00'};
export function readReminder():ReminderSettings{try{const p=JSON.parse(localStorage.getItem(REMINDER_KEY)||'{}');return{enabled:Boolean(p.enabled),days:Array.isArray(p.days)?p.days.map(Number).filter((v:number)=>v>=0&&v<=6):DEFAULT_REMINDER.days,time:/^([01]\d|2[0-3]):[0-5]\d$/.test(String(p.time||''))?String(p.time):DEFAULT_REMINDER.time,lastSentDate:p.lastSentDate?String(p.lastSentDate):undefined}}catch{return{...DEFAULT_REMINDER}}}
export function saveReminder(v:ReminderSettings){try{localStorage.setItem(REMINDER_KEY,JSON.stringify(v))}catch{};window.dispatchEvent(new CustomEvent('otto:reminder'))}
export function notificationCapability(){return typeof Notification==='undefined'?'unsupported':Notification.permission}
export async function requestNotifications(){if(typeof Notification==='undefined')return'unsupported' as const;try{return await Notification.requestPermission()}catch{return'denied' as const}}
export function maybeSendReminder(){
 const s=readReminder();if(!s.enabled||typeof Notification==='undefined'||Notification.permission!=='granted')return false;const now=new Date();if(!s.days.includes(now.getDay()))return false;const hhmm=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;if(hhmm!==s.time)return false;const date=now.toISOString().slice(0,10);if(s.lastSentDate===date)return false;
 try{const notification=new Notification('Тренажёр Отто',{body:'Пора сделать короткую тренировку A1. Нажмите, чтобы открыть план на сегодня.',icon:'/otto-icon-192.svg?v=3',tag:'otto-a1-reminder'});notification.onclick=()=>{try{window.focus()}catch{};window.dispatchEvent(new CustomEvent('otto:open-daily-training'))}}catch{return false}
 saveReminder({...s,lastSentDate:date});return true;
}
