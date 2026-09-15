const GERMAN_LETTER_NAMES: Record<string, string> = {
  A: 'A', B: 'Be', C: 'Tse', D: 'De', E: 'E', F: 'Eff', G: 'Ge', H: 'Ha', I: 'I',
  J: 'Jott', K: 'Ka', L: 'Ell', M: 'Emm', N: 'Enn', O: 'O', P: 'Pe', Q: 'Ku', R: 'Err',
  S: 'Ess', T: 'Te', U: 'U', V: 'Fau', W: 'We', X: 'Iks', Y: 'Ypsilon', Z: 'Zett',
  Ä: 'Ä', Ö: 'Ö', Ü: 'Ü', 'ẞ': 'Eszett',
};

const SPELLING_SEQUENCE = /((?:\b[A-ZÄÖÜẞ]\b\s*[–—-]\s*)+\b[A-ZÄÖÜẞ]\b)/u;

type OttoSpeechSynthesis = SpeechSynthesis & { __ottoGermanSpeechPolicyInstalled?: boolean };

function isGermanVoice(voice: SpeechSynthesisVoice) {
  return /^de(?:-|_)/i.test(voice.lang || '');
}

function voiceQualityScore(voice: SpeechSynthesisVoice) {
  const lang = (voice.lang || '').replace('_', '-').toLowerCase();
  const name = (voice.name || '').toLowerCase();
  let score = 0;
  if (lang === 'de-de') score += 100;
  else if (lang.startsWith('de-')) score += 60;
  if (/natural|premium|online|neural|google|microsoft|apple/.test(name)) score += 30;
  if (/anna|katja|conrad|stefan|markus|vicki|petra/.test(name)) score += 8;
  if (voice.localService === false) score += 4;
  return score;
}

function chooseGermanVoice(synthesis: SpeechSynthesis) {
  return synthesis
    .getVoices()
    .filter(isGermanVoice)
    .sort((a, b) => voiceQualityScore(b) - voiceQualityScore(a))[0] ?? null;
}

function prepareGermanUtterance(utterance: SpeechSynthesisUtterance, synthesis: SpeechSynthesis) {
  utterance.lang = 'de-DE';
  const voice = chooseGermanVoice(synthesis);
  if (voice) utterance.voice = voice;
}

function speakOne(
  text: string,
  synthesis: SpeechSynthesis,
  nativeSpeak: (utterance: SpeechSynthesisUtterance) => void,
  template: SpeechSynthesisUtterance,
  rate?: number,
) {
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = rate ?? template.rate ?? 0.9;
    utterance.pitch = template.pitch ?? 1;
    utterance.volume = template.volume ?? 1;
    prepareGermanUtterance(utterance, synthesis);

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    utterance.onend = done;
    utterance.onerror = done;
    nativeSpeak(utterance);
    window.setTimeout(done, Math.max(1400, text.length * 220));
  });
}

async function speakSpellingSequence(
  original: SpeechSynthesisUtterance,
  synthesis: SpeechSynthesis,
  nativeSpeak: (utterance: SpeechSynthesisUtterance) => void,
  match: RegExpExecArray,
) {
  const full = original.text;
  const spelling = match[1];
  const start = match.index;
  const prefix = full.slice(0, start).trim();
  const suffix = full.slice(start + spelling.length).replace(/^\s*[.!?,;:]\s*/, '').trim();
  const letters = spelling
    .split(/[–—-]/u)
    .map((value) => value.trim().toLocaleUpperCase('de-DE'))
    .filter(Boolean);

  if (prefix) {
    await speakOne(prefix, synthesis, nativeSpeak, original, Math.min(original.rate || 0.9, 0.92));
    await new Promise((resolve) => window.setTimeout(resolve, 180));
  }

  for (let index = 0; index < letters.length; index += 1) {
    const spoken = GERMAN_LETTER_NAMES[letters[index]] ?? letters[index];
    await speakOne(spoken, synthesis, nativeSpeak, original, 0.78);
    if (index < letters.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 210));
    }
  }

  if (suffix) {
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    await speakOne(suffix, synthesis, nativeSpeak, original, Math.min(original.rate || 0.9, 0.92));
  }

  original.onend?.(new SpeechSynthesisEvent('end', { utterance: original }));
}

export function installGermanSpeechPolicy() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synthesis = window.speechSynthesis as OttoSpeechSynthesis;
  if (synthesis.__ottoGermanSpeechPolicyInstalled) return;
  synthesis.__ottoGermanSpeechPolicyInstalled = true;

  const nativeSpeak = synthesis.speak.bind(synthesis);
  synthesis.speak = ((utterance: SpeechSynthesisUtterance) => {
    prepareGermanUtterance(utterance, synthesis);
    const spellingMatch = SPELLING_SEQUENCE.exec(utterance.text || '');
    if (!spellingMatch) {
      nativeSpeak(utterance);
      return;
    }

    synthesis.cancel();
    void speakSpellingSequence(utterance, synthesis, nativeSpeak, spellingMatch);
  }) as SpeechSynthesis['speak'];
}
