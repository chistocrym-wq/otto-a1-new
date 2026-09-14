import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { CheckCircle2, Mic, RefreshCw, Sparkles, Square, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpeakingEvaluation =
  | { mode:'teil1'; expectedPoints:string[] }
  | { mode:'teil2'; theme:string; keyword:string; sampleQuestion:string }
  | { mode:'teil3'; object:string; sampleRequest:string }
  | { mode:'free'; title:string; expectedPoints:string[] }
  | { mode:'phrase'; expectedText:string };

type OfficialLevel='full'|'partial'|'zero';
interface EvaluationResult {
  score:number;
  officialLevel:OfficialLevel;
  transcript:string;
  strengths:string[];
  practice:string[];
  pronunciationRu?:string;
  missing?:string[];
}
interface VoiceRecorderProps { evaluation:SpeakingEvaluation; onPracticed:()=>void; onEvaluated?:(score:number)=>void; hint?:string }
const MAX_CLIENT_AUDIO_BYTES=2.8*1024*1024;

let sharedMicStream:MediaStream|null=null;
let sharedMicPromise:Promise<MediaStream>|null=null;

async function getSharedMicStream():Promise<MediaStream>{
  const live=sharedMicStream?.getAudioTracks().find(t=>t.readyState==='live');
  if(live){sharedMicStream!.getAudioTracks().forEach(t=>{t.enabled=true});return sharedMicStream!}
  if(sharedMicPromise)return sharedMicPromise;
  const promise=navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}})
    .then(stream=>{sharedMicStream=stream;return stream})
    .finally(()=>{sharedMicPromise=null});
  sharedMicPromise=promise;
  return promise;
}
function muteSharedMic(){sharedMicStream?.getAudioTracks().forEach(t=>{t.enabled=false})}
function releaseSharedMic(){sharedMicStream?.getTracks().forEach(t=>t.stop());sharedMicStream=null;sharedMicPromise=null}
if(typeof window!=='undefined'&&!(window as unknown as {__ottoMicCleanup?:boolean}).__ottoMicCleanup){
  (window as unknown as {__ottoMicCleanup?:boolean}).__ottoMicCleanup=true;
  window.addEventListener('pagehide',releaseSharedMic,{once:false});
}

export function VoiceRecorder({evaluation,onPracticed,onEvaluated,hint}:VoiceRecorderProps){
  const[isRecording,setIsRecording]=useState(false);
  const[elapsed,setElapsed]=useState(0);
  const[audioUrl,setAudioUrl]=useState<string|null>(null);
  const[audioBlob,setAudioBlob]=useState<Blob|null>(null);
  const[error,setError]=useState<string|null>(null);
  const[checking,setChecking]=useState(false);
  const[result,setResult]=useState<EvaluationResult|null>(null);
  const[aiAvailable,setAiAvailable]=useState<boolean|null>(null);
  const recorderRef=useRef<MediaRecorder|null>(null);
  const chunksRef=useRef<Blob[]>([]);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const urlRef=useRef<string|null>(null);
  const fileRef=useRef<HTMLInputElement|null>(null);
  const resultReportedRef=useRef(false);

  const clearTimer=useCallback(()=>{if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}},[]);
  const reset=useCallback(()=>{if(urlRef.current)URL.revokeObjectURL(urlRef.current);urlRef.current=null;setAudioUrl(null);setAudioBlob(null);setElapsed(0);setResult(null);setError(null);resultReportedRef.current=false},[]);
  const evaluationKey=JSON.stringify(evaluation);

  useEffect(()=>{reset()},[evaluationKey,reset]);

  useEffect(()=>{
    let active=true;
    fetch('/api/check-sprechen',{method:'GET'}).then(r=>r.json()).then(p=>{if(active)setAiAvailable(Boolean(p?.aiConfigured))}).catch(()=>{if(active)setAiAvailable(null)});
    return()=>{active=false;clearTimer();if(recorderRef.current?.state==='recording')recorderRef.current.stop();muteSharedMic();if(urlRef.current)URL.revokeObjectURL(urlRef.current)};
  },[clearTimer]);

  const acceptBlob=useCallback((blob:Blob)=>{
    clearTimer();muteSharedMic();setIsRecording(false);recorderRef.current=null;
    if(!blob.size){setError('Запись пустая. Проверьте микрофон и попробуйте ещё раз.');return}
    if(blob.size>MAX_CLIENT_AUDIO_BYTES){setError('Запись слишком длинная. Сделайте ответ короче — до 2 минут.');return}
    if(urlRef.current)URL.revokeObjectURL(urlRef.current);
    const u=URL.createObjectURL(blob);urlRef.current=u;setAudioBlob(blob);setAudioUrl(u);setResult(null);setError(null);resultReportedRef.current=false;onPracticed();
  },[clearTimer,onPracticed]);

  const start=useCallback(async()=>{
    reset();
    try{
      if(!window.isSecureContext)throw new Error('Микрофон работает только на HTTPS-странице.');
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw new Error('Этот браузер не поддерживает запись. Используйте кнопку загрузки аудио.');
      const stream=await getSharedMicStream();
      if(!stream.getAudioTracks().length)throw new Error('Аудиодорожка не получена. Проверьте разрешение на микрофон.');
      stream.getAudioTracks().forEach(t=>{t.enabled=true});
      chunksRef.current=[];
      const types=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus','audio/ogg'];
      const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
      const recorder=mime?new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:48000}):new MediaRecorder(stream,{audioBitsPerSecond:48000});
      recorderRef.current=recorder;
      recorder.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};
      recorder.onstart=()=>{setElapsed(0);setIsRecording(true);setError(null);timerRef.current=setInterval(()=>setElapsed(v=>v+1),1000)};
      recorder.onerror=()=>{clearTimer();muteSharedMic();setIsRecording(false);setError('Запись прервалась. Попробуйте ещё раз.')};
      recorder.onstop=()=>acceptBlob(new Blob(chunksRef.current,{type:recorder.mimeType||mime||'audio/webm'}));
      recorder.start(250);
    }catch(e){clearTimer();muteSharedMic();setIsRecording(false);setError(microphoneErrorMessage(e))}
  },[acceptBlob,clearTimer,reset]);

  const stop=useCallback(()=>{if(recorderRef.current?.state==='recording')recorderRef.current.stop()},[]);
  const handleFile=useCallback((e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(f)acceptBlob(new Blob([f],{type:f.type||guessAudioMime(f.name)}));e.target.value=''},[acceptBlob]);

  const check=useCallback(async()=>{
    if(!audioBlob||checking)return;
    setChecking(true);setError(null);setResult(null);
    const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),70000);
    try{
      const [audioBase64,audioWavBase64]=await Promise.all([blobToBase64(audioBlob),blobToWavBase64(audioBlob).catch(()=>null)]);
      const r=await fetch('/api/check-sprechen',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({...evaluation,audioBase64,audioWavBase64,mimeType:audioBlob.type||'audio/webm'})});
      const p=await r.json().catch(()=>null);
      if(!r.ok)throw new Error(p?.error||`Проверка недоступна (${r.status}).`);
      const data=p as EvaluationResult;setResult(data);setAiAvailable(true);
      if(!resultReportedRef.current&&Number.isFinite(data.score)){resultReportedRef.current=true;onEvaluated?.(Math.max(0,Math.min(100,data.score)))}
    }catch(e){setError(e instanceof DOMException&&e.name==='AbortError'?'Проверка заняла слишком много времени. Нажмите «Проверить с Отто» ещё раз.':e instanceof Error?e.message:'Не удалось проверить запись.')}finally{window.clearTimeout(timeout);setChecking(false)}
  },[audioBlob,checking,evaluation,onEvaluated]);

  return <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-slate-950">Ответьте вслух</h3><p className="mt-1 text-sm leading-6 text-slate-500">{hint||'Нажмите микрофон, скажите ответ и остановите запись.'}</p></div><div className={cn('shrink-0 rounded-lg px-3 py-2 text-sm font-bold tabular-nums',isRecording?'bg-red-50 text-red-700':'bg-slate-50 text-slate-700')}>{formatTime(elapsed)}</div></div>
    {!audioUrl&&!isRecording&&<div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={start} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 font-bold text-white"><Mic className="h-5 w-5"/>Записать ответ</button><button type="button" onClick={()=>fileRef.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700"><Upload className="h-5 w-5"/>Добавить аудио</button><input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile}/></div>}
    {isRecording&&<button type="button" onClick={stop} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 font-bold text-white"><Square className="h-5 w-5"/>Остановить запись</button>}
    {audioUrl&&<div className="space-y-3"><audio src={audioUrl} controls className="w-full"/><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-bold"><RefreshCw className="h-4 w-4"/>Перезаписать</button><button type="button" onClick={check} disabled={checking||aiAvailable===false} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 font-bold text-white disabled:opacity-40"><Sparkles className="h-4 w-4"/>{checking?'Отто проверяет…':'Проверить с Отто'}</button></div></div>}
    {aiAvailable===false&&<p className="mt-3 text-sm text-amber-700">AI-проверка временно недоступна, но запись можно прослушать.</p>}
    {error&&<p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {result&&<EvaluationResultCard result={result}/>} 
  </div>;
}

function EvaluationResultCard({result}:{result:EvaluationResult}){
  const label=result.officialLevel==='full'?'Задание выполнено':result.officialLevel==='partial'?'Задание выполнено частично':'Задание не выполнено';
  return <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 font-black text-teal-900"><CheckCircle2 className="h-5 w-5"/>Проверка Отто</span><span className={cn('rounded-full px-3 py-1 text-sm font-black',result.officialLevel==='full'?'bg-emerald-100 text-emerald-800':result.officialLevel==='partial'?'bg-amber-100 text-amber-900':'bg-rose-100 text-rose-800')}>{label}</span></div>
    {result.transcript&&<div className="mt-3 rounded-xl bg-white p-3"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Распознано</p><p className="mt-1 text-sm leading-6 text-slate-700">{result.transcript}</p></div>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-white p-3"><h4 className="font-black text-emerald-800">Что получилось</h4>{result.strengths?.length?<ul className="mt-2 space-y-1 text-sm leading-5 text-slate-700">{result.strengths.map(item=><li key={item}>• {item}</li>)}</ul>:<p className="mt-2 text-sm text-slate-500">Пока нет выполненной части, которую можно засчитать.</p>}</div>
      <div className="rounded-xl bg-white p-3"><h4 className="font-black text-amber-800">Что нужно потренировать</h4>{result.practice?.length?<ul className="mt-2 space-y-1 text-sm leading-5 text-slate-700">{result.practice.map(item=><li key={item}>• {item}</li>)}</ul>:<p className="mt-2 text-sm text-slate-500">Существенных замечаний по этому ответу нет.</p>}</div>
    </div>
    {result.pronunciationRu&&<div className="mt-3 rounded-xl bg-white p-3"><h4 className="text-sm font-black text-slate-800">Произношение и понятность</h4><p className="mt-1 text-sm leading-5 text-slate-600">{result.pronunciationRu}</p></div>}
    {result.missing?.length?<p className="mt-3 text-xs leading-5 text-slate-600">Не прозвучало: {result.missing.join(' · ')}</p>:null}
    <p className="mt-3 text-[11px] leading-4 text-teal-800">Шкала тренировки повторяет официальную логику Goethe: выполнено и понятно / частично / не выполнено или непонятно. Это учебная оценка, не официальный экзаменационный балл.</p>
  </div>;
}

function formatTime(v:number){return `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`}
function blobToBase64(blob:Blob){return new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||'').split(',')[1]||'');r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}

async function blobToWavBase64(blob:Blob){
  const AudioContextCtor=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!AudioContextCtor)throw new Error('AudioContext unavailable');
  const context=new AudioContextCtor();
  try{
    const source=await context.decodeAudioData(await blob.arrayBuffer());
    const targetRate=16000;
    const frames=Math.max(1,Math.floor(source.duration*targetRate));
    const mono=new Float32Array(frames);
    for(let i=0;i<frames;i++){
      const sourcePos=(i/targetRate)*source.sampleRate;
      const left=Math.min(source.length-1,Math.floor(sourcePos));
      const right=Math.min(source.length-1,left+1);
      const mix=sourcePos-left;
      let sample=0;
      for(let ch=0;ch<source.numberOfChannels;ch++){
        const data=source.getChannelData(ch);
        sample+=data[left]*(1-mix)+data[right]*mix;
      }
      mono[i]=sample/source.numberOfChannels;
    }
    return arrayBufferToBase64(encodeWav(mono,targetRate));
  }finally{void context.close()}
}

function encodeWav(samples:Float32Array,sampleRate:number){
  const buffer=new ArrayBuffer(44+samples.length*2);const view=new DataView(buffer);
  writeAscii(view,0,'RIFF');view.setUint32(4,36+samples.length*2,true);writeAscii(view,8,'WAVE');writeAscii(view,12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);writeAscii(view,36,'data');view.setUint32(40,samples.length*2,true);
  let offset=44;for(let i=0;i<samples.length;i++,offset+=2){const s=Math.max(-1,Math.min(1,samples[i]));view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true)}return buffer;
}
function writeAscii(view:DataView,offset:number,value:string){for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i))}
function arrayBufferToBase64(buffer:ArrayBuffer){const bytes=new Uint8Array(buffer);let binary='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));return btoa(binary)}
function guessAudioMime(name:string){const n=name.toLowerCase();if(n.endsWith('.mp3'))return'audio/mpeg';if(n.endsWith('.m4a')||n.endsWith('.mp4'))return'audio/mp4';if(n.endsWith('.wav'))return'audio/wav';if(n.endsWith('.ogg'))return'audio/ogg';return'audio/webm'}
function microphoneErrorMessage(e:unknown){if(e instanceof DOMException){if(e.name==='NotAllowedError'||e.name==='SecurityError')return'Разрешите доступ к микрофону один раз в браузере/Telegram и нажмите запись снова.';if(e.name==='NotFoundError')return'Микрофон не найден.';if(e.name==='NotReadableError')return'Микрофон занят другим приложением.'}return e instanceof Error?e.message:'Не удалось включить микрофон.'}
