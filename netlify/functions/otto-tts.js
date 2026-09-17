import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const MODEL = 'x-ai/grok-voice-tts-1.0';
const VOICE = 'ara';
const CACHE_VERSION = 'v3-grok-ara-de';
const STORE = `otto-tts-cache-${CACHE_VERSION}`;
const MAX_TEXT_LENGTH = 420;
const PROBE_TOKEN = 'otto-final-voice-v3';
const CYRILLIC_RE = /[А-Яа-яЁё]/u;
const LETTER_RE = /^[A-ZÄÖÜẞß]$/u;
const SPELLING_RE = /^(?:[A-ZÄÖÜẞß]\s*[–—-]\s*)+[A-ZÄÖÜẞß]$/u;
const GERMAN_LETTER_NAMES = Object.freeze({
  A:'A',B:'Be',C:'Ce',D:'De',E:'E',F:'Eff',G:'Ge',H:'Ha',I:'I',J:'Jot',K:'Ka',L:'Ell',M:'Em',N:'En',O:'O',P:'Pe',Q:'Ku',R:'Er',S:'Es',T:'Te',U:'U',V:'Vau',W:'We',X:'Ix',Y:'Ypsilon',Z:'Zett',Ä:'Ä',Ö:'Ö',Ü:'Ü',ẞ:'Eszett',ß:'Eszett',
});
const DIGITS = ['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun'];
const SMALL = ['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
const TENS = {20:'zwanzig',30:'dreißig',40:'vierzig',50:'fünfzig',60:'sechzig',70:'siebzig',80:'achtzig',90:'neunzig'};
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
  return letters.map((letter) => GERMAN_LETTER_NAMES[letter] || letter).join(' [pause] ');
}

function numberToGerman(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(value);
  if (n < 20) return SMALL[n];
  if (n < 100) {
    const ones = n % 10;
    const tens = n - ones;
    return ones ? `${ones === 1 ? 'ein' : DIGITS[ones]}und${TENS[tens]}` : TENS[tens];
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const head = `${hundreds === 1 ? 'ein' : DIGITS[hundreds]}hundert`;
    return rest ? `${head}${numberToGerman(rest)}` : head;
  }
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = `${thousands === 1 ? 'ein' : numberToGerman(thousands)}tausend`;
  return rest ? `${head}${numberToGerman(rest)}` : head;
}

function digitByDigit(value) {
  return String(value).replace(/\D/g, '').split('').map((digit) => DIGITS[Number(digit)]).join(' [pause] ');
}

function normalizeNumbers(text) {
  let out = String(text);
  out = out.replace(/\b(\d{1,4})[,.](\d{1,2})\s*€/g, (_, euros, cents) => `${numberToGerman(euros)} Euro ${numberToGerman(cents)} Cent`);
  out = out.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_, hour, minute) => `${numberToGerman(Number(hour))} Uhr ${Number(minute) ? numberToGerman(Number(minute)) : ''}`.trim());
  out = out.replace(/\b\d{5,}\b/g, (value) => digitByDigit(value));
  out = out.replace(/\b\d{1,4}\b/g, (value) => numberToGerman(value));
  return out;
}

function prepareInput(text, mode, kind) {
  let input = kind === 'spelling' ? normalizeSpelling(text) : kind === 'numbers' ? normalizeNumbers(text) : text;
  if (mode === 'slow') input = `<slow>${input}</slow>`;
  return input;
}

function audioResponse(audio, source) {
  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=0, must-revalidate',
      'X-Otto-TTS': source,
      'X-Otto-Voice': VOICE,
      'X-Otto-Model': MODEL,
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

  const input = prepareInput(text, mode, kind);
  const speed = mode === 'slow' ? 0.90 : 0.98;
  const fingerprint = JSON.stringify({ cacheVersion: CACHE_VERSION, model: MODEL, voice: VOICE, language: 'de-DE', mode, kind, speed, input });
  const key = createHash('sha256').update(fingerprint).digest('hex');
  const store = cacheStore();

  const cached = await store.get(key, { type: 'arrayBuffer' });
  if (cached) return isProbe ? probeResponse(cached, 'cache', 'audio/mpeg', probeCase) : audioResponse(cached, 'cache');

  const apiKey = Netlify.env.get('OPENROUTER_API_KEY');
  const baseUrl = String(Netlify.env.get('OPENROUTER_BASE_URL') || '').replace(/\/$/, '');
  if (!apiKey || !baseUrl) return new Response('TTS is not configured', { status: 503 });

  const response = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input,
      response_format: 'mp3',
      speed,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('OTTO TTS provider error', response.status, detail.slice(0, 300));
    if (isProbe) {
      let providerHost = 'invalid-base-url';
      try { providerHost = new URL(baseUrl).host; } catch {}
      return Response.json({
        ok: false,
        case: probeCase,
        providerStatus: response.status,
        providerDetail: detail.slice(0, 300),
        providerHost,
        model: MODEL,
        voice: VOICE,
        cacheVersion: CACHE_VERSION,
      }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
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
