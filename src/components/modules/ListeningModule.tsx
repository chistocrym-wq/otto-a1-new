import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleX, Eye, Headphones, Loader2, RotateCcw } from 'lucide-react';
import { listeningTasks } from '@/data/listening';
import { CompactTranslationEye } from '@/components/common/CompactTranslationEye';
import { HoverTranslateText } from '@/components/common/HoverTranslateText';
import { cn } from '@/lib/utils';

interface Props { onBack:()=>void; onComplete:(score:number,total:number)=>void }
type Answer=number|boolean|null;
type SavedProgress={index:number;credited:string[];answered:number;correct:number;mistakes:string[]};
const PROGRESS_KEY='otto-hoeren-progress-v2';
const COLOR_IMAGE_NUMBERS=new Set<number>([1,2,3,4,5,...Array.from({length:35},(_,i)=>i+11)]);

function readProgress():SavedProgress{
  try{
    const raw=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}') as Partial<SavedProgress>;
    return {
      index:Math.max(0,Math.min(listeningTasks.length-1,Number(raw.index)||0)),
      credited:Array.isArray(raw.credited)?raw.credited.map(String).slice(-300):[],
      answered:Math.max(0,Number(raw.answered)||0),
      correct:Math.max(0,Number(raw.correct)||0),
      mistakes:Array.isArray(raw.mistakes)?raw.mistakes.map(String).slice(-150):[],
    };
  }catch{return {index:0,credited:[],answered:0,correct:0,mistakes:[]}}
}

export function ListeningModule({onBack,onComplete}:Props){
  const initial=useMemo(readProgress,[]);
  const[index,setIndex]=useState(initial.index);
  const[selected,setSelected]=useState<Answer>(null);
  const[checked,setChecked]=useState(false);
  const[finished,setFinished]=useState(false);
  const[progress,setProgress]=useState<SavedProgress>(initial);
  const[transcriptOpen,setTranscriptOpen]=useState(false);
  const[transcriptRu,setTranscriptRu]=useState('');
  const[transcriptLoading,setTranscriptLoading]=useState(false);
  const[transcriptError,setTranscriptError]=useState('');
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const task=listeningTasks[index];
  const audioSrc=useMemo(()=>`/audio/${String(task.number).padStart(3,'0')}.mp3`,[task.number]);
  const imageAllowed=task.number>45||COLOR_IMAGE_NUMBERS.has(task.number);
  const imageSrc=imageAllowed?`/images/${String(task.number).padStart(3,'0')}.png`:'';
  const parts=task.type==='multiple-choice'?[task.title,task.instruction,task.prompt,...task.options]:[task.title,task.instruction,task.prompt,'Richtig','Falsch'];
  const isCorrect=task.type==='multiple-choice'?selected===task.correctIndex:selected===task.correctAnswer;

  useEffect(()=>{
    setSelected(null);setChecked(false);setTranscriptOpen(false);setTranscriptRu('');setTranscriptError('');
    audioRef.current?.pause();if(audioRef.current)audioRef.current.currentTime=0;
    setProgress(prev=>({...prev,index}));
  },[index]);
  useEffect(()=>{try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress))}catch{/* ignore */}},[progress]);

  const openTranscript=async()=>{
    const next=!transcriptOpen;setTranscriptOpen(next);
    if(!next||transcriptRu||transcriptLoading)return;
    setTranscriptLoading(true);setTranscriptError('');
    try{
      const r=await fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts:[task.audioText]})});
      const p=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(p?.error||'Перевод сейчас недоступен.');
      const value=Array.isArray(p.translations)?String(p.translations[0]||''):'';
      if(!value)throw new Error('Перевод сейчас недоступен.');
      setTranscriptRu(value);
    }catch(e){setTranscriptError(e instanceof Error?e.message:'Перевод сейчас недоступен.')}finally{setTranscriptLoading(false)}
  };

  const check=()=>{
    if(selected===null||checked)return;
    setChecked(true);
    if(progress.credited.includes(task.id))return;
    const correct=isCorrect?1:0;
    setProgress(prev=>({
      ...prev,
      credited:[...prev.credited,task.id].slice(-300),
      answered:prev.answered+1,
      correct:prev.correct+correct,
      mistakes:correct?prev.mistakes:[...prev.mistakes,`Aufgabe ${task.number}: ${task.prompt}`].slice(-150),
      index,
    }));
    onComplete(correct,1);
  };
  const next=()=>{
    if(!checked)return;
    if(index>=listeningTasks.length-1){setFinished(true);return;}
    setIndex(v=>v+1);window.scrollTo({top:0,behavior:'smooth'});
  };
  const restart=()=>{setIndex(0);setSelected(null);setChecked(false);setFinished(false);setProgress(prev=>({...prev,index:0}));window.scrollTo({top:0,behavior:'smooth'})};

  if(finished)return <div className="animate-fade-in pb-8"><div className="mb-5 flex items-center gap-3"><Back onClick={onBack}/><h1 className="text-2xl font-black">Hören</h1></div><div className="rounded-3xl border bg-white p-7 text-center"><Headphones className="mx-auto h-12 w-12 text-sky-700"/><h2 className="mt-4 text-2xl font-black">Training abgeschlossen</h2><p className="mt-2 text-slate-500">Выполнено {progress.answered} заданий · правильно {progress.correct}.</p><button onClick={restart} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 font-bold"><RotateCcw className="h-4 w-4"/>С начала</button></div></div>;

  return <div className="animate-fade-in pb-8">
    <div className="mb-5 flex items-start gap-3">
      <Back onClick={onBack}/>
      <div className="min-w-0 flex-1"><h1 className="text-2xl font-black text-slate-950">Hören</h1><p className="mt-1 text-sm text-slate-500">Aufgabe {index+1} von {listeningTasks.length} · выполнено {progress.answered}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-sky-600" style={{width:`${((index+1)/listeningTasks.length)*100}%`}}/></div></div>
      <CompactTranslationEye parts={['Hören','Hören Sie den Text und wählen Sie die passende Antwort.']} translations={['Аудирование','Прослушайте текст и выберите подходящий ответ.']} title="Перевод"/>
    </div>

    <section className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-sky-50 p-5 sm:p-6">
        <div className="min-w-0"><p className="text-xs font-black uppercase tracking-wider text-sky-700">Aufgabe {task.number}</p><h2 className="mt-1 text-2xl font-black leading-tight text-slate-950 sm:text-3xl"><HoverTranslateText text={task.title}/></h2></div>
        <CompactTranslationEye parts={parts} title="Перевод карточки"/>
      </div>
      <div className="space-y-5 p-4 sm:p-6">
        <p className="rounded-xl bg-slate-50 p-4 text-base font-semibold leading-7 text-slate-700"><HoverTranslateText text={task.instruction}/></p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <audio ref={audioRef} src={audioSrc} controls preload="metadata" className="w-full"/>
        </div>
        <button type="button" onClick={openTranscript} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"><Eye className="h-4 w-4"/>{transcriptOpen?'Скрыть текст диалога':'Показать текст диалога'}</button>
        {transcriptOpen&&<div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Deutsch</p><p className="mt-1 text-slate-800">{task.audioText}</p><p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">Русский</p>{transcriptLoading?<p className="mt-1 flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Перевожу…</p>:transcriptError?<p className="mt-1 text-rose-700">{transcriptError}</p>:<p className="mt-1 text-slate-700">{transcriptRu}</p>}</div>}
        {imageSrc&&<img src={imageSrc} alt={`Aufgabe ${task.number}`} className="mx-auto max-h-[360px] w-full max-w-2xl rounded-2xl object-contain sm:max-h-[440px]" onError={e=>{e.currentTarget.style.display='none'}}/>}
        <p className="text-xl font-black leading-8 text-slate-950 sm:text-2xl"><HoverTranslateText text={task.prompt}/></p>
        <div className="grid gap-3">
          {task.type==='multiple-choice'?task.options.map((option,n)=>{
            const correct=checked&&n===task.correctIndex;const wrong=checked&&selected===n&&n!==task.correctIndex;
            return <button key={`${option}-${n}`} disabled={checked} onClick={()=>setSelected(n)} className={cn('min-h-14 rounded-xl border-2 bg-white px-4 py-3 text-left text-base font-semibold transition',!checked&&selected===n?'border-sky-500 bg-sky-50':'border-slate-200',correct&&'border-emerald-500 bg-emerald-50 text-emerald-950',wrong&&'border-rose-500 bg-rose-50 text-rose-950')}><span className="mr-2 font-black text-sky-700">{String.fromCharCode(65+n)}.</span><HoverTranslateText text={option}/></button>
          }):([true,false] as boolean[]).map(value=>{
            const correct=checked&&value===task.correctAnswer;const wrong=checked&&selected===value&&value!==task.correctAnswer;
            return <button key={String(value)} disabled={checked} onClick={()=>setSelected(value)} className={cn('min-h-14 rounded-xl border-2 bg-white px-4 py-3 text-left text-base font-semibold transition',!checked&&selected===value?'border-sky-500 bg-sky-50':'border-slate-200',correct&&'border-emerald-500 bg-emerald-50 text-emerald-950',wrong&&'border-rose-500 bg-rose-50 text-rose-950')}><HoverTranslateText text={value?'Richtig':'Falsch'}/></button>
          })}
        </div>
      </div>
    </section>

    {checked&&<div className={cn('mt-4 rounded-2xl border p-4',isCorrect?'border-emerald-200 bg-emerald-50':'border-rose-200 bg-rose-50')}><div className="flex items-center gap-2">{isCorrect?<CheckCircle2 className="h-5 w-5 text-emerald-700"/>:<CircleX className="h-5 w-5 text-rose-700"/>}<b>{isCorrect?'Правильно':'Неверно'}</b></div>{!isCorrect&&<BilingualWhy text={task.type==='multiple-choice'?`Im Hörtext passt die Antwort „${task.options[task.correctIndex]}“. ${task.audioText}`:`Die Aussage ist ${task.correctAnswer?'richtig':'falsch'}. ${task.audioText}`}/>}</div>}
    <div className="mt-5 flex justify-end">{!checked?<button onClick={check} disabled={selected===null} className="min-h-12 rounded-xl bg-slate-900 px-6 font-bold text-white disabled:opacity-40">Проверить</button>:<button onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-6 font-bold text-white">{index===listeningTasks.length-1?'Завершить':'Следующее'}<ArrowRight className="h-4 w-4"/></button>}</div>
  </div>;
}

function BilingualWhy({text}:{text:string}){
  const[pair,setPair]=useState<{de:string;ru:string}|null>(null);
  useEffect(()=>{let live=true;fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'explain-pair',text})}).then(r=>r.json()).then(p=>{if(live&&p?.de&&p?.ru)setPair({de:String(p.de),ru:String(p.ru)})}).catch(()=>{});return()=>{live=false}},[text]);
  return <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">{pair?<><p><b>Deutsch:</b> {pair.de}</p><p><b>Русский:</b> {pair.ru}</p></>:<p>{text}</p>}</div>;
}
function Back({onClick}:{onClick:()=>void}){return <button onClick={onClick} aria-label="Назад" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white"><ArrowLeft className="h-5 w-5"/></button>}
