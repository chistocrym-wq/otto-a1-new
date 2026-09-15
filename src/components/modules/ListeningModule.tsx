import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleX, Eye, Headphones, Loader2, RotateCcw } from 'lucide-react';
import { listeningTasks, type HorenTask } from '@/data/listening';
import { CompactTranslationEye } from '@/components/common/CompactTranslationEye';
import { HoverTranslateText } from '@/components/common/HoverTranslateText';
import { cn } from '@/lib/utils';

interface Props { onBack:()=>void; onComplete:(score:number,total:number)=>void }
type Answer=number|boolean|null;
type HorenProgress={nextIndex:number;completed:number;correct:number;mistakes:string[];credited:string[]};
const PROGRESS_KEY='otto-a1-hoeren-progress-v2';
function readProgress():HorenProgress{try{const p=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}');return{nextIndex:Math.max(0,Math.min(listeningTasks.length-1,Number(p.nextIndex)||0)),completed:Math.max(0,Number(p.completed)||0),correct:Math.max(0,Number(p.correct)||0),mistakes:Array.isArray(p.mistakes)?p.mistakes.map(String).slice(-160):[],credited:Array.isArray(p.credited)?p.credited.map(String).slice(-240):[]}}catch{return{nextIndex:0,completed:0,correct:0,mistakes:[],credited:[]}}}
function saveProgress(p:HorenProgress){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(p))}catch{/* ignore */}}

export function ListeningModule({onBack,onComplete}:Props){
  const[progress,setProgress]=useState<HorenProgress>(readProgress);
  const[index,setIndex]=useState(()=>readProgress().nextIndex);
  const[selected,setSelected]=useState<Answer>(null);
  const[checked,setChecked]=useState(false);
  const[finished,setFinished]=useState(()=>readProgress().completed>=listeningTasks.length);
  const[transcriptOpen,setTranscriptOpen]=useState(false);
  const[transcriptRu,setTranscriptRu]=useState('');
  const[transcriptLoading,setTranscriptLoading]=useState(false);
  const[why,setWhy]=useState<{de:string;ru:string}|null>(null);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const task=listeningTasks[index];
  const audioSrc=useMemo(()=>`/audio/${String(task.number).padStart(3,'0')}.mp3`,[task.number]);
  const imageSrc=useMemo(()=>`/images/${String(task.number).padStart(3,'0')}.png?v=20260914-2`,[task.number]);
  const isCorrect=task.type==='multiple-choice'?selected===task.correctIndex:selected===task.correctAnswer;

  useEffect(()=>saveProgress(progress),[progress]);
  useEffect(()=>{setSelected(null);setChecked(false);setTranscriptOpen(false);setTranscriptRu('');setWhy(null);audioRef.current?.pause();if(audioRef.current)audioRef.current.currentTime=0},[index]);

  const openTranscript=async()=>{
    const next=!transcriptOpen;setTranscriptOpen(next);if(!next||transcriptRu||transcriptLoading)return;
    setTranscriptLoading(true);
    try{const r=await fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts:[task.audioText]})});const p=await r.json();if(r.ok&&Array.isArray(p.translations))setTranscriptRu(String(p.translations[0]||''))}catch{/* keep German transcript */}finally{setTranscriptLoading(false)}
  };
  const loadWhy=async()=>{
    const de=reasonDe(task);
    try{const r=await fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'explain-pair',text:de})});const p=await r.json();if(r.ok&&p.de&&p.ru)setWhy({de:String(p.de),ru:String(p.ru)});else setWhy({de,ru:''})}catch{setWhy({de,ru:''})}
  };
  const check=()=>{
    if(selected===null||checked)return;
    setChecked(true);
    if(!isCorrect)void loadWhy();
    if(progress.credited.includes(task.id))return;
    const next:HorenProgress={...progress,nextIndex:Math.min(listeningTasks.length-1,index+1),completed:Math.min(listeningTasks.length,progress.completed+1),correct:progress.correct+(isCorrect?1:0),mistakes:isCorrect?progress.mistakes:[...progress.mistakes,`${task.id}: ${task.prompt}`].slice(-160),credited:[...progress.credited,task.id].slice(-240)};
    setProgress(next);onComplete(isCorrect?1:0,1);
  };
  const next=()=>{
    if(!checked)return;
    if(index>=listeningTasks.length-1){setFinished(true);return;}
    setIndex(v=>v+1);window.scrollTo({top:0,behavior:'smooth'});
  };
  const restart=()=>{setIndex(0);setSelected(null);setChecked(false);setFinished(false);setTranscriptOpen(false);setWhy(null)};

  if(finished)return <div className="animate-fade-in pb-8"><div className="mb-5 flex items-center gap-3"><Back onClick={onBack}/><h1 className="text-2xl font-black">Hören</h1></div><div className="rounded-3xl border bg-white p-7 text-center"><Headphones className="mx-auto h-12 w-12 text-sky-700"/><h2 className="mt-4 text-2xl font-black">Training abgeschlossen</h2><p className="mt-2 text-slate-500">Результат: {progress.correct}/{progress.completed}. Данные сохранены и будут учтены в готовности.</p><button onClick={restart} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 font-bold"><RotateCcw className="h-4 w-4"/>Просмотреть с начала</button></div></div>;

  return <div className="animate-fade-in pb-8">
    <div className="mb-5 flex items-start gap-3">
      <Back onClick={onBack}/>
      <div className="min-w-0 flex-1"><h1 className="text-2xl font-black text-slate-950">Hören</h1><p className="mt-1 text-sm text-slate-500">Aufgabe {index+1} von {listeningTasks.length} · выполнено {progress.completed}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-sky-600" style={{width:`${(progress.completed/listeningTasks.length)*100}%`}}/></div></div>
      <CompactTranslationEye parts={['Hören','Hören Sie den Text und wählen Sie die passende Antwort.']} translations={['Аудирование','Прослушайте текст и выберите подходящий ответ.']} title="Перевод"/>
    </div>

    <section className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-sky-50 p-5">
        <div className="min-w-0"><p className="text-xs font-black uppercase tracking-wider text-sky-700">Aufgabe {task.number}</p><h2 className="mt-1 text-2xl font-black leading-tight text-slate-950"><HoverTranslateText text={task.title}/></h2></div>
        <CompactTranslationEye parts={[task.title,task.instruction,task.prompt,...(task.type==='multiple-choice'?task.options:['Richtig','Falsch'])]} title="Перевод карточки"/>
      </div>
      <div className="space-y-5 p-4 sm:p-6">
        <p className="rounded-xl bg-slate-50 p-4 text-base font-semibold leading-7 text-slate-700"><HoverTranslateText text={task.instruction}/></p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><audio ref={audioRef} src={audioSrc} controls preload="metadata" className="w-full"/></div>
        <button type="button" onClick={openTranscript} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><Eye className="h-4 w-4"/>{transcriptOpen?'Скрыть текст диалога':'Показать текст диалога'}</button>
        {transcriptOpen&&<div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6"><b className="text-slate-950">Deutsch</b><p className="mt-1 text-slate-700">{task.audioText}</p><b className="mt-4 block text-slate-950">Русский</b><p className="mt-1 text-slate-700">{transcriptLoading?'Перевожу…':transcriptRu||'Перевод временно недоступен.'}</p></div>}
        <img src={imageSrc} alt={`Aufgabe ${task.number}`} className="mx-auto max-h-[420px] w-full max-w-[520px] rounded-2xl object-contain" onError={e=>{e.currentTarget.style.display='none'}}/>
        <p className="text-xl font-bold leading-8 text-slate-950"><HoverTranslateText text={task.prompt}/></p>
        <div className="grid gap-3">
          {task.type==='multiple-choice'?task.options.map((option,n)=>{const correct=n===task.correctIndex;return <button key={`${option}-${n}`} disabled={checked} onClick={()=>setSelected(n)} className={answerClass(selected===n,checked,correct)}><span className="mr-2 font-black text-sky-700">{String.fromCharCode(65+n)}.</span><HoverTranslateText text={option}/></button>}):([true,false] as boolean[]).map(value=>{const correct=value===task.correctAnswer;return <button key={String(value)} disabled={checked} onClick={()=>setSelected(value)} className={answerClass(selected===value,checked,correct)}><HoverTranslateText text={value?'Richtig':'Falsch'}/></button>})}
        </div>
      </div>
    </section>

    {checked&&<div className={cn('mt-4 rounded-2xl border p-4',isCorrect?'border-emerald-200 bg-emerald-50':'border-rose-200 bg-rose-50')}><div className="flex items-center gap-2">{isCorrect?<CheckCircle2 className="h-5 w-5 text-emerald-700"/>:<CircleX className="h-5 w-5 text-rose-700"/>}<b>{isCorrect?'Правильно':'Неверно'}</b></div>{!isCorrect&&<div className="mt-3 text-sm leading-6 text-slate-700">{why?<><p><b>Deutsch:</b> {why.de}</p>{why.ru&&<p><b>Русский:</b> {why.ru}</p>}</>:<p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/>Отто готовит короткое объяснение…</p>}</div>}</div>}
    <div className="mt-5 flex justify-end">{!checked?<button onClick={check} disabled={selected===null} className="min-h-12 rounded-xl bg-slate-900 px-6 font-bold text-white disabled:opacity-40">Проверить</button>:<button onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-6 font-bold text-white">{index===listeningTasks.length-1?'Завершить':'Следующее'}<ArrowRight className="h-4 w-4"/></button>}</div>
  </div>;
}

function answerClass(selected:boolean,checked:boolean,correct:boolean){return cn('min-h-12 rounded-xl border-2 px-4 py-3 text-left font-semibold transition',checked&&selected?(correct?'border-emerald-500 bg-emerald-50 text-emerald-950':'border-rose-500 bg-rose-50 text-rose-950'):selected?'border-blue-300 bg-blue-50 text-slate-950':'border-slate-200 bg-white text-slate-900')}
function reasonDe(task:HorenTask){if(task.type==='multiple-choice')return `Die passende Antwort ist „${task.options[task.correctIndex]}“. Diese Information hören Sie im Dialog.`;return `Die Aussage ist ${task.correctAnswer?'richtig':'falsch'}. Diese Information hören Sie im Dialog.`}
function Back({onClick}:{onClick:()=>void}){return <button onClick={onClick} aria-label="Назад" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white"><ArrowLeft className="h-5 w-5"/></button>}
