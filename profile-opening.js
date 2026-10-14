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
  const name = layout.querySelector('.profile-name');
  const description = layout.querySelector('.intro-lead');
  const parts = [
    { source: hero.querySelector('.hero-portrait'), target: layout.querySelector('.profile-photo'), photo: true, delay: 0, duration: .5 },
    { source: hero.querySelector('h1'), target: name.querySelector('.profile-name-text'), delay: .52, duration: .48, fontDuration: .52 },
    { source: hero.querySelector('.hero-description'), target: description.querySelector('.intro-lead-text'), delay: .86, duration: .14 },
  ];
  const space = document.createElement('div');
  space.className = 'hero-scroll-space';
  space.setAttribute('aria-hidden', 'true');
  space.hidden = true;
  hero.before(space);

  let enabled = false;
  let distance = 0;
  let frame = 0;
  let measuring = false;
  let printing = false;
  let pendingFocus = null;
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
    if (!enabled || measuring) return;
    const progress = clamp(window.scrollY / distance);
    const active = progress < 1;
    body.classList.toggle('hero-morph-active', active);
    body.classList.toggle('hero-morph-complete', !active);
    body.style.setProperty('--opening-offset', px(Math.min(0, window.scrollY - distance)));
    body.style.setProperty('--opening-extras', String(1 - ease(progress / .3)));
    body.style.setProperty('--opening-cue', String(1 - ease((progress - .85) / .15)));
    body.style.setProperty('--opening-details', String(ease((progress - .65) / .35)));
    body.style.setProperty('--opening-progress', String(ease(progress)));

    if (active) {
      const p = ease(progress);
      parts.forEach(part => {
        const itemProgress = ease((progress - part.delay) / part.duration);
        const { start, end, target } = part;
        let currentX = mix(start.left, end.left, itemProgress);
        let currentY = mix(start.top, end.top, itemProgress);
        if (!part.photo) {
          const routeX = part.routeX ?? start.left;
          const movement = itemProgress;
          if (movement < .5) {
            currentX = mix(start.left, routeX, movement * 2);
            currentY = mix(start.top, end.top, movement * 2);
          } else {
            currentX = mix(routeX, end.left, (movement - .5) * 2);
            currentY = end.top;
          }
        }
        target.style.setProperty('--flight-x', px(currentX - end.left));
        target.style.setProperty('--flight-y', px(currentY - end.top));
        const typeProgress = part.fontDuration ? ease(progress / part.fontDuration) : itemProgress;
        target.style.setProperty('--flight-width', px(mix(start.width, end.width, typeProgress)));
        if (part.photo) {
          target.style.setProperty('--flight-height', px(mix(start.height, end.height, itemProgress)));
          target.style.setProperty('--flight-radius', px((1 - itemProgress) * Math.min(start.width, start.height) / 2));
        } else {
          for (const property of ['font', 'line', 'spacing']) {
            target.style.setProperty(`--flight-${property}`, px(mix(start[property], end[property], typeProgress)));
          }
        }
      });
    }

    // The welcome dialog owns inert state until it releases the document.
    if (!loading()) {
      layout.inert = active;
      hero.inert = !active;
      socials.inert = progress > .25;
      if (!active && pendingFocus) {
        focusContent(pendingFocus);
        pendingFocus = null;
      }
    }
  }

  function scheduleRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function disable(preservePosition = true) {
    const wasEnabled = enabled;
    const previousY = window.scrollY;
    enabled = false;
    body.classList.remove('hero-morph-ready', 'hero-morph-active', 'hero-morph-complete', 'hero-morph-measuring');
    space.hidden = true;
    if (!loading()) { layout.inert = false; hero.inert = false; socials.inert = false; }
    if (wasEnabled && preservePosition && !printing) {
      const top = previousY >= distance ? previousY + hero.offsetHeight - distance : 0;
      window.scrollTo({ top, behavior: 'instant' });
    }
  }

  function measure(preservePosition = false) {
    if (measuring || printing) return;
    if (motion.matches) { disable(preservePosition); return; }
    const headerHeight = header.getBoundingClientRect().height;
    root.style.setProperty('--header-height', px(headerHeight));
    const available = window.innerHeight - headerHeight;
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
    distance = Math.round(available * .9);
    space.style.height = `${distance}px`;
    if (hero.scrollHeight > available + 2) {
      distance = previousDistance;
      measuring = false;
      disable(preservePosition);
      return;
    }

    // Read the actual resting layout, with sticky positioning temporarily released.
    // Document coordinates make these destinations independent of restored scroll.
    parts.forEach(part => {
      const source = part.source.getBoundingClientRect();
      const target = part.target.getBoundingClientRect();
      part.start = { left: source.left, top: source.top, width: source.width, height: source.height };
      part.end = { left: target.left, top: target.top + window.scrollY - distance, width: target.width, height: target.height };
      if (!part.photo) {
        const from = getComputedStyle(part.source);
        const to = getComputedStyle(part.target);
        for (const [key, property] of [['font', 'fontSize'], ['line', 'lineHeight'], ['spacing', 'letterSpacing']]) {
          part.start[key] = parseFloat(from[property]) || 0;
          part.end[key] = parseFloat(to[property]) || 0;
        }
      }
    });
    const portraitTarget = parts[0].end;
    parts[1].routeX = Math.max(parts[1].start.left, portraitTarget.left + portraitTarget.width + 8);
    name.style.setProperty('--dock-name-height', px(name.getBoundingClientRect().height));
    description.style.setProperty('--dock-description-height', px(description.getBoundingClientRect().height));
    body.classList.remove('hero-morph-measuring');
    enabled = true;
    measuring = false;

    if (preservePosition) {
      let top = previousY;
      if (wasEnabled && previousDistance) {
        top = previousY < previousDistance ? previousY / previousDistance * distance : previousY + distance - previousDistance;
      } else if (previousY >= previousHeroHeight) {
        top += distance - previousHeroHeight;
      }
      if (Math.abs(top - window.scrollY) > 1) window.scrollTo({ top, behavior: 'instant' });
    }
    render();
  }

  function navigateTo(target, behavior, focus = false) {
    const offset = enabled ? Math.max(0, distance - window.scrollY) : 0;
    const inset = header.getBoundingClientRect().height + 24;
    let top = target.getBoundingClientRect().top + window.scrollY + offset - inset;
    if (enabled) top = Math.max(distance, top);
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
    navigateTo(target, motion.matches ? 'instant' : 'smooth', event.detail === 0);
  });

  hero.addEventListener('keydown', event => {
    if (!enabled || event.key !== 'Tab' || event.shiftKey || document.activeElement !== hero.querySelector('.hero-scroll-cue')) return;
    event.preventDefault();
    window.scrollTo({ top: distance, behavior: 'instant' });
    render();
    layout.querySelector('.profile-mark').focus({ preventScroll: true });
  });

  document.addEventListener('keydown', event => {
    if (!enabled || loading() || event.key !== 'Tab' || window.scrollY <= 0 || window.scrollY >= distance) return;
    const wasInHero = hero.contains(document.activeElement);
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
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('beforeprint', () => { printing = true; disable(false); });
  window.addEventListener('afterprint', () => { printing = false; measure(true); });
  motion.addEventListener('change', () => measure(true));
  new MutationObserver(() => {
    if (enabled) scheduleRender();
    else if (!loading()) { hero.inert = false; layout.inert = false; }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
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
