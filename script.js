(() => {
  'use strict';

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  document.querySelectorAll('.site-menu').forEach((menu) => {
    const summary = menu.querySelector('summary');
    if (!summary) return;

    function returnFocusIfHidden() {
      if (!menu.open && menu.contains(document.activeElement) && document.activeElement !== summary) {
        summary.focus({ preventScroll: true });
      }
    }

    function closeMenu(restoreFocus = false) {
      if (!menu.open) return;
      menu.open = false;
      if (restoreFocus) summary.focus({ preventScroll: true });
      else returnFocusIfHidden();
    }

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !menu.open) return;
      event.preventDefault();
      closeMenu(true);
    });

    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target)) closeMenu();
    });

    menu.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.target.closest('.menu-panel a[href]')) closeMenu();
    });

    // Native details works without JavaScript; closing it must not hide keyboard focus.
    menu.addEventListener('toggle', returnFocusIfHidden);
  });

  document.querySelectorAll('.project-details').forEach((details, index) => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.details-content');
    if (!summary || !content) return;

    const project = details.closest('.project');
    const title = project?.querySelector('h2, h3')?.textContent.trim() || 'project';
    if (!content.id) content.id = `project-content-${project?.id || index + 1}`;

    const bar = document.createElement('div');
    bar.className = 'project-collapse-bar';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'project-collapse-button';
    button.setAttribute('aria-label', `Collapse ${title}`);
    button.setAttribute('aria-controls', content.id);
    button.append('Collapse project ');
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↑';
    button.append(arrow);
    bar.append(button);
    content.append(bar);

    function pauseMedia() {
      details.querySelectorAll('video').forEach((video) => video.pause());
    }

    button.addEventListener('click', () => {
      pauseMedia();
      summary.focus({ preventScroll: true });
      details.open = false;

      // Measure after the gallery has collapsed, including any browser scroll anchoring.
      window.requestAnimationFrame(() => {
        const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
        const topInset = headerHeight + 20;
        const position = summary.getBoundingClientRect();
        if (position.top >= topInset && position.bottom <= window.innerHeight - 20) return;
        window.scrollTo({
          top: Math.max(0, window.scrollY + position.top - topInset),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
      });
    });

    // Also pause media when a project is closed through its native summary.
    details.addEventListener('toggle', () => {
      if (details.open) return;
      pauseMedia();
      if (content.contains(document.activeElement)) summary.focus({ preventScroll: true });
    });
  });

  // Archive navigation points back to index.html and does not participate in scrollspy.
  const links = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);
  const header = document.querySelector('.site-header');
  let framePending = false;
  let anchorLock = null;
  let unlockTimer;

  function setActive(id) {
    links.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function updateNavigation() {
    framePending = false;
    if (!sections.length) return;
    if (anchorLock) {
      setActive(anchorLock);
      return;
    }

    // Section starts stay meaningful even when a section is taller than the viewport.
    const readingLine = (header ? header.getBoundingClientRect().height : 0) + 48;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine) active = section;
    }

    const pageHeight = document.documentElement.scrollHeight;
    if (pageHeight > window.innerHeight && window.scrollY + window.innerHeight >= pageHeight - 4) {
      active = sections[sections.length - 1];
    }
    setActive(active.id);
  }

  function scheduleNavigation() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateNavigation);
  }

  function releaseAnchorLock() {
    anchorLock = null;
    window.clearTimeout(unlockTimer);
    scheduleNavigation();
  }

  function activateAnchor(id) {
    if (!sections.some((section) => section.id === id)) return;
    anchorLock = id;
    setActive(id);
    window.clearTimeout(unlockTimer);
    // Keep the chosen link active while the browser completes native smooth scrolling.
    unlockTimer = window.setTimeout(releaseAnchorLock, 1200);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      activateAnchor(link.hash.slice(1));
    });
  });

  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleNavigation, { passive: true });
  window.addEventListener('load', scheduleNavigation);
  window.addEventListener('hashchange', () => {
    activateAnchor(window.location.hash.slice(1));
    scheduleNavigation();
  });
  window.addEventListener('wheel', releaseAnchorLock, { passive: true });
  window.addEventListener('touchstart', releaseAnchorLock, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) releaseAnchorLock();
  });
  // Opening native details changes section positions without necessarily scrolling.
  document.querySelectorAll('details').forEach((details) => {
    details.addEventListener('toggle', scheduleNavigation);
  });
  activateAnchor(window.location.hash.slice(1));
  scheduleNavigation();

  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('.copy-status');
  if (copyButton && copyStatus && window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      copyButton.disabled = true;
      copyStatus.textContent = '';
      try {
        await navigator.clipboard.writeText('alhamadani.amirrara@gmail.com');
        copyStatus.textContent = 'Email address copied.';
      } catch {
        copyStatus.textContent = 'Couldn’t copy. You can select the address or use the email link.';
      } finally {
        copyButton.disabled = false;
      }
    });
  }
})();
