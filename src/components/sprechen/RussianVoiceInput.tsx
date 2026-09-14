import { useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

interface Props {
  onText: (text: string) => void;
}

export function RussianVoiceInput({ onText }: Props) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const send = async (blob: Blob) => {
    if (!blob.size) {
      setError('Запись пустая. Попробуйте ещё раз.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const audioBase64 = await blobToBase64(blob);
      const response = await fetch('/api/transcribe-ru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType: blob.type || 'audio/webm' }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Не удалось распознать русскую речь.');
      const text = String(payload?.text || '').trim();
      if (!text) throw new Error('Речь не распознана. Попробуйте сказать фразу ещё раз.');
      onText(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось распознать русскую речь.');
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    setError(null);
    try {
      if (!window.isSecureContext) throw new Error('Микрофон работает только на защищённой HTTPS-странице.');
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Этот браузер не поддерживает запись с микрофона.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];
      const mime = types.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        setRecording(false);
        stopTracks();
        void send(new Blob(chunksRef.current, { type: recorder.mimeType || mime || 'audio/webm' }));
      };
      recorder.onerror = () => {
        setRecording(false);
        stopTracks();
        setError('Запись прервалась. Попробуйте ещё раз.');
      };
      recorder.start(250);
      setRecording(true);
    } catch (e) {
      stopTracks();
      setRecording(false);
      setError(microphoneErrorMessage(e));
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  return <div className="mt-3">
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={loading}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 disabled:opacity-50"
    >
      {recording ? <><Square className="h-4 w-4" />Закончить запись</> : <><Mic className="h-4 w-4" />{loading ? 'Распознаю…' : 'Сказать по-русски'}</>}
    </button>
    {recording && <p className="mt-2 text-center text-xs font-semibold text-rose-600">Говорите по-русски. Когда закончите — остановите запись.</p>}
    {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
  </div>;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function microphoneErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'Разрешите доступ к микрофону и попробуйте снова.';
    if (error.name === 'NotFoundError') return 'Микрофон не найден.';
    if (error.name === 'NotReadableError') return 'Микрофон занят другим приложением.';
  }
  return error instanceof Error ? error.message : 'Не удалось включить микрофон.';
}
