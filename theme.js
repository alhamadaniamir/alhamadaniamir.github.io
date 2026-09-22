(() => {
  'use strict';

  const root = document.documentElement;
  const controls = [...document.querySelectorAll('[data-theme-toggle]')];
  const preferenceKey = 'portfolio-theme';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let transitionTimer;

  function applyTheme(theme, animate = false) {
    const dark = theme === 'dark';
    const nextTheme = dark ? 'dark' : 'light';
    const shouldAnimate = animate && !reducedMotion.matches && root.dataset.theme !== nextTheme;
    clearTimeout(transitionTimer);
    root.classList.toggle('theme-changing', shouldAnimate);
    root.dataset.theme = nextTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#151d19' : '#f9f8f4');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', dark ? 'dark' : 'light');
    controls.forEach(control => {
      control.setAttribute('aria-checked', String(dark));
      control.hidden = false;
    });
    if (shouldAnimate) {
      transitionTimer = setTimeout(() => root.classList.remove('theme-changing'), 300);
    }
  }

  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    clearTimeout(transitionTimer);
    root.classList.remove('theme-changing');
  });

  applyTheme(root.dataset.theme);
  controls.forEach(control => {
    control.addEventListener('click', () => {
      const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(theme, true);
      try { localStorage.setItem(preferenceKey, theme); } catch { /* The switch also works without storage. */ }
    });
  });

  // Keep other open portfolio tabs in sync with the visitor's choice.
  window.addEventListener('storage', event => {
    if (event.key === preferenceKey || event.key === null) {
      applyTheme(event.newValue === 'dark' ? 'dark' : 'light', true);
    }
  });
  window.addEventListener('pageshow', () => {
    try { applyTheme(localStorage.getItem(preferenceKey)); } catch { /* Retain this tab's theme. */ }
  });
})();
