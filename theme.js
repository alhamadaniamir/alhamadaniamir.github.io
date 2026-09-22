(() => {
  'use strict';

  const root = document.documentElement;
  const controls = [...document.querySelectorAll('[data-theme-toggle]')];
  const preferenceKey = 'portfolio-theme';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let transitionTimer;
  let desiredTheme = root.dataset.theme === 'dark' ? 'dark' : 'light';
  let themeRequest = 0;
  let activeTransition = null;
  let activeReveal = null;

  function renderTheme(theme) {
    const dark = theme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#151d19' : '#f9f8f4');
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', dark ? 'dark' : 'light');
    controls.forEach(control => {
      control.setAttribute('aria-checked', String(dark));
      control.hidden = false;
    });
  }

  function stopThemeMotion() {
    clearTimeout(transitionTimer);
    activeReveal?.cancel();
    activeReveal = null;
    activeTransition?.skipTransition();
    activeTransition = null;
    root.classList.remove('theme-changing', 'theme-reveal');
  }

  function fadeTheme(theme) {
    root.classList.add('theme-changing');
    renderTheme(theme);
    transitionTimer = setTimeout(() => root.classList.remove('theme-changing'), 550);
  }

  async function revealTheme(theme, origin, request) {
    let transition;
    try {
      root.classList.add('theme-reveal');
      transition = document.startViewTransition(() => {
        // Skipping a snapshot does not cancel its update callback.
        if (request === themeRequest) renderTheme(theme);
      });
      activeTransition = transition;
      // A skipped snapshot rejects ready; all promises must remain handled.
      transition.finished.catch(() => {});
      transition.updateCallbackDone.catch(() => {});
      await transition.ready;
      if (request !== themeRequest || reducedMotion.matches) return;

      const radius = Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y),
      );
      const reveal = root.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 600, easing: 'cubic-bezier(.22, .68, .2, 1)', pseudoElement: '::view-transition-new(root)' },
      );
      reveal.id = 'theme-reveal';
      activeReveal = reveal;
      await reveal.finished;
      await transition.finished;
    } catch {
      if (request === themeRequest) {
        transition?.skipTransition();
        root.classList.remove('theme-reveal');
        if (reducedMotion.matches || root.dataset.theme === theme) renderTheme(theme);
        else fadeTheme(theme);
      }
    } finally {
      if (request === themeRequest) {
        activeReveal = null;
        activeTransition = null;
        root.classList.remove('theme-reveal');
      }
    }
  }

  function applyTheme(theme, animate = false, control = null) {
    desiredTheme = theme === 'dark' ? 'dark' : 'light';
    const request = ++themeRequest;
    stopThemeMotion();
    if (!animate || reducedMotion.matches || root.dataset.theme === desiredTheme) {
      renderTheme(desiredTheme);
      return;
    }

    if (control && typeof document.startViewTransition === 'function' && typeof root.animate === 'function') {
      const rect = control.getBoundingClientRect();
      const origin = {
        x: Math.max(0, Math.min(window.innerWidth, rect.left + rect.width / 2)),
        y: Math.max(0, Math.min(window.innerHeight, rect.top + rect.height / 2)),
      };
      void revealTheme(desiredTheme, origin, request);
    } else {
      fadeTheme(desiredTheme);
    }
  }

  reducedMotion.addEventListener('change', event => {
    if (event.matches) applyTheme(desiredTheme);
  });

  applyTheme(root.dataset.theme);
  controls.forEach(control => {
    control.addEventListener('click', () => {
      // Track the requested state, even while a snapshot is still being prepared.
      const theme = desiredTheme === 'dark' ? 'light' : 'dark';
      applyTheme(theme, true, control);
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
