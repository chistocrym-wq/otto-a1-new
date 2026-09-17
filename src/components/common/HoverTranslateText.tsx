import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATIC:Record<string,string>={der:'артикль',die:'артикль',das:'артикль',ein:'один / артикль',eine:'одна / артикль',ich:'я',du:'ты',er:'он',sie:'она / они / Вы',wir:'мы',sein:'быть',haben:'иметь',ist:'есть',sind:'есть',möchte:'хотел(а) бы',möchten:'хотеть вежливо',kann:'могу',können:'мочь',kommen:'приходить / приезжать',gehen:'идти',fahren:'ехать',machen:'делать',arbeiten:'работать',lernen:'учить',schreiben:'писать',lesen:'читать',hören:'слушать',sprechen:'говорить',bitte:'пожалуйста',danke:'спасибо',leider:'к сожалению',gern:'охотно',nicht:'не',kein:'нет / никакой',keine:'нет / никакой',aber:'но',und:'и',oder:'или',weil:'потому что',wann:'когда',wo:'где',wohin:'куда',woher:'откуда',warum:'почему',wie:'как',was:'что',wer:'кто',welche:'какой / какая',viel:'сколько / много',lange:'долго',montag:'понедельник',dienstag:'вторник',mittwoch:'среда',donnerstag:'четверг',freitag:'пятница',samstag:'суббота',sonntag:'воскресенье',januar:'январь',februar:'февраль',märz:'март',april:'апрель',mai:'май',juni:'июнь',juli:'июль',august:'август',september:'сентябрь',oktober:'октябрь',november:'ноябрь',dezember:'декабрь',heute:'сегодня',morgen:'завтра / утром',gestern:'вчера',jetzt:'сейчас',uhr:'часов',zeit:'время',datum:'дата',preis:'цена',kostet:'стоит',kosten:'стоить',euro:'евро',cent:'цент',nummer:'номер',telefonnummer:'номер телефона',kurs:'курс',beginnt:'начинается',treffen:'встречаться',termin:'встреча / запись',bahnhof:'вокзал',hotel:'отель',adresse:'адрес',adressen:'адреса',information:'информация',informationen:'информация',freund:'друг',freundin:'подруга',familie:'семья',kind:'ребёнок',arbeit:'работа',schule:'школа',beruf:'профессия',wohnort:'место жительства',land:'страна',sprachen:'языки',hobby:'хобби',name:'имя',alter:'возраст',brief:'письмо',briefe:'письма',nachricht:'сообщение',nachrichten:'сообщения',anzeige:'объявление',anzeigen:'объявления',schild:'табличка',schilder:'таблички',hinweis:'указание',hinweise:'указания',webseite:'сайт',webseiten:'сайты',richtig:'верно',falsch:'неверно',aufgabe:'задание',aufgaben:'задания',text:'текст',texte:'тексты',teil:'часть',kreuzen:'отметьте',antwort:'ответ',antworten:'ответы',sehr:'очень',geehrte:'уважаемые',damen:'дамы',herren:'господа',liebe:'дорогая',lieber:'дорогой',grüße:'приветствия',freundlichen:'с уважением',zu:'к / в',für:'для',von:'от / из',vor:'перед',nach:'после / в',mit:'с',ohne:'без',am:'в (день)',um:'в (время)',im:'в (месяц)',in:'в',aus:'из',bei:'у / при',kurz:'короткий',kurze:'короткие',formular:'формуляр',ausfüllen:'заполнять',geschlossen:'закрыто',geöffnet:'открыто',täglich:'ежедневно',ab:'с',bis:'до',nur:'только',frei:'свободно'};

const PHRASES:Array<{de:string;ru:string}>=[
  {de:'mit freundlichen grüßen',ru:'с уважением'},
  {de:'ich hätte gern',ru:'я хотел(а) бы'},
  {de:'wie viel kostet',ru:'сколько стоит'},
  {de:'wie viel kosten',ru:'сколько стоят'},
  {de:'guten morgen',ru:'доброе утро'},
  {de:'guten abend',ru:'добрый вечер'},
  {de:'guten tag',ru:'добрый день'},
  {de:'vielen dank',ru:'большое спасибо'},
  {de:'sie möchten',ru:'Вы хотите'},
  {de:'möchten sie',ru:'Вы хотите'},
  {de:'ich möchte',ru:'я хотел(а) бы'},
  {de:'wir möchten',ru:'мы хотели бы'},
  {de:'können sie',ru:'Вы можете'},
  {de:'ich kann',ru:'я могу'},
  {de:'es gibt',ru:'есть / имеется'},
  {de:'wie lange',ru:'как долго'},
  {de:'wie viel',ru:'сколько'},
  {de:'wie spät',ru:'который час'},
  {de:'ab wann',ru:'начиная с какого времени'},
  {de:'bis wann',ru:'до какого времени'},
  {de:'woher kommen',ru:'откуда родом / откуда приезжать'},
  {de:'bitte schön',ru:'пожалуйста'},
];

const cache=new Map<string,string>();
const pending=new Map<string,Promise<string>>();
const STORAGE_PREFIX='otto-context-translation-v2:';

function normalizeWord(value:string){return value.toLocaleLowerCase('de-DE').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'')}
function tokenize(text:string){return text.split(/(\s+|(?=[,.;:!?()„“"\-–—/])|(?<=[,.;:!?()„“"\-–—/]))/u).filter(Boolean)}
function speak(value:string){if(!value||!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(value);utterance.lang='de-DE';utterance.rate=.88;window.speechSynthesis.speak(utterance)}

function readCached(key:string){
  const memory=cache.get(key);if(memory)return memory;
  try{const stored=sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);if(stored){cache.set(key,stored);return stored}}catch{/* ignore */}
  return '';
}
function writeCached(key:string,value:string){
  if(!value)return;cache.set(key,value);
  try{sessionStorage.setItem(`${STORAGE_PREFIX}${key}`,value)}catch{/* ignore */}
}

type ContextSelection={source:string;cacheKey:string;staticTranslation?:string;fallbackTranslation?:string};
type WordToken={tokenIndex:number;word:string;raw:string};

function wordTokens(tokens:string[]):WordToken[]{
  const result:WordToken[]=[];
  tokens.forEach((raw,tokenIndex)=>{const word=normalizeWord(raw);if(word&&/\p{L}/u.test(word))result.push({tokenIndex,word,raw})});
  return result;
}

function sentenceFragment(tokens:string[],tokenIndex:number){
  let start=tokenIndex;let end=tokenIndex;
  while(start>0&&!/[.!?]/u.test(tokens[start-1]))start-=1;
  while(end<tokens.length-1&&!/[.!?]/u.test(tokens[end+1]))end+=1;
  const fragment=tokens.slice(start,end+1).join('').replace(/\s+/gu,' ').trim().replace(/^[,;:\s]+|[,;:\s]+$/gu,'');
  return fragment.length>180?fragment.slice(0,180).trim():fragment;
}

function semanticFragment(tokens:string[],tokenIndex:number){
  let start=tokenIndex;let end=tokenIndex;
  while(start>0&&!/[,.;:!?–—]/u.test(tokens[start-1]))start-=1;
  while(end<tokens.length-1&&!/[,.;:!?–—]/u.test(tokens[end+1]))end+=1;
  let fragment=tokens.slice(start,end+1).join('').replace(/\s+/gu,' ').trim().replace(/^[,;:\s]+|[,;:\s]+$/gu,'');
  const count=(fragment.match(/\p{L}+/gu)||[]).length;
  if(count<2)fragment=sentenceFragment(tokens,tokenIndex);
  return fragment.length>180?fragment.slice(0,180).trim():fragment;
}

function resolveContext(tokens:string[],tokenIndex:number):ContextSelection{
  const words=wordTokens(tokens);
  const clicked=words.findIndex(item=>item.tokenIndex===tokenIndex);
  const clickedWord=clicked>=0?words[clicked].word:normalizeWord(tokens[tokenIndex]);
  for(const phrase of PHRASES){
    const parts=phrase.de.split(' ');
    for(let start=Math.max(0,clicked-parts.length+1);start<=Math.min(clicked,words.length-parts.length);start+=1){
      const matches=parts.every((part,offset)=>words[start+offset]?.word===part);
      if(matches&&clicked>=start&&clicked<start+parts.length){
        const source=words.slice(start,start+parts.length).map(item=>item.raw).join(' ');
        return{source,cacheKey:`phrase:${phrase.de}`,staticTranslation:phrase.ru};
      }
    }
  }
  const fragment=semanticFragment(tokens,tokenIndex);
  const fragmentWords=(fragment.match(/\p{L}+/gu)||[]).length;
  const fallbackTranslation=clickedWord?STATIC[clickedWord]:undefined;
  if(fragment&&fragmentWords>1){
    // Для многословного контекста безопаснее не показывать отдельный словарный смысл,
    // если контекстный перевод временно не получен: он может исказить значение фразы.
    return{source:fragment,cacheKey:`context:${fragment.toLocaleLowerCase('de-DE')}`};
  }
  if(clickedWord&&fallbackTranslation){
    return{source:tokens[tokenIndex],cacheKey:`word:${clickedWord}`,staticTranslation:fallbackTranslation};
  }
  const source=fragment||tokens[tokenIndex];
  return{source,cacheKey:`context:${source.toLocaleLowerCase('de-DE')}`};
}

async function getTranslation(selection:ContextSelection){
  if(selection.staticTranslation){writeCached(selection.cacheKey,selection.staticTranslation);return selection.staticTranslation}
  const known=readCached(selection.cacheKey);if(known)return known;
  const existing=pending.get(selection.cacheKey);if(existing)return existing;
  const request=fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts:[selection.source]})})
    .then(async response=>{const payload=await response.json().catch(()=>({}));const result=Array.isArray(payload.translations)?String(payload.translations[0]||'').trim():'';if(result){writeCached(selection.cacheKey,result);return result}return selection.fallbackTranslation||''})
    .catch(()=>selection.fallbackTranslation||'')
    .finally(()=>pending.delete(selection.cacheKey));
  pending.set(selection.cacheKey,request);return request;
}

function Word({token,tokens,tokenIndex}:{token:string;tokens:string[];tokenIndex:number}){
  const word=normalizeWord(token);
  const selection=useMemo(()=>resolveContext(tokens,tokenIndex),[tokens,tokenIndex]);
  const initial=word?(readCached(selection.cacheKey)||selection.staticTranslation||''):'';
  const[translation,setTranslation]=useState(initial);
  const[open,setOpen]=useState(false);

  const load=async()=>{
    if(!word||translation||!/\p{L}/u.test(word))return;
    const result=await getTranslation(selection);
    if(result)setTranslation(result);
  };

  if(!word||!/\p{L}/u.test(word))return <>{token}</>;

  const activate=()=>{
    if(open){setOpen(false);return}
    setOpen(true);
    speak(selection.source);
    void load();
  };

  return <span className="relative inline-block align-baseline" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setOpen(false)}}>
    <span role="button" aria-expanded={open} tabIndex={0} className="cursor-pointer underline decoration-dotted decoration-slate-300 underline-offset-2" onMouseEnter={()=>{void load()}} onFocus={()=>{void load()}} onClick={activate} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}}}>{token}</span>
    {open&&translation&&<span className="fixed inset-x-3 bottom-24 z-[85] flex max-h-[32vh] items-start gap-2 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm leading-5 text-slate-700 shadow-lg sm:absolute sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-[calc(100%+2px)] sm:w-max sm:max-w-[280px] sm:-translate-x-1/2 sm:overflow-visible sm:p-2 sm:text-xs sm:leading-4">
      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]"><strong className="text-slate-950">{selection.source}</strong><span className="mx-1 text-slate-400">→</span><span className="font-semibold text-teal-800">{translation}</span></span>
      <button type="button" onClick={()=>setOpen(false)} aria-label="Закрыть перевод" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 sm:hidden"><X className="h-3.5 w-3.5"/></button>
    </span>}
  </span>;
}

export function HoverTranslateText({text,className}:{text:string;className?:string}){
  const tokens=useMemo(()=>tokenize(text),[text]);
  return <span className={cn('whitespace-pre-wrap',className)}>{tokens.map((token,index)=><Word key={`${token}-${index}`} token={token} tokens={tokens} tokenIndex={index}/>)}</span>;
}
