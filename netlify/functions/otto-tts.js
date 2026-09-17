import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const MODEL = 'gpt-4o-mini-tts-2025-12-15';
const VOICE = 'marin';
const CACHE_VERSION = 'v2-marin-de';
const STORE = `otto-tts-cache-${CACHE_VERSION}`;
const MAX_TEXT_LENGTH = 420;
const CYRILLIC_RE = /[А-Яа-яЁё]/u;
const LETTER_RE = /^[A-ZÄÖÜẞß]$/u;
const SPELLING_RE = /^(?:[A-ZÄÖÜẞß]\s*[–—-]\s*)+[A-ZÄÖÜẞß]$/u;
const GERMAN_LETTER_NAMES = Object.freeze({
  A:'A',B:'Be',C:'Ce',D:'De',E:'E',F:'Eff',G:'Ge',H:'Ha',I:'I',J:'Jot',K:'Ka',L:'Ell',M:'Em',N:'En',O:'O',P:'Pe',Q:'Ku',R:'Er',S:'Es',T:'Te',U:'U',V:'Vau',W:'We',X:'Ix',Y:'Ypsilon',Z:'Zett',Ä:'Ä',Ö:'Ö',Ü:'Ü',ẞ:'Eszett',ß:'Eszett',
});

function cacheStore() {
  const isProduction = Netlify.context?.deploy?.context === 'production';
  return isProduction ? getStore(STORE) : getDeployStore(STORE);
}

function normalizeKind(value) {
  return value === 'spelling' || value === 'numbers' ? value : 'text';
}

function normalizeSpelling(text) {
  const compact = text.trim();
  if (!LETTER_RE.test(compact) && !SPELLING_RE.test(compact)) return text;
  const letters = compact.match(/[A-ZÄÖÜẞß]/gu) || [];
  return letters.map((letter) => GERMAN_LETTER_NAMES[letter] || letter).join(', ');
}

function speechInstructions(mode, kind) {
  const pace = mode === 'slow'
    ? 'Speak only a little slower than normal teaching speech. Use natural short pauses; never stretch vowels or consonants and never sound artificially slowed.'
    : 'Speak at a calm, natural teaching pace suitable for an adult A1 learner.';

  const task = kind === 'spelling'
    ? 'The input is a German spelling sequence. Pronounce every comma-separated item as an isolated German alphabet letter name, in Standard German, with a short natural pause between letters. Never combine the letters into a word and never use English letter names.'
    : kind === 'numbers'
      ? 'Read every number in German. Interpret common German learning contexts naturally: prices as Euro/Cent, clock times as German time expressions, dates in German, and phone-number-like sequences as clearly separated German digits or small natural groups. Never switch to English or Russian number names.'
      : 'Read the supplied German text naturally as Standard German.';

  return [
    'Speak only the supplied German content.',
    'Use native Standard German (Hochdeutsch) pronunciation with no English or Russian accent.',
    'Sound like a calm, warm, friendly adult German teacher: clear, patient, natural and non-theatrical.',
    'Keep German phonology precise, including ä, ö, ü, ß; ich-Laut and ach-Laut; sch; initial sp/st; z; ei; ie; eu/äu; German r; and natural German word endings.',
    task,
    pace,
  ].join(' ');
}

function audioResponse(audio, source) {
  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=0, must-revalidate',
      'X-Otto-TTS': source,
      'X-Otto-Voice': VOICE,
      'X-Otto-Cache-Version': CACHE_VERSION,
      'X-Otto-Language': 'de-DE',
    },
  });
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const text = String(body?.text || '').replace(/\s+/g, ' ').trim();
  const mode = body?.mode === 'slow' ? 'slow' : 'normal';
  const kind = normalizeKind(body?.kind);
  if (!text || text.length > MAX_TEXT_LENGTH) return new Response('Invalid text', { status: 400 });
  if (CYRILLIC_RE.test(text)) return new Response('German speech accepts German content only', { status: 400 });

  const input = kind === 'spelling' ? normalizeSpelling(text) : text;
  const speed = mode === 'slow' ? 0.90 : 0.98;
  const fingerprint = JSON.stringify({ cacheVersion: CACHE_VERSION, model: MODEL, voice: VOICE, language: 'de-DE', mode, kind, speed, input });
  const key = createHash('sha256').update(fingerprint).digest('hex');
  const store = cacheStore();

  const cached = await store.get(key, { type: 'arrayBuffer' });
  if (cached) return audioResponse(cached, 'cache');

  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  const baseUrl = (Netlify.env.get('OPENAI_BASE_URL') || 'https://api.openai.com').replace(/\/$/, '');
  if (!apiKey) return new Response('TTS is not configured', { status: 503 });

  const response = await fetch(`${baseUrl}/v1/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input,
      instructions: speechInstructions(mode, kind),
      response_format: 'mp3',
      speed,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('OTTO TTS provider error', response.status, detail.slice(0, 300));
    return new Response('TTS provider unavailable', { status: 502 });
  }

  const audio = await response.arrayBuffer();
  await store.set(key, audio);
  return audioResponse(audio, 'generated');
};

export const config = {
  path: '/api/otto-tts',
  method: 'POST',
  rateLimit: { windowLimit: 40, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
