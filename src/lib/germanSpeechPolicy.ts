// The single source of truth for German speech is /public/otto-speech.js.
// Keep this installer for compatibility with the existing app bootstrap, but do not
// install a second speechSynthesis monkey patch here. OttoSpeech owns neural TTS,
// spelling, number handling, normal/slow modes, cache policy and German-only fallback.
export function installGermanSpeechPolicy() {
  if (typeof window === 'undefined') return;
  (window as Window & { __ottoGermanSpeechPolicyInstalledV3?: boolean }).__ottoGermanSpeechPolicyInstalledV3 = true;
}
