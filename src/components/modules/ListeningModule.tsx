import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleX, Eye, Headphones, Loader2, RotateCcw } from 'lucide-react';
import { listeningTasks } from '@/data/listening';
import { CompactTranslationEye } from '@/components/common/CompactTranslationEye';
import { HoverTranslateText } from '@/components/common/HoverTranslateText';
import { cn } from '@/lib/utils';

interface Props { onBack:()=>void; onComplete:(score:number,total:number)=>void }
type Answer=number|boolean|null;
type HorenProgress={nextIndex:number;completed:number;correct:number;mistakes:string[];credited:string[]};
const PROGRESS_KEY='otto-a1-hoeren-progress-v2';
const EMPTY_PROGRESS:HorenProgress={nextIndex:0,completed:0,correct:0,mistakes:[],credited:[]};

function readProgress():HorenProgress{
  try{
    const raw=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}') as Partial<HorenProgress>;
    return {
      nextIndex:Math.max(0,Math.min(listeningTasks.length-1,Number(raw.nextIndex)||0)),
      completed:Math.max(0,Math.min(listeningTasks.length,Number(raw.completed)||0)),
      correct:Math.max(0,Number(raw.correct)||0),
      mistakes:Array.isArray(raw.mistakes)?raw.mistakes.map(String).slice(-160):[],
      credited:Array.isArray(raw.credited)?raw.credited.map(String).slice(-240):[],
    };
  }catch{return {...EMPTY_PROGRESS,mistakes:[],credited:[]}}
}
function saveProgress(progress:HorenProgress){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress))}catch{/* ignore */}}

export function ListeningModule({onBack,onComplete}:Props){
  const[progress,setProgress]=useState<HorenProgress>(readProgress);
  const[index,setIndex]=useState(()=>readProgress().nextIndex);
  const[selected,setSelected]=useState<Answer>(null);
  const[checked,setChecked]=useState(false);
  const[finished,setFinished]=useState(()=>readProgress().completed>=listeningTasks.length);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const task=listeningTasks[index];
  const audioSrc=useMemo(()=>`/audio/${String(task.number).padStart(3,'0')}.mp3`,[task.number]);
  const imageSrc=useMemo(()=>`/images/${String(task.number).padStart(3,'0')}.png`,[task.number]);
  const parts=task.type==='multiple-choice'?[task.title,task.instruction,task.prompt,...task.options]:[task.title,task.instruction,task.prompt,'Richtig','Falsch'];
  const isCorrect=task.type==='multiple-choice'?selected===task.correctIndex:selected===task.correctAnswer;

  useEffect(()=>saveProgress(progress),[progress]);
  useEffect(()=>{setSelected(null);setChecked(false);audioRef.current?.pause();if(audioRef.current)audioRef.current.currentTime=0},[index]);

  const check=()=>{
    if(selected===null||checked)return;
    setChecked(true);
    if(progress.credited.includes(task.id))return;
    const nextProgress:HorenProgress={
      ...progress,
      nextIndex:Math.min(listeningTasks.length-1,index+1),
      completed:Math.min(listeningTasks.length,progress.completed+1),
      correct:progress.correct+(isCorrect?1:0),
      mistakes:isCorrect?progress.mistakes:[...progress.mistakes,`Aufgabe ${task.number}: ${task.prompt}`].slice(-160),
      credited:[...progress.credited,task.id].slice(-240),
    };
    setProgress(nextProgress);
    onComplete(isCorrect?1:0,1);
  };
  const next=()=>{
    if(!checked)return;
    const done=progress.completed>=listeningTasks.length||index>=listeningTasks.length-1;
    if(done){setFinished(true);return;}
    setIndex(v=>Math.min(listeningTasks.length-1,v+1));window.scrollTo({top:0,behavior:'smooth'});
  };
  const restart=()=>{
    const blank={...EMPTY_PROGRESS,mistakes:[],credited:[]};
    setProgress(blank);saveProgress(blank);setIndex(0);setSelected(null);setChecked(false);setFinished(false);window.scrollTo({top:0,behavior:'smooth'});
  };

  if(finished)return <div className="animate-fade-in pb-8"><div className="mb-5 flex items-center gap-3"><Back onClick={onBack}/><h1 className="text-2xl font-black">Hören</h1></div><div className="rounded-3xl border bg-white p-7 text-center"><Headphones className="mx-auto h-12 w-12 text-sky-700"/><h2 className="mt-4 text-2xl font-black">Training abgeschlossen</h2><p className="mt-2 text-slate-500">Выполнено {progress.completed} заданий · правильно {progress.correct}.</p><p className="mt-1 text-sm text-slate-500">Результаты сохранены и участвуют в общей статистике.</p><button onClick={restart} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 font-bold"><RotateCcw className="h-4 w-4"/>Пройти заново</button></div></div>;

  return <div className="animate-fade-in pb-8">
    <div className="mb-5 flex items-start gap-3">
      <Back onClick={onBack}/>
      <div className="min-w-0 flex-1"><h1 className="text-2xl font-black text-slate-950">Hören</h1><p className="mt-1 text-sm text-slate-500">Aufgabe {index+1} von {listeningTasks.length} · выполнено {progress.completed}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-sky-600" style={{width:`${(progress.completed/listeningTasks.length)*100}%`}}/></div></div>
      <CompactTranslationEye parts={['Hören','Hören Sie den Text und wählen Sie die passende Antwort.']} translations={['Аудирование','Прослушайте текст и выберите подходящий ответ.']} title="Перевод"/>
    </div>

    <section className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-sky-50 p-5 sm:p-6">
        <div className="min-w-0"><p className="text-sm font-black uppercase tracking-wider text-sky-700">Aufgabe {task.number}</p><h2 className="mt-1 text-2xl font-black leading-tight text-slate-950"><HoverTranslateText text={task.title}/></h2></div>
        <CompactTranslationEye parts={parts} title="Перевод карточки"/>
      </div>
      <div className="space-y-5 p-5 sm:p-7">
        <p className="rounded-xl bg-slate-50 p-4 text-base font-semibold leading-7 text-slate-700"><HoverTranslateText text={task.instruction}/></p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <audio ref={audioRef} src={audioSrc} controls preload="metadata" className="w-full"/>
        </div>
        <TranscriptEye german={task.audioText}/>
        <img src={imageSrc} alt={`Aufgabe ${task.number}`} className="mx-auto max-h-[420px] w-full max-w-2xl rounded-2xl object-contain" onError={e=>{e.currentTarget.style.display='none'}}/>
        <p className="text-xl font-bold leading-8 text-slate-950"><HoverTranslateText text={task.prompt}/></p>
        <div className="grid gap-3">
          {task.type==='multiple-choice'?task.options.map((option,n)=>{
            const selectedNow=selected===n;
            const correctNow=task.correctIndex===n;
            return <button key={`${option}-${n}`} disabled={checked} onClick={()=>setSelected(n)} className={answerClass({checked,selected:selectedNow,correct:correctNow})}><span className="mr-2 font-black text-sky-700">{String.fromCharCode(65+n)}.</span><HoverTranslateText text={option}/></button>;
          }):([true,false] as boolean[]).map(value=>{
            const selectedNow=selected===value;
            const correctNow=task.correctAnswer===value;
            return <button key={String(value)} disabled={checked} onClick={()=>setSelected(value)} className={answerClass({checked,selected:selectedNow,correct:correctNow})}><HoverTranslateText text={value?'Richtig':'Falsch'}/></button>;
          })}
        </div>
      </div>
    </section>

    {checked&&<div className={cn('mt-4 rounded-2xl border p-4',isCorrect?'border-emerald-200 bg-emerald-50':'border-rose-200 bg-rose-50')}><div className="flex items-center gap-2">{isCorrect?<CheckCircle2 className="h-5 w-5 text-emerald-700"/>:<CircleX className="h-5 w-5 text-rose-700"/>}<b>{isCorrect?'Правильно':'Неверно'}</b></div>{!isCorrect&&<HorenWhy german={task.audioText}/>}</div>}
    <div className="mt-5 flex justify-end">{!checked?<button onClick={check} disabled={selected===null} className="min-h-12 rounded-xl bg-slate-900 px-6 font-bold text-white disabled:opacity-40">Проверить</button>:<button onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-6 font-bold text-white">{index===listeningTasks.length-1?'Завершить':'Следующее'}<ArrowRight className="h-4 w-4"/></button>}</div>
  </div>;
}

function answerClass({checked,selected,correct}:{checked:boolean;selected:boolean;correct:boolean}){
  return cn('min-h-14 rounded-xl border-2 bg-white px-4 py-3 text-left text-base font-semibold leading-6 transition',
    !checked&&selected?'border-sky-500 bg-sky-50':'border-slate-200',
    checked&&correct&&'border-emerald-500 bg-emerald-50 text-emerald-950',
    checked&&selected&&!correct&&'border-rose-500 bg-rose-50 text-rose-950',
  );
}

function TranscriptEye({german}:{german:string}){
  const[open,setOpen]=useState(false),[russian,setRussian]=useState(''),[loading,setLoading]=useState(false);
  const toggle=async()=>{
    const next=!open;setOpen(next);
    if(!next||russian||loading)return;
    setLoading(true);
    try{const r=await fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts:[german]})});const p=await r.json().catch(()=>({}));if(r.ok&&Array.isArray(p.translations))setRussian(String(p.translations[0]||''))}catch{/* keep German visible */}finally{setLoading(false)}
  };
  return <div><button type="button" onClick={toggle} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"><Eye className="h-4 w-4"/>{open?'Скрыть текст диалога':'Показать текст диалога'}</button>{open&&<div className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4 text-sm leading-6"><div><b className="text-slate-900">Deutsch</b><p className="mt-1 text-slate-700">{german}</p></div><div><b className="text-slate-900">Русский</b><p className="mt-1 text-slate-600">{loading?'Перевод…':russian||'Перевод временно недоступен.'}</p></div></div>}</div>;
}

function HorenWhy({german}:{german:string}){
  const[russian,setRussian]=useState('');
  useEffect(()=>{let live=true;fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts:[german]})}).then(r=>r.json()).then(p=>{if(live&&Array.isArray(p.translations))setRussian(String(p.translations[0]||''))}).catch(()=>{});return()=>{live=false}},[german]);
  return <div className="mt-3 border-t border-rose-200 pt-3 text-sm leading-6"><p><b>Deutsch:</b> {german}</p><p className="mt-2"><b>Русский:</b> {russian||'Перевод загружается…'}</p></div>;
}

function Back({onClick}:{onClick:()=>void}){return <button onClick={onClick} aria-label="Назад" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white"><ArrowLeft className="h-5 w-5"/></button>}
