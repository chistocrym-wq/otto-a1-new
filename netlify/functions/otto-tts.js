import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const MODEL = 'gpt-4o-mini-tts-2025-12-15';
const VOICE = 'marin';
const CACHE_VERSION = 'v2-marin-de';
const STORE = `otto-tts-cache-${CACHE_VERSION}`;
const MAX_TEXT_LENGTH = 420;
const PROBE_TOKEN = 'otto-final-voice-v2';
const CYRILLIC_RE = /[А-Яа-яЁё]/u;
const LETTER_RE = /^[A-ZÄÖÜẞß]$/u;
const SPELLING_RE = /^(?:[A-ZÄÖÜẞß]\s*[–—-]\s*)+[A-ZÄÖÜẞß]$/u;
const GERMAN_LETTER_NAMES = Object.freeze({
  A:'A',B:'Be',C:'Ce',D:'De',E:'E',F:'Eff',G:'Ge',H:'Ha',I:'I',J:'Jot',K:'Ka',L:'Ell',M:'Em',N:'En',O:'O',P:'Pe',Q:'Ku',R:'Er',S:'Es',T:'Te',U:'U',V:'Vau',W:'We',X:'Ix',Y:'Ypsilon',Z:'Zett',Ä:'Ä',Ö:'Ö',Ü:'Ü',ẞ:'Eszett',ß:'Eszett',
});
const PROBE_CASES = Object.freeze({
  normal: { text: 'Ich heiße Otto. Schön, dass du da bist. Straße. Mädchen. sprechen. fünf. zwölf.', mode: 'normal', kind: 'text' },
  slow: { text: 'Ich möchte einen Deutschkurs besuchen. Können Sie mir bitte helfen? Wie viel kostet der Kurs?', mode: 'slow', kind: 'text' },
  spelling: { text: 'A – B – C – D – E – F – G – H – I – J – K – L – M – N – O – P – Q – R – S – T – U – V – W – X – Y – Z – Ä – Ö – Ü – ß', mode: 'normal', kind: 'spelling' },
  numbers: { text: '0 1 2 7 12 16 17 20 21 27 30 40 50 70 99 100', mode: 'normal', kind: 'numbers' },
  phrase: { text: 'Heute kann ich leider nicht kommen. Mit freundlichen Grüßen.', mode: 'normal', kind: 'text' },
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

function probeResponse(audio, source, providerContentType = 'audio/mpeg', probeCase = 'normal') {
  return Response.json({
    ok: true,
    case: probeCase,
    source,
    bytes: audio.byteLength,
    contentType: 'audio/mpeg',
    providerContentType,
    model: MODEL,
    voice: VOICE,
    cacheVersion: CACHE_VERSION,
    language: 'de-DE',
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export default async (req) => {
  const url = new URL(req.url);
  const isProbe = req.method === 'GET'
    && Netlify.context?.deploy?.context === 'deploy-preview'
    && url.searchParams.get('probe') === PROBE_TOKEN;

  let body;
  let probeCase = 'normal';
  if (isProbe) {
    probeCase = Object.hasOwn(PROBE_CASES, url.searchParams.get('case')) ? url.searchParams.get('case') : 'normal';
    body = PROBE_CASES[probeCase];
  } else if (req.method === 'POST') {
    try { body = await req.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  } else {
    return new Response('Method not allowed', { status: 405 });
  }

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
  if (cached) return isProbe ? probeResponse(cached, 'cache', 'audio/mpeg', probeCase) : audioResponse(cached, 'cache');

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

  const providerContentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (!providerContentType.includes('audio/mpeg')) {
    console.error('OTTO TTS provider returned unexpected content type', providerContentType);
    return new Response('Unexpected TTS format', { status: 502 });
  }

  const audio = await response.arrayBuffer();
  await store.set(key, audio);
  return isProbe ? probeResponse(audio, 'generated', providerContentType, probeCase) : audioResponse(audio, 'generated');
};

export const config = {
  path: '/api/otto-tts',
  rateLimit: { windowLimit: 40, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
