import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  parts: string[];
  translations?: string[];
  className?: string;
  title?: string;
}

function keyFor(parts: string[]) {
  let h = 2166136261;
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `otto-eye-${(h >>> 0).toString(16)}`;
}

function readCached(key: string, expectedLength: number) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length === expectedLength ? parsed.map(String) : null;
  } catch {
    return null;
  }
}

export function CompactTranslationEye({ parts, translations: preset, className, title = 'Перевод' }: Props) {
  const clean = parts.map(String).map((v) => v.trim()).filter(Boolean);
  const key = keyFor(clean);
  const presetKey = preset && preset.length === clean.length ? JSON.stringify(preset.map(String)) : '';
  const validPreset = useMemo<string[] | null>(() => presetKey ? JSON.parse(presetKey) as string[] : null, [presetKey]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translations, setTranslations] = useState<string[] | null>(() => validPreset || readCached(key, clean.length));
  const requestRef = useRef<AbortController | null>(null);
  const sourceKeyRef = useRef(key);

  useEffect(() => {
    sourceKeyRef.current = key;
    requestRef.current?.abort();
    requestRef.current = null;
    setOpen(false);
    setLoading(false);
    setError('');
    setTranslations(validPreset || readCached(key, clean.length));
    return () => requestRef.current?.abort();
  }, [key, presetKey, validPreset, clean.length]);

  const load = async () => {
    if (translations || loading || !clean.length) return;
    const requestKey = key;
    const requestParts = [...clean];
    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/translate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts: requestParts }),
        signal: controller.signal,
      });
      const p = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(p.error || 'Перевод недоступен');
      const t = Array.isArray(p.translations) ? p.translations.map(String) : [];
      if (t.length !== requestParts.length) throw new Error('Перевод пришёл не полностью');
      if (controller.signal.aborted || sourceKeyRef.current !== requestKey) return;
      setTranslations(t);
      try { localStorage.setItem(requestKey, JSON.stringify(t)); } catch { /* ignore */ }
    } catch (e) {
      if (controller.signal.aborted || sourceKeyRef.current !== requestKey) return;
      setError(e instanceof Error ? e.message : 'Перевод недоступен');
    } finally {
      if (!controller.signal.aborted && sourceKeyRef.current === requestKey) setLoading(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    void load();
  };

  return (
    <div className={cn('min-w-0 shrink-0 text-right', className)} data-translation-ui>
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Скрыть перевод' : 'Показать перевод'}
        title={open ? 'Скрыть перевод' : 'Показать перевод'}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition',
          open ? 'border-slate-300 bg-white text-teal-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
        )}
      >
        {open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-24 z-[80] max-h-[46vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm leading-6 text-slate-600 shadow-xl sm:static sm:mt-2 sm:max-h-none sm:w-[300px] sm:max-w-[min(300px,calc(100vw-2rem))] sm:overflow-visible sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="mb-2 flex items-center justify-between gap-3 sm:hidden">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть перевод" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <span className="sr-only">{title}</span>
          {loading && <p>Перевожу…</p>}
          {error && <p className="break-words text-rose-700 [overflow-wrap:anywhere]">{error}</p>}
          {translations?.map((t, i) => <p key={`${key}-${i}`} className={cn('break-words [overflow-wrap:anywhere]', i ? 'mt-1' : '')}>{t}</p>)}
        </div>
      )}
    </div>
  );
}
