(() => {
  'use strict';

  const hero = document.querySelector('.home-hero');
  const layout = document.querySelector('.home-page .page-layout');
  if (!hero || !layout) return;
  const body = document.body;
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const socials = hero.querySelector('.hero-socials');
  const resume = hero.querySelector('.hero-resume');
  const portrait = { source: hero.querySelector('.hero-portrait'), target: layout.querySelector('.profile-photo') };
  const space = document.createElement('div');
  space.className = 'hero-scroll-space';
  space.setAttribute('aria-hidden', 'true');
  space.hidden = true;
  hero.before(space);

  let enabled = false;
  let distance = 0;
  let lastProgress = 0;
  let frame = 0;
  let measuring = false;
  let printing = false;
  let pendingFocus = null;
  let entryFrame = 0;
  let touchStart = null;
  let completed = false;
  const sessionKey = 'portfolio-profile-welcome-seen';
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
  const mix = (a, b, p) => a + (b - a) * p;
  const px = value => `${value.toFixed(3)}px`;
  const loading = () => root.matches('.page-preparing, .page-loading, .welcome-active');

  function focusContent(target) {
    if (!target.hasAttribute('tabindex')) {
      target.tabIndex = -1;
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    target.focus({ preventScroll: true });
  }

  function render() {
    frame = 0;
    if (measuring || printing) return;
    if (completed) {
      if (!loading()) {
        header.inert = false;
        layout.inert = false;
        hero.inert = true;
        if (pendingFocus) { focusContent(pendingFocus); pendingFocus = null; }
      }
      return;
    }
    if (!loading() && ((enabled && window.scrollY >= distance) ||
        (!enabled && body.classList.contains('profile-opening-ready') && hero.getBoundingClientRect().bottom <= header.offsetHeight))) {
      completeOpening();
      return;
    }
    const headerProgress = enabled ? window.scrollY / distance : window.scrollY / Math.max(1, hero.offsetHeight);
    const navigation = ease((headerProgress - .4) / .4);
    body.style.setProperty('--opening-navigation', String(navigation));
    body.classList.toggle('opening-header-hidden', navigation === 0);
    if (!loading()) header.inert = navigation < .95;
    if (!enabled) return;
    const progress = clamp(window.scrollY / distance);
    lastProgress = progress;
    const active = progress < 1;
    body.classList.toggle('hero-morph-active', active);
    body.classList.toggle('hero-morph-complete', !active);
    body.style.setProperty('--opening-offset', px(Math.min(0, window.scrollY - distance)));
    const departure = ease((progress - .06) / .32);
    const arrival = ease((progress - .38) / .5);
    body.style.setProperty('--opening-extras', String(1 - departure));
    body.style.setProperty('--opening-copy-shift', px(-20 * departure));
    body.style.setProperty('--opening-cue', String(1 - ease((progress - .12) / .25)));
    body.style.setProperty('--opening-details', String(arrival));
    body.style.setProperty('--opening-arrival-shift', px(18 * (1 - arrival)));
    body.style.setProperty('--opening-name', String(ease((progress - .7) / .25)));

    if (active) {
      const p = ease((progress - .12) / .7);
      const { start, end, target } = portrait;
      target.style.setProperty('--flight-x', px(mix(start.left, end.left, p) - end.left));
      target.style.setProperty('--flight-y', px(mix(start.top, end.top, p) - end.top));
      target.style.setProperty('--flight-width', px(mix(start.width, end.width, p)));
      target.style.setProperty('--flight-height', px(mix(start.height, end.height, p)));
      target.style.setProperty('--flight-radius', px((1 - p) * Math.min(start.width, start.height) / 2));
    }

    // The welcome dialog owns inert state until it releases the document.
    if (!loading()) {
      layout.inert = active;
      hero.inert = !active;
      socials.inert = progress > .25;
      if (resume) resume.inert = progress > .25;
      hero.querySelector('.hero-scroll-cue').inert = progress > .35;
      if (!active && pendingFocus) {
        focusContent(pendingFocus);
        pendingFocus = null;
      }
    }
  }

  function scheduleRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function cancelEntry() {
    cancelAnimationFrame(entryFrame);
    entryFrame = 0;
  }

  function completeOpening(preservePosition = true) {
    if (completed) return;
    const removedHeight = enabled ? distance : hero.offsetHeight + (parseFloat(getComputedStyle(hero).marginTop) || 0);
    const nextTop = Math.max(0, window.scrollY - removedHeight);
    if (!pendingFocus && hero.contains(document.activeElement)) pendingFocus = layout.querySelector('.profile-mark');
    cancelEntry();
    completed = true;
    enabled = false;
    hero.hidden = true;
    space.hidden = true;
    body.classList.remove('profile-opening-ready', 'opening-header-hidden', 'hero-morph-ready', 'hero-morph-active', 'hero-morph-complete', 'hero-morph-measuring');
    try { sessionStorage.setItem(sessionKey, '1'); } catch { /* Still finish this visit when storage is unavailable. */ }
    // Remove the introductory scroll space without moving the visible content.
    if (preservePosition) window.scrollTo({ top: nextTop, behavior: 'instant' });
    render();
  }

  // A single deliberate scroll runs the full opening, independent of how far
  // a mouse wheel or trackpad travels. Regular scrolling resumes on arrival.
  function enterPortfolio() {
    if (!enabled || loading() || entryFrame || window.scrollY >= distance) return;
    const from = window.scrollY;
    const started = performance.now();
    function step(now) {
      const elapsed = clamp((now - started) / 850);
      window.scrollTo({ top: mix(from, distance, ease(elapsed)), behavior: 'instant' });
      render();
      entryFrame = elapsed < 1 && !completed ? requestAnimationFrame(step) : 0;
    }
    entryFrame = requestAnimationFrame(step);
  }

  window.addEventListener('wheel', event => {
    if (!enabled || loading() || event.ctrlKey || event.defaultPrevented || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.deltaY < 0) { cancelEntry(); return; }
    if (event.deltaY > 0 && (entryFrame || window.scrollY < distance)) {
      if (!event.cancelable) return;
      event.preventDefault();
      enterPortfolio();
    }
  }, { passive: false });

  window.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    if (event.touches.length > 1) cancelEntry();
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    if (!enabled || loading() || !touchStart || event.touches.length !== 1 || event.defaultPrevented) return;
    const dx = touchStart.x - event.touches[0].clientX;
    const dy = touchStart.y - event.touches[0].clientY;
    if (dy < -12) { cancelEntry(); return; }
    if (dy > 12 && Math.abs(dy) > Math.abs(dx) && (entryFrame || window.scrollY < distance) && event.cancelable) {
      event.preventDefault();
      enterPortfolio();
    }
  }, { passive: false });
  const clearTouch = () => { touchStart = null; };
  window.addEventListener('touchend', clearTouch, { passive: true });
  window.addEventListener('touchcancel', clearTouch, { passive: true });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Home') cancelEntry();
    if (!enabled || loading() || window.scrollY >= distance || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    if (!['ArrowDown', 'PageDown', ' '].includes(event.key) || event.target.closest('input, textarea, select, button, summary, [contenteditable="true"]')) return;
    event.preventDefault();
    pendingFocus = layout.querySelector('.profile-mark');
    enterPortfolio();
  });

  function disable(preservePosition = true) {
    if (completed) { render(); return; }
    cancelEntry();
    const wasEnabled = enabled;
    const previousY = window.scrollY;
    enabled = false;
    body.classList.remove('hero-morph-ready', 'hero-morph-active', 'hero-morph-complete', 'hero-morph-measuring');
    space.hidden = true;
    if (!loading()) {
      layout.inert = false;
      hero.inert = false;
      socials.inert = false;
      if (resume) resume.inert = false;
      hero.querySelector('.hero-scroll-cue').inert = false;
      header.inert = false;
    }
    if (wasEnabled && preservePosition && !printing) {
      const top = previousY >= distance ? previousY + distance - hero.offsetHeight : 0;
      window.scrollTo({ top, behavior: 'instant' });
    }
    render();
  }

  function measure(preservePosition = false) {
    if (measuring || printing) return;
    if (completed) { render(); return; }
    const resumeEntry = !!entryFrame;
    cancelEntry();
    const previousHeaderHeight = parseFloat(root.style.getPropertyValue('--header-height')) || header.getBoundingClientRect().height;
    const headerHeight = header.getBoundingClientRect().height;
    root.style.setProperty('--header-height', px(headerHeight));
    body.classList.add('profile-opening-ready');
    if (motion.matches) { disable(preservePosition); return; }
    const available = window.innerHeight;
    // At high browser zoom or in a short landscape view, keep the introduction
    // in normal document flow so all text and links remain reachable.
    if (available < 460) { disable(preservePosition); return; }

    const wasEnabled = enabled;
    const previousDistance = distance;
    const previousY = window.scrollY;
    const previousHeroHeight = hero.offsetHeight;
    measuring = true;
    body.classList.add('hero-morph-ready', 'hero-morph-active', 'hero-morph-measuring');
    body.classList.remove('hero-morph-complete');
    space.hidden = false;
    distance = Math.round(hero.clientHeight * .9);
    space.style.height = `${distance}px`;
    if (hero.scrollHeight > hero.clientHeight + 2) {
      distance = previousDistance;
      measuring = false;
      disable(preservePosition);
      return;
    }

    // Read the actual resting layout, with sticky positioning temporarily released.
    // Document coordinates make these destinations independent of restored scroll.
    const source = portrait.source.getBoundingClientRect();
    const target = portrait.target.getBoundingClientRect();
    portrait.start = { left: source.left, top: source.top, width: source.width, height: source.height };
    portrait.end = { left: target.left, top: target.top + window.scrollY - distance, width: target.width, height: target.height };
    body.classList.remove('hero-morph-measuring');
    enabled = true;
    measuring = false;

    if (preservePosition) {
      let top = previousY;
      if (wasEnabled && previousDistance) {
        top = previousY < previousDistance
          ? lastProgress * distance
          : previousY + headerHeight - previousHeaderHeight;
      } else if (previousY >= previousHeroHeight) {
        top += distance - previousHeroHeight;
      }
      if (Math.abs(top - window.scrollY) > 1) window.scrollTo({ top, behavior: 'instant' });
    }
    render();
    if (resumeEntry) enterPortfolio();
  }

  function navigateTo(target, behavior, focus = false) {
    cancelEntry();
    if (!completed) completeOpening(false);
    const inset = header.getBoundingClientRect().height + 24;
    const top = target.getBoundingClientRect().top + window.scrollY - inset;
    if (focus) pendingFocus = target;
    window.scrollTo({ top, behavior });
    render();
    if (!enabled && pendingFocus) { focusContent(pendingFocus); pendingFocus = null; }
  }

  function followHash() {
    const id = location.hash.slice(1);
    let target;
    try { target = id && document.getElementById(decodeURIComponent(id)); } catch { return; }
    if (target && layout.contains(target)) navigateTo(target, 'instant');
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!enabled || !link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target || !layout.contains(target)) return;
    // Native anchor positions include transforms. Account for the introductory
    // scroll distance so bookmarks land on their actual section after the move.
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    if (link.matches('.hero-scroll-cue')) {
      if (event.detail === 0) pendingFocus = layout.querySelector('.profile-mark');
      enterPortfolio();
      return;
    }
    navigateTo(target, motion.matches ? 'instant' : 'smooth', event.detail === 0);
  });

  hero.addEventListener('keydown', event => {
    if (!enabled || event.key !== 'Tab' || event.shiftKey || document.activeElement !== hero.querySelector('.hero-scroll-cue')) return;
    event.preventDefault();
    cancelEntry();
    window.scrollTo({ top: distance, behavior: 'instant' });
    render();
    layout.querySelector('.profile-mark').focus({ preventScroll: true });
  });

  document.addEventListener('keydown', event => {
    if (!enabled || loading() || event.key !== 'Tab' || window.scrollY <= 0 || window.scrollY >= distance) return;
    const wasInHero = hero.contains(document.activeElement);
    cancelEntry();
    window.scrollTo({ top: distance, behavior: 'instant' });
    render();
    if (wasInHero) {
      event.preventDefault();
      (event.shiftKey ? header.querySelector('.site-menu > summary') : layout.querySelector('.profile-mark')).focus({ preventScroll: true });
    }
  }, true);

  window.addEventListener('scroll', scheduleRender, { passive: true });
  window.addEventListener('resize', () => measure(true), { passive: true });
  window.addEventListener('hashchange', () => requestAnimationFrame(followHash));
  window.addEventListener('pageshow', event => { if (event.persisted) measure(true); });
  window.addEventListener('pagehide', () => { cancelEntry(); cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('beforeprint', () => { printing = true; disable(false); });
  window.addEventListener('afterprint', () => { printing = false; measure(true); });
  motion.addEventListener('change', () => measure(true));
  new MutationObserver(() => {
    if (!enabled && !loading()) { hero.inert = completed; layout.inert = false; }
    scheduleRender();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  try {
    if (sessionStorage.getItem(sessionKey) === '1') completeOpening(false);
  } catch { /* Allow the introduction normally if storage is blocked. */ }
  if ('ResizeObserver' in window) {
    let previousHeaderHeight = 0;
    new ResizeObserver(() => {
      const height = header.getBoundingClientRect().height;
      if (height !== previousHeaderHeight) { previousHeaderHeight = height; measure(true); }
    }).observe(header);
  }
  const styles = document.querySelector('#site-styles');
  if (styles?.media === 'all') measure(window.scrollY > 0);
  styles?.addEventListener('load', () => { measure(window.scrollY > 0); followHash(); }, { once: true });
  requestAnimationFrame(followHash);
})();
