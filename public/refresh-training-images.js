(() => {
  const VERSION = '20260914-1';

  function refreshHoerenImages() {
    document.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (!src || !src.startsWith('/images/') || src.includes('otto-img-v=')) return;
      img.setAttribute('src', `${src}${src.includes('?') ? '&' : '?'}otto-img-v=${VERSION}`);
    });
  }

  function refreshSprechenTeil3() {
    const card = document.querySelector('[role="img"][style*="teil3-requests.webp"]');
    if (!(card instanceof HTMLElement)) return;

    const match = document.body.textContent?.match(/T3\s*·\s*Karte\s+(\d+)\s+von\s+50/);
    if (!match) return;

    const number = Number(match[1]);
    if (!Number.isFinite(number)) return;

    if (number >= 1 && number <= 48) {
      const expected = `/sprechen/teil3-originals/CARD (${number}).png`;
      if (card.dataset.ottoOriginalCard === String(number) && card.style.backgroundImage.includes(`CARD%20(${number}).png`)) return;
      card.dataset.ottoOriginalCard = String(number);
      card.style.backgroundImage = `url("${expected}?otto-img-v=${VERSION}")`;
      card.style.backgroundRepeat = 'no-repeat';
      card.style.backgroundSize = 'contain';
      card.style.backgroundPosition = 'center';
      card.style.backgroundColor = '#fff';
      return;
    }

    if (number === 49 || number === 50) {
      if (card.dataset.ottoOriginalCard === `blank-${number}` && card.style.backgroundImage === 'none') return;
      card.dataset.ottoOriginalCard = `blank-${number}`;
      card.style.backgroundImage = 'none';
      card.style.backgroundColor = '#fff';
    }
  }

  function apply() {
    refreshHoerenImages();
    refreshSprechenTeil3();
  }

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'style'],
  });

  window.addEventListener('load', apply, { once: true });
  setTimeout(apply, 0);
})();
