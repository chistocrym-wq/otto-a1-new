(() => {
  'use strict';

  const MODE_KEY = 'ottoSpeechModeV1';
  const memoryCache = new Map();
  let activeAudio = null;
  let requestId = 0;

  const synth = window.speechSynthesis;
  const nativeSpeak = synth?.speak ? synth.speak.bind(synth) : null;
  const nativeCancel = synth?.cancel ? synth.cancel.bind(synth) : null;

  const GERMAN_LETTER_NAMES = {
    A: 'A', B: 'Be', C: 'Ce', D: 'De', E: 'E', F: 'Ef', G: 'Ge', H: 'Ha', I: 'I', J: 'Jot',
    K: 'Ka', L: 'El', M: 'Em', N: 'En', O: 'O', P: 'Pe', Q: 'Ku', R: 'Er', S: 'Es', T: 'Te',
    U: 'U', V: 'Fau', W: 'We', X: 'Iks', Y: 'Ypsilon', Z: 'Zett', Ä: 'Ä', Ö: 'Ö', Ü: 'Ü', ẞ: 'Eszett',
  };

  function savedMode() {
    try {
      const value = localStorage.getItem(MODE_KEY);
      if (value === 'normal' || value === 'slow') return value;
    } catch {}
    return null;
  }

  function suggestedMode() {
    try {
      if (location.pathname.startsWith('/otto-start')) {
        const state = JSON.parse(localStorage.getItem('ottoStartLearningPathV2') || '{}');
        return Number(state.currentLesson || 1) <= 7 ? 'slow' : 'normal';
      }
    } catch {}
    return 'normal';
  }

  function currentMode() {
    return savedMode() || suggestedMode();
  }

  function setMode(mode) {
    const next = mode === 'slow' ? 'slow' : 'normal';
    try { localStorage.setItem(MODE_KEY, next); } catch {}
    syncControls();
    window.dispatchEvent(new CustomEvent('otto:speech-mode', { detail: { mode: next } }));
  }

  function bestGermanVoice() {
    if (!synth?.getVoices) return null;
    const voices = synth.getVoices().filter((voice) => /^de([_-]|$)/i.test(voice.lang || ''));
    if (!voices.length) return null;
    const score = (voice) => {
      const name = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
      let points = 0;
      if (/natural|neural|premium|enhanced/.test(name)) points += 12;
      if (/google|microsoft|apple/.test(name)) points += 6;
      if (/^de-de$/i.test(voice.lang || '')) points += 8;
      if (voice.localService) points += 1;
      return points;
    };
    return voices.sort((a, b) => score(b) - score(a))[0] || voices[0];
  }

  function germanSpellingFallback(text) {
    const words = [];
    let letters = [];
    const flushWord = () => {
      if (!letters.length) return;
      words.push(letters.join(', '));
      letters = [];
    };

    for (const character of String(text || '').normalize('NFC')) {
      if (/\s/u.test(character)) {
        flushWord();
        continue;
      }
      const upper = character.toLocaleUpperCase('de-DE');
      if (GERMAN_LETTER_NAMES[upper]) letters.push(GERMAN_LETTER_NAMES[upper]);
      else if (/\d/u.test(character)) letters.push(character);
    }
    flushWord();
    return words.join('; ');
  }

  function browserFallback(text, mode = currentMode(), style = 'normal') {
    if (!nativeSpeak || !window.SpeechSynthesisUtterance) return false;
    nativeCancel?.();
    const spokenText = style === 'spelling' ? germanSpellingFallback(text) : text;
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'de-DE';
    utterance.rate = style === 'spelling' ? 0.78 : mode === 'slow' ? 0.82 : 0.96;
    utterance.pitch = 1;
    const voice = bestGermanVoice();
    if (voice) utterance.voice = voice;
    nativeSpeak(utterance);
    return true;
  }

  function stop() {
    requestId += 1;
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    nativeCancel?.();
  }

  async function fetchAudio(text, mode, style) {
    const key = `${style}:${mode}:${text}`;
    if (memoryCache.has(key)) return memoryCache.get(key);

    const response = await fetch('/api/otto-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode, style }),
    });
    if (!response.ok || !String(response.headers.get('content-type') || '').includes('audio/')) {
      throw new Error(`TTS unavailable: ${response.status}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    memoryCache.set(key, url);
    return url;
  }

  async function play(text, options = {}) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const mode = options.mode === 'slow' || options.mode === 'normal' ? options.mode : currentMode();
    const style = options.style === 'spelling' ? 'spelling' : 'normal';
    const id = ++requestId;

    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    nativeCancel?.();

    try {
      const url = await fetchAudio(clean, mode, style);
      if (id !== requestId) return false;
      const audio = new Audio(url);
      activeAudio = audio;
      audio.preload = 'auto';
      audio.playbackRate = 1;
      await audio.play();
      return true;
    } catch {
      if (id !== requestId) return false;
      return browserFallback(clean, mode, style);
    }
  }

  function spell(text, options = {}) {
    return play(text, { ...options, style: 'spelling' });
  }

  window.OttoSpeech = {
    play,
    spell,
    stop,
    setMode,
    getMode: currentMode,
    isNeuralPreferred: true,
  };

  // Preserve existing application logic: any current speechSynthesis call is upgraded
  // to Otto's German neural voice, while the best de-DE device voice remains the fallback.
  if (synth && nativeSpeak) {
    try {
      synth.speak = (utterance) => {
        const text = String(utterance?.text || '').trim();
        if (!text) return nativeSpeak(utterance);
        void play(text, { mode: currentMode(), style: 'normal' });
      };
      synth.cancel = () => stop();
    } catch {
      // Some embedded browsers expose non-writable SpeechSynthesis methods.
    }
  }

  function controlMarkup() {
    const mode = currentMode();
    return `<div class="otto-speech-speed" role="group" aria-label="Скорость немецкой речи">
      <span>Темп</span>
      <button type="button" data-otto-speech-mode="normal" class="${mode === 'normal' ? 'is-active' : ''}" aria-pressed="${mode === 'normal'}">🔊 Нормально</button>
      <button type="button" data-otto-speech-mode="slow" class="${mode === 'slow' ? 'is-active' : ''}" aria-pressed="${mode === 'slow'}">🐢 Медленнее</button>
    </div>`;
  }

  function syncControls() {
    const mode = currentMode();
    document.querySelectorAll('[data-otto-speech-mode]').forEach((button) => {
      const active = button.getAttribute('data-otto-speech-mode') === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function enhanceStartUI() {
    if (!location.pathname.startsWith('/otto-start')) return;
    const screen = document.querySelector('#app .screen');
    if (!screen) return;

    if (screen.querySelector('[data-speak], [data-letter]') && !screen.querySelector('.otto-speech-speed')) {
      const holder = document.createElement('div');
      holder.innerHTML = controlMarkup();
      const control = holder.firstElementChild;
      const anchor = screen.querySelector('.lesson-top, .topbar');
      if (anchor?.nextSibling) anchor.parentNode.insertBefore(control, anchor.nextSibling);
      else screen.prepend(control);
    }

    if (screen.querySelector('.settings') && !screen.querySelector('.otto-ai-voice-note')) {
      const note = document.createElement('div');
      note.className = 'otto-ai-voice-note';
      note.innerHTML = '<b>Голос Отто</b><p>Основная немецкая озвучка создаётся нейросинтезом. Если она временно недоступна, приложение автоматически использует лучший немецкий голос устройства.</p>';
      screen.querySelector('.settings').after(note);
    }
    syncControls();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-otto-speech-mode]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    setMode(button.getAttribute('data-otto-speech-mode'));
  }, true);

  if (synth?.addEventListener) synth.addEventListener('voiceschanged', syncControls);
  const appRoot = document.querySelector('#app');
  if (appRoot) new MutationObserver(() => queueMicrotask(enhanceStartUI)).observe(appRoot, { childList: true, subtree: true });
  enhanceStartUI();
})();
