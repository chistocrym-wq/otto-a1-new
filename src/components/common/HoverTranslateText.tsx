import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATIC:Record<string,string>={der:'артикль',die:'артикль',das:'артикль',ein:'один / артикль',eine:'одна / артикль',ich:'я',du:'ты',er:'он',sie:'она / они / Вы',wir:'мы',sein:'быть',haben:'иметь',ist:'есть',sind:'есть',möchte:'хотел(а) бы',möchten:'хотеть вежливо',kann:'могу',können:'мочь',kommen:'приходить / приезжать',gehen:'идти',fahren:'ехать',machen:'делать',arbeiten:'работать',lernen:'учить',schreiben:'писать',lesen:'читать',hören:'слушать',sprechen:'говорить',bitte:'пожалуйста',danke:'спасибо',leider:'к сожалению',gern:'охотно',nicht:'не',kein:'нет / никакой',keine:'нет / никакой',aber:'но',und:'и',oder:'или',weil:'потому что',wann:'когда',wo:'где',wohin:'куда',woher:'откуда',warum:'почему',wie:'как',was:'что',wer:'кто',welche:'какой / какая',viel:'сколько / много',lange:'долго',montag:'понедельник',dienstag:'вторник',mittwoch:'среда',donnerstag:'четверг',freitag:'пятница',samstag:'суббота',sonntag:'воскресенье',januar:'январь',februar:'февраль',märz:'март',april:'апрель',mai:'май',juni:'июнь',juli:'июль',august:'август',september:'сентябрь',oktober:'октябрь',november:'ноябрь',dezember:'декабрь',heute:'сегодня',morgen:'завтра / утром',gestern:'вчера',jetzt:'сейчас',uhr:'часов',zeit:'время',datum:'дата',preis:'цена',kostet:'стоит',kosten:'стоить',euro:'евро',cent:'цент',nummer:'номер',telefonnummer:'номер телефона',kurs:'курс',beginnt:'начинается',treffen:'встречаться',termin:'встреча / запись',bahnhof:'вокзал',hotel:'отель',adresse:'адрес',adressen:'адреса',information:'информация',informationen:'информация',freund:'друг',freundin:'подруга',familie:'семья',kind:'ребёнок',arbeit:'работа',schule:'школа',beruf:'профессия',wohnort:'место жительства',land:'страна',sprachen:'языки',hobby:'хобби',name:'имя',alter:'возраст',brief:'письмо',briefe:'письма',nachricht:'сообщение',nachrichten:'сообщения',anzeige:'объявление',anzeigen:'объявления',schild:'табличка',schilder:'таблички',hinweis:'указание',hinweise:'указания',webseite:'сайт',webseiten:'сайты',richtig:'верно',falsch:'неверно',aufgabe:'задание',aufgaben:'задания',text:'текст',texte:'тексты',teil:'часть',kreuzen:'отметьте',antwort:'ответ',antworten:'ответы',sehr:'очень',geehrte:'уважаемые',damen:'дамы',herren:'господа',liebe:'дорогая',lieber:'дорогой',grüße:'приветствия',freundlichen:'с уважением',zu:'к / в',für:'для',von:'от / из',vor:'перед',nach:'после / в',mit:'с',ohne:'без',am:'в (день)',um:'в (время)',im:'в (месяц)',in:'в',aus:'из',bei:'у / при',kurz:'короткий',kurze:'короткие',formular:'формуляр',ausfüllen:'заполнять',geschlossen:'закрыто',geöffnet:'открыто',täglich:'ежедневно',ab:'с',bis:'до',nur:'только',frei:'свободно'};
const cache=new Map<string,string>();
const pending=new Map<string,Promise<string>>();

function normalizeWord(value:string){return value.toLocaleLowerCase('de-DE').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'')}
function tokenize(text:string){return text.split(/(\s+|(?=[,.;:!?()„“"\-–—/])|(?<=[,.;:!?()„“"\-–—/]))/u).filter(Boolean)}
function speak(word:string){if(!word||!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(word);utterance.lang='de-DE';utterance.rate=.88;window.speechSynthesis.speak(utterance)}

async function getTranslation(word:string){
  const known=cache.get(word)||STATIC[word];
  if(known){cache.set(word,known);return known}
  const existing=pending.get(word);if(existing)return existing;
  const request=fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts:[word]})})
    .then(async response=>{const payload=await response.json().catch(()=>({}));const result=Array.isArray(payload.translations)?String(payload.translations[0]||''):'';if(result)cache.set(word,result);return result})
    .catch(()=> '')
    .finally(()=>pending.delete(word));
  pending.set(word,request);return request;
}

function Word({token}:{token:string}){
  const word=normalizeWord(token);
  const initial=word?(cache.get(word)||STATIC[word]||''):'';
  const[translation,setTranslation]=useState(initial);
  const[open,setOpen]=useState(false);

  const load=async()=>{
    if(!word||translation||!/\p{L}/u.test(word))return;
    const result=await getTranslation(word);
    if(result)setTranslation(result);
  };

  if(!word||!/\p{L}/u.test(word))return <>{token}</>;

  const activate=()=>{
    if(open){setOpen(false);return}
    setOpen(true);
    speak(word);
    void load();
  };

  return <span className="relative inline-block align-baseline" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setOpen(false)}}>
    <span
      role="button"
      aria-expanded={open}
      tabIndex={0}
      className="cursor-pointer underline decoration-dotted decoration-slate-300 underline-offset-2"
      onMouseEnter={()=>{void load()}}
      onFocus={()=>{void load()}}
      onClick={activate}
      onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}}}
    >{token}</span>
    {open&&translation&&<span className="fixed inset-x-3 bottom-24 z-[85] flex max-h-[32vh] items-start gap-2 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold leading-5 text-teal-800 shadow-lg sm:absolute sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-[calc(100%+2px)] sm:w-max sm:max-w-[240px] sm:-translate-x-1/2 sm:overflow-visible sm:border-0 sm:bg-transparent sm:p-0 sm:text-center sm:text-xs sm:leading-4 sm:shadow-none">
      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{translation}</span>
      <button type="button" onClick={()=>setOpen(false)} aria-label="Закрыть перевод слова" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 sm:hidden"><X className="h-3.5 w-3.5"/></button>
    </span>}
  </span>;
}

export function HoverTranslateText({text,className}:{text:string;className?:string}){
  const tokens=useMemo(()=>tokenize(text),[text]);
  return <span className={cn('whitespace-pre-wrap',className)}>{tokens.map((token,index)=><Word key={`${token}-${index}`} token={token}/>)}</span>;
}
