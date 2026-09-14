import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const MODEL = 'gpt-4o-mini-tts-2025-12-15';
const VOICE = 'marin';
const STORE = 'otto-tts-cache-v2';
const MAX_TEXT_LENGTH = 420;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function cacheStore() {
  const isProduction = Netlify.context?.deploy?.context === 'production';
  return isProduction ? getStore(STORE) : getDeployStore(STORE);
}

function speechInstructions(mode, style) {
  const pace = mode === 'slow'
    ? 'Speak slightly slower than normal conversational German, with natural phrasing. Do not stretch individual phonemes or sound robotic.'
    : 'Speak at a calm, natural conversational pace for an adult beginner.';

  const delivery = style === 'spelling'
    ? 'This is a spelling exercise. Spell the supplied name, word or address character by character. Use German letter names only, with a short natural pause between every letter. Use Jot for J, Fau for V, We for W, Ypsilon for Y, Zett for Z and Eszett for ß. Say umlauts as Ä, Ö and Ü. Never pronounce the supplied word as a whole.'
    : 'Read the supplied German naturally as connected speech. Any digits, telephone numbers, ages, dates, postcodes, house numbers and other numeric values must be pronounced in German only.';

  return [
    'Speak only in native Standard German (Hochdeutsch), using a de-DE pronunciation model.',
    'Sound like a warm, composed, friendly adult German teacher: clear, trustworthy, patient and natural.',
    'Keep articulation precise but never theatrical, sing-song, childish, advertising-like or robotic.',
    'Pronounce German phonology natively, especially ch, sch, r, ü, ö, ä, ei, ie, eu, z, sp and st.',
    'Never switch to Russian or English pronunciation. Never use Russian or English names for German letters or numbers.',
    delivery,
    pace,
  ].join(' ');
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });

  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  const baseUrl = (Netlify.env.get('OPENAI_BASE_URL') || 'https://api.openai.com').replace(/\/$/, '');
  if (!apiKey) return json({ fallback: true, error: 'Neural voice is not configured.' }, 503);

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || '').trim();
  const mode = body.mode === 'slow' ? 'slow' : 'normal';
  const style = body.style === 'spelling' ? 'spelling' : 'normal';

  if (!text) return json({ error: 'Text is required.' }, 400);
  if (text.length > MAX_TEXT_LENGTH) return json({ error: 'Text is too long.' }, 413);

  const speed = mode === 'slow' ? 0.86 : 0.98;
  const instructions = speechInstructions(mode, style);
  const fingerprint = JSON.stringify({ model: MODEL, voice: VOICE, mode, style, speed, instructions, text });
  const key = createHash('sha256').update(fingerprint).digest('hex');
  const store = cacheStore();

  try {
    const cached = await store.get(key, { type: 'arrayBuffer' });
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Otto-TTS': 'cache',
        },
      });
    }
  } catch (error) {
    console.warn('otto-tts cache read failed', error);
  }

  try {
    const response = await fetch(`${baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        input: text,
        instructions,
        response_format: 'mp3',
        speed,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('otto-tts provider error', response.status, detail.slice(0, 500));
      return json({ fallback: true, error: 'Neural voice is temporarily unavailable.' }, 502);
    }

    const audio = await response.arrayBuffer();
    try {
      await store.set(key, audio);
    } catch (error) {
      console.warn('otto-tts cache write failed', error);
    }

    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Otto-TTS': 'generated',
      },
    });
  } catch (error) {
    console.error('otto-tts error', error);
    return json({ fallback: true, error: 'Neural voice is temporarily unavailable.' }, 502);
  }
};

export const config = {
  path: '/api/otto-tts',
  method: 'POST',
  rateLimit: {
    windowLimit: 40,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
