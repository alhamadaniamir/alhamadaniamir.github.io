(() => {
  'use strict';

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  function initCertificateReels() {
    document.querySelectorAll('.home-page .certificate-list').forEach((group, reelIndex) => {
      const cards = [...group.querySelectorAll(':scope > .certificate-card')];
      if (cards.length < 2) return;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const label = group.closest('.archive-section, .certifications-section')?.querySelector('h2')?.textContent.trim() || 'Certificates';
      const reel = document.createElement('div');
      reel.className = 'certificate-marquee';
      reel.setAttribute('role', 'region');
      reel.setAttribute('aria-label', `${label} slideshow`);
      const viewport = document.createElement('div');
      viewport.className = 'certificate-marquee-viewport';
      viewport.id = `certificate-reel-${reelIndex + 1}`;
      viewport.tabIndex = 0;
      viewport.setAttribute('role', 'group');
      viewport.setAttribute('aria-label', 'Certificate previews. Click to pause or resume. Use the arrow keys or swipe to browse.');
      const track = document.createElement('div');
      track.className = 'certificate-marquee-track';
      group.parentNode.insertBefore(reel, group);
      group.classList.add('certificate-reel-group');
      track.append(group);
      // Repeat the sequence for a seamless wrap; only the originals are in the tab order.
      const copies = Array.from({ length: 2 }, () => {
        const copy = group.cloneNode(true);
        copy.removeAttribute('id');
        copy.classList.add('certificate-reel-copy');
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        copy.querySelectorAll('a, button, [tabindex]').forEach(element => { element.tabIndex = -1; });
        track.append(copy);
        return copy;
      });
      viewport.append(track);
      const controls = document.createElement('div');
      controls.className = 'certificate-marquee-controls';
      const note = document.createElement('p');
      note.className = 'certificate-marquee-note';
      note.textContent = `${cards.length} certificates · Click to pause`;
      const buttons = document.createElement('div');
      buttons.className = 'certificate-marquee-buttons';
      function createControl(label, content) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'certificate-marquee-button';
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-controls', viewport.id);
        button.innerHTML = content;
        buttons.append(button);
        return button;
      }
      const previous = createControl('Previous certificates', '<span aria-hidden="true">←</span>');
      const next = createControl('Next certificates', '<span aria-hidden="true">→</span>');
      controls.append(note, buttons);
      reel.append(viewport, controls);

      let frame = 0, lastTime = 0, offset = 0, loopWidth = 0, touchTimer;
      let inView = !('IntersectionObserver' in window);
      const allCards = [...track.querySelectorAll('.certificate-card')];
      let cardCenters = [];
      let focused = false, paused = false, interacting = false, printing = false, departed = false;
      function updateEmphasis() {
        const center = viewport.scrollLeft + viewport.clientWidth / 2 - 4;
        const radius = Math.max(viewport.clientWidth / 2, cards[0].offsetWidth);
        allCards.forEach((card, index) => {
          const proximity = Math.max(0, 1 - Math.abs(cardCenters[index] - center) / radius);
          // A rounded curve grows and settles gently as the card passes the center.
          const emphasis = (1 - Math.cos(Math.PI * proximity)) / 2;
          card.style.setProperty('--certificate-scale', reducedMotion.matches ? '1' : (1 + emphasis * .06).toFixed(4));
        });
      }
      function canMove() {
        return loopWidth > 0 && inView && !focused && !paused && !interacting && !printing && !departed &&
          !document.hidden && !reducedMotion.matches &&
          !document.documentElement.matches('.page-preparing, .page-loading, .welcome-active, .welcome-pending, .media-viewer-open');
      }
      function tick(time) {
        frame = 0;
        if (!canMove()) return;
        if (lastTime) offset += Math.min(time - lastTime, 80) * .036;
        lastTime = time;
        offset = ((offset % loopWidth) + loopWidth) % loopWidth;
        viewport.scrollLeft = offset;
        updateEmphasis();
        frame = requestAnimationFrame(tick);
      }
      function syncMotion() {
        note.textContent = `${cards.length} certificates · ${reducedMotion.matches ? 'Swipe or use arrows to browse' : paused ? 'Click to resume' : 'Click to pause'}`;
        copies.forEach(copy => { copy.hidden = reducedMotion.matches; });
        const moving = canMove();
        reel.dataset.moving = String(moving);
        if (moving && !frame) {
          offset = viewport.scrollLeft;
          lastTime = 0;
          frame = requestAnimationFrame(tick);
        } else if (!moving) {
          cancelAnimationFrame(frame);
          frame = 0;
          lastTime = 0;
          offset = viewport.scrollLeft;
        }
      }
      function measure() {
        const width = group.getBoundingClientRect().width;
        if (!width) return;
        const nextWidth = width + (parseFloat(getComputedStyle(track).columnGap) || 0);
        if (loopWidth && nextWidth !== loopWidth) offset = viewport.scrollLeft / loopWidth * nextWidth;
        loopWidth = nextWidth;
        cardCenters = allCards.map(card => card.offsetLeft + card.offsetWidth / 2);
        viewport.scrollLeft = offset;
        updateEmphasis();
        syncMotion();
      }
      function browse(direction) {
        paused = true;
        syncMotion();
        const step = cards[0].offsetWidth + (parseFloat(getComputedStyle(group).columnGap) || 0);
        // Normalize to the identical sequence so either arrow can keep browsing indefinitely.
        if (!reducedMotion.matches && loopWidth) {
          const position = viewport.scrollLeft % loopWidth;
          viewport.scrollLeft = direction < 0 && position < step ? position + loopWidth : position;
        }
        viewport.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      }
      function showHashTarget() {
        const target = cards.find(card => card.id && `#${card.id}` === window.location.hash);
        if (!target) return;
        const details = group.closest('details');
        if (details) details.open = true;
        paused = true;
        syncMotion();
        viewport.scrollLeft += target.getBoundingClientRect().left - viewport.getBoundingClientRect().left - 4;
      }
      previous.addEventListener('click', () => browse(-1));
      next.addEventListener('click', () => browse(1));
      viewport.addEventListener('click', event => {
        if (window.getSelection()?.toString()) return;
        clearTimeout(touchTimer);
        interacting = false;
        focused = false;
        // Preview and PDF links retain their normal action and leave the reel paused.
        paused = event.target.closest('a, button') ? true : !paused;
        syncMotion();
      });
      viewport.addEventListener('focusin', event => { focused = event.target.matches(':focus-visible'); syncMotion(); });
      viewport.addEventListener('focusout', event => { focused = viewport.contains(event.relatedTarget) && event.relatedTarget.matches(':focus-visible'); syncMotion(); });
      viewport.addEventListener('keydown', event => {
        if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          paused = !paused;
          focused = false;
          syncMotion();
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          browse(event.key === 'ArrowLeft' ? -1 : 1);
        }
      });
      function holdForInteraction() {
        clearTimeout(touchTimer);
        interacting = true;
        syncMotion();
        touchTimer = setTimeout(() => { interacting = false; syncMotion(); }, 1800);
      }
      viewport.addEventListener('pointerdown', holdForInteraction, { passive: true });
      viewport.addEventListener('pointerup', holdForInteraction, { passive: true });
      viewport.addEventListener('wheel', holdForInteraction, { passive: true });
      viewport.addEventListener('scroll', () => { if (!frame) { offset = viewport.scrollLeft; updateEmphasis(); } }, { passive: true });
      document.addEventListener('visibilitychange', syncMotion);
      reducedMotion.addEventListener('change', () => { syncMotion(); measure(); });
      window.addEventListener('hashchange', showHashTarget);
      window.addEventListener('pagehide', () => { departed = true; syncMotion(); clearTimeout(touchTimer); interacting = false; });
      window.addEventListener('pageshow', () => { departed = false; syncMotion(); });
      window.addEventListener('beforeprint', () => { printing = true; syncMotion(); });
      window.addEventListener('afterprint', () => { printing = false; measure(); });
      new MutationObserver(syncMotion).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(viewport);
        resizeObserver.observe(group);
      } else window.addEventListener('resize', measure);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncMotion(); }, { threshold: 0 }).observe(viewport);
      }
      measure();
      requestAnimationFrame(showHashTarget);
    });
  }

  initCertificateReels();

  function initToolkitCarousel() {
    const viewport = document.querySelector('.home-page .toolkit-content');
    if (!viewport) return;
    const cards = [...viewport.querySelectorAll('.toolkit-group')];
    if (cards.length < 2) return;
    const title = document.querySelector('#toolkit-title');
    const carousel = document.createElement('div');
    carousel.className = 'toolkit-carousel';
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-labelledby', title?.id || 'toolkit-title');
    viewport.parentNode.insertBefore(carousel, viewport);
    viewport.classList.add('toolkit-track');
    viewport.tabIndex = 0;
    viewport.setAttribute('aria-label', 'Technical skills cards. Swipe or use the arrow keys to browse.');
    carousel.append(viewport);
    cards.forEach((card, index) => {
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', `${index + 1} of ${cards.length}: ${card.querySelector('h3')?.textContent.trim() || 'Skills'}`);
    });
    const controls = document.createElement('div');
    controls.className = 'toolkit-controls';
    const status = document.createElement('p');
    status.className = 'toolkit-status';
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const buttons = document.createElement('div');
    buttons.className = 'toolkit-buttons';
    function button(label, arrow) {
      const control = document.createElement('button');
      control.type = 'button';
      control.className = 'toolkit-button';
      control.setAttribute('aria-label', label);
      control.innerHTML = `<span aria-hidden="true">${arrow}</span>`;
      buttons.append(control);
      return control;
    }
    const previous = button('Previous skill category', '←');
    const next = button('Next skill category', '→');
    controls.append(status, buttons);
    const heading = document.querySelector('.toolkit-section .section-heading');
    if (heading) heading.append(controls);
    else carousel.append(controls);
    let activeIndex = 0;
    let programmaticScroll = false;
    let programmaticTimer = 0;
    function update() {
      if (programmaticScroll) return;
      const left = viewport.scrollLeft + 12;
      activeIndex = cards.reduce((best, card, index) => card.offsetLeft <= left ? index : best, 0);
      status.textContent = `${activeIndex + 1} / ${cards.length}`;
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === cards.length - 1;
    }
    function browse(direction) {
      const index = Math.max(0, Math.min(cards.length - 1, activeIndex + direction));
      activeIndex = index;
      programmaticScroll = true;
      clearTimeout(programmaticTimer);
      programmaticTimer = setTimeout(() => { programmaticScroll = false; update(); }, 650);
      status.textContent = `${activeIndex + 1} / ${cards.length}`;
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === cards.length - 1;
      viewport.scrollTo({ left: cards[index].offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      viewport.focus({ preventScroll: true });
    }
    previous.addEventListener('click', () => browse(-1));
    next.addEventListener('click', () => browse(1));
    viewport.addEventListener('scroll', update, { passive: true });
    viewport.addEventListener('scrollend', () => {
      if (!programmaticScroll) return;
      clearTimeout(programmaticTimer);
      programmaticScroll = false;
      update();
    });
    for (const eventName of ['pointerdown', 'wheel', 'touchstart']) {
      viewport.addEventListener(eventName, () => {
        clearTimeout(programmaticTimer);
        programmaticScroll = false;
        update();
      }, { passive: true });
    }
    viewport.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        browse(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    update();
  }

  initToolkitCarousel();

  document.querySelectorAll('.site-menu').forEach((menu) => {
    const summary = menu.querySelector('summary');
    const panel = menu.querySelector('.menu-panel');
    if (!summary || !panel) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let closing = null;

    function cancelClose() {
      const animation = closing;
      closing = null;
      animation?.cancel();
      panel.inert = false;
    }

    function returnFocusIfHidden() {
      if (!menu.open && menu.contains(document.activeElement) && document.activeElement !== summary) {
        summary.focus({ preventScroll: true });
      }
    }

    function closeMenu(restoreFocus = false, animate = true) {
      if (!menu.open) return;
      cancelClose();
      if (restoreFocus || panel.contains(document.activeElement)) summary.focus({ preventScroll: true });
      if (!animate || reducedMotion.matches || typeof panel.animate !== 'function') {
        menu.open = false;
        return;
      }
      panel.inert = true;
      const animation = panel.animate(
        [{ opacity: getComputedStyle(panel).opacity, transform: getComputedStyle(panel).transform }, { opacity: 0, transform: 'translateY(-4px) scale(.99)' }],
        { duration: 140, easing: 'ease-out' },
      );
      closing = animation;
      animation.finished.then(() => {
        if (closing !== animation) return;
        menu.open = false;
        cancelClose();
      }, () => {});
    }

    summary.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || !menu.open) return;
      event.preventDefault();
      if (closing) cancelClose();
      else closeMenu(true);
    });

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
      // Let the browser navigate immediately and capture a clean header.
      if (event.target.closest('.menu-panel a[href]')) closeMenu(false, false);
    });

    // Native details works without JavaScript; closing it must not hide keyboard focus.
    menu.addEventListener('toggle', () => {
      if (!menu.open) cancelClose();
      returnFocusIfHidden();
    });
    window.addEventListener('pagehide', () => closeMenu(false, false));
    window.addEventListener('pageswap', () => closeMenu(false, false));
    window.addEventListener('beforeprint', () => closeMenu(false, false));
    reducedMotion.addEventListener('change', (event) => {
      if (event.matches && closing) closeMenu(true, false);
    });
  });

  function initPageTransitions() {
    const content = document.querySelector('main');
    if (!content || typeof content.animate !== 'function' ||
        window.portfolioPageTransition ||
        document.documentElement.matches('.welcome-active, .welcome-pending')) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;
    const pages = new Set(['index.html', 'about.html', 'projects.html', 'certifications.html', 'research.html', 'education.html', 'contact.html']);
    const canonicalPath = (url) => url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
    const current = new URL(window.location.href);
    const currentPath = canonicalPath(current);
    const directory = currentPath.slice(0, currentPath.lastIndexOf('/') + 1);
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation && navigation.type !== 'navigate') return;
    let previous;
    try { previous = new URL(document.referrer); } catch { return; }
    const previousPath = canonicalPath(previous);
    if (previous.origin !== current.origin || previous.protocol !== current.protocol ||
        previousPath === currentPath || previousPath.slice(0, previousPath.lastIndexOf('/') + 1) !== directory ||
        !pages.has(previousPath.slice(previousPath.lastIndexOf('/') + 1))) return;

    let entered = false;
    let entranceAnimation = null;
    let nativeTransition = null;
    const readinessObserver = new MutationObserver(enterPage);

    // Native page transitions retain the previous page until the next one is ready.
    // The normal arrival animation remains the fallback for unsupported browsers.
    window.addEventListener('pagereveal', (event) => {
      if (!event.viewTransition || event.viewTransition !== window.portfolioPageTransition) return;
      nativeTransition = event.viewTransition;
      entranceAnimation?.cancel();
      entranceAnimation = null;
      entered = true;
      readinessObserver.disconnect();
      nativeTransition.finished.catch(() => {});
    });

    function stopEntrance() {
      entered = true;
      readinessObserver.disconnect();
      entranceAnimation?.cancel();
      entranceAnimation = null;
      nativeTransition?.skipTransition();
      nativeTransition = null;
    }

    function enterPage() {
      if (entered) return;
      if (reducedMotion.matches || document.hidden || content.contains(document.activeElement) ||
          document.documentElement.matches('.welcome-active, .welcome-pending')) {
        stopEntrance();
        return;
      }
      if (document.readyState === 'loading' ||
          document.querySelector('#site-styles')?.media !== 'all' ||
          document.documentElement.matches('.page-preparing, .page-loading')) return;

      entered = true;
      readinessObserver.disconnect();
      try {
        const animation = content.animate(
          [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 580, easing: 'cubic-bezier(.22, 1, .36, 1)' },
        );
        animation.id = 'page-enter';
        entranceAnimation = animation;
        const cleanup = () => { if (entranceAnimation === animation) entranceAnimation = null; };
        animation.finished.then(cleanup, cleanup);
      } catch { /* Navigation stays readable if animation is unavailable. */ }
    }

    // Links navigate immediately. Start the small arrival reveal as soon as content
    // is readable, rather than waiting for images to finish loading and fading again.
    readinessObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('DOMContentLoaded', enterPage, { once: true });
    document.addEventListener('error', (event) => {
      if (event.target.id === 'site-styles') stopEntrance();
    }, true);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted || document.querySelector('#site-styles')?.media !== 'all') stopEntrance();
      else enterPage();
    });
    window.addEventListener('pagehide', stopEntrance);
    window.addEventListener('beforeprint', stopEntrance);
    reducedMotion.addEventListener('change', (event) => {
      if (event.matches) stopEntrance();
    });
    content.addEventListener('focusin', stopEntrance);
    enterPage();
  }
  initPageTransitions();

  document.querySelectorAll('.project-details').forEach((details, index) => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.details-content');
    if (!summary || !content) return;

    // Featured projects keep their supporting explanation visible on the homepage.
    // The archive pages retain the expandable disclosure for focused browsing.
    if (document.body.classList.contains('home-page')) {
      details.open = true;
      details.classList.add('project-details--always-visible');
      return;
    }

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

    let closing = false;
    let closeAnimation = null;
    let returnAnimation = null;
    let closeRequest = 0;
    let contentWasInert = content.inert;

    function cancelClose() {
      closeRequest += 1;
      closeAnimation?.cancel();
      closeAnimation = null;
      if (closing) content.inert = contentWasInert;
      closing = false;
      button.disabled = false;
    }

    function finishClose(request, reducedMotion) {
      if (!closing || request !== closeRequest || !details.open) return;

      // Keep a visible summary in place. From deep in a gallery, return to it directly
      // instead of smoothly scrolling through several screens of unrelated content.
      const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
      const topInset = headerHeight + 20;
      const position = summary.getBoundingClientRect();
      const summaryVisible = position.top >= topInset && position.bottom <= window.innerHeight - 20;
      const targetScroll = summaryVisible ? window.scrollY : Math.max(0, window.scrollY + position.top - topInset);

      cancelClose();
      summary.focus({ preventScroll: true });
      details.open = false;
      // This synchronous scroll flushes the collapsed layout before the next paint,
      // preventing a frame at the browser's temporary scroll-anchor position.
      window.scrollTo({ top: targetScroll, behavior: 'instant' });

      if (!summaryVisible && !reducedMotion && typeof summary.animate === 'function') {
        returnAnimation?.cancel();
        returnAnimation = summary.animate(
          [{ opacity: 0.45 }, { opacity: 1 }],
          { duration: 160, easing: 'ease-out' },
        );
      }
    }

    function closeProject() {
      if (!details.open || closing) return;
      pauseMedia();
      returnAnimation?.cancel();
      summary.focus({ preventScroll: true });
      closing = true;
      const request = ++closeRequest;
      contentWasInert = content.inert;
      content.inert = true;
      button.disabled = true;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion || typeof content.animate !== 'function') {
        finishClose(request, reducedMotion);
        return;
      }

      // Fade only; animating the height of a long gallery would pull the page around.
      closeAnimation = content.animate(
        [{ opacity: getComputedStyle(content).opacity }, { opacity: 0 }],
        { duration: 120, easing: 'ease-in', fill: 'forwards' },
      );
      closeAnimation.finished.then(
        () => finishClose(request, reducedMotion),
        () => {}, // A second summary activation or external close cancels the fade.
      );
    }

    button.addEventListener('click', closeProject);
    summary.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      returnAnimation?.cancel();
      if (!details.open) return;
      event.preventDefault();
      if (closing) cancelClose();
      else closeProject();
    });

    // Programmatic closures still clean up media, pending animation, and hidden focus.
    details.addEventListener('toggle', () => {
      if (details.open) return;
      cancelClose();
      pauseMedia();
      if (content.contains(document.activeElement)) summary.focus({ preventScroll: true });
    });
  });

  // Let homepage visitors see project videos in context without an extra click.
  // Muted autoplay is allowed by browsers; controls remain available for sound.
  if (document.body.classList.contains('home-page')) {
    const projectVideos = [...document.querySelectorAll('.project-video')];
    projectVideos.forEach((video) => {
      video.muted = true;
      video.setAttribute('muted', '');
      video.autoplay = true;
    });

    const playWhenVisible = (video) => {
      if (document.hidden || document.querySelector('.media-viewer[open]')) return;
      if (video.paused) video.play().catch(() => {});
    };
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) playWhenVisible(entry.target);
          else entry.target.pause();
        });
      }, { threshold: [0, 0.3] });
      projectVideos.forEach((video) => videoObserver.observe(video));
    } else {
      projectVideos.forEach(playWhenVisible);
    }
  }

  function initScrollReveals() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches ||
        !('IntersectionObserver' in window) || typeof Element.prototype.animate !== 'function') return;

    const groups = new Map();
    const activeAnimations = new Set();

    function register(elements, options = {}) {
      const items = [...elements];
      // Keep the initial viewport and restored scroll position immediately readable.
      if (!items.length || items[0].getBoundingClientRect().top < window.innerHeight) return;
      groups.set(items[0], { items, distance: 8, duration: 800, ...options });
    }

    const isHome = document.body.classList.contains('home-page');
    if (isHome) {
      document.querySelectorAll('.home-page main > .section').forEach((section) => {
        if (section.matches('.about-section, .approach-section, .contact-section')) {
          register(section.children);
        } else {
          register(section.querySelectorAll(':scope > .section-heading, :scope > .section-intro'));
        }
      });
      document.querySelectorAll('.home-page .interest').forEach((item) => register([item]));
      document.querySelectorAll('.home-page .toolkit-group, .home-page .education-item').forEach((item) => register([item]));
      document.querySelectorAll('.home-page .project').forEach((project) => {
        register(project.querySelectorAll(':scope > .project-topline, :scope > h3, :scope > p'));
      });
    } else {
      document.querySelectorAll('.archive-intro > *').forEach((item) => register([item]));
      document.querySelectorAll('.archive-section > h2, .archive-section > p, .archive-section > .prose > p, .archive-section > .personal-interests > .personal-interest, .archive-section .education-item, .archive-section .certificate-card, .archive-section > .text-link, .archive-section > .social-links').forEach((item) => register([item]));
      document.querySelectorAll('.archive-projects .project').forEach((project) => {
        project.querySelectorAll(':scope > .project-topline, :scope > .project-title, :scope > .project-subtitle, :scope > p, :scope > .project-bottom').forEach((item) => register([item]));
      });
    }
    document.querySelectorAll('.project-details > summary, .course-domains > summary, .media-more > summary').forEach((item) => register([item], { distance: 5, duration: 720 }));
    document.querySelectorAll('.media-item').forEach((item) => register([item], { distance: 6, duration: 760 }));

    const observer = new IntersectionObserver((entries) => {
      const sectionStaggers = new Map();
      entries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).forEach((entry) => {
        if (!entry.isIntersecting) return;
        const group = groups.get(entry.target);
        observer.unobserve(entry.target);
        groups.delete(entry.target);
        if (!group || reducedMotion.matches || document.hidden ||
            group.items.some((item) => item.contains(document.activeElement))) return;

        const section = entry.target.closest('.section');
        const stagger = sectionStaggers.get(section) || 0;
        sectionStaggers.set(section, stagger + 1);
        group.items.forEach((item, index) => {
          // Give headings a small lead over copy and cards, without a long cascade.
          const delay = Math.min(stagger + index, 3) * 90;
          const isHeading = item.matches('h1, h2, h3, .section-heading');
          const nestedHeading = isHeading ? null : item.querySelector('h1, h2, h3');
          const targets = [{ element: item, heading: isHeading }];
          if (nestedHeading) targets.push({ element: nestedHeading, heading: true });
          targets.forEach(({ element, heading }) => {
            const distance = heading ? Math.max(group.distance, 12) : group.distance;
            const frames = heading
              ? [{ opacity: 0, transform: `translateY(${distance}px)`, filter: 'blur(2.5px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }]
              : [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'translateY(0)' }];
            // Titles rise and sharpen into focus; supporting copy keeps its quieter fade.
            const animation = element.animate(frames, {
              duration: heading ? Math.max(group.duration, 900) : group.duration,
              delay,
              easing: 'cubic-bezier(.22, 1, .36, 1)',
              fill: 'backwards',
            });
            animation.id = 'scroll-reveal';
            activeAnimations.add(animation);
            const cleanup = () => activeAnimations.delete(animation);
            animation.finished.then(cleanup, cleanup);
          });
        });
      });
    }, { threshold: 0, rootMargin: '0px 0px 24px 0px' });
    groups.forEach((_, target) => observer.observe(target));

    function stopReveals() {
      observer.disconnect();
      groups.clear();
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
    }
    reducedMotion.addEventListener('change', (event) => { if (event.matches) stopReveals(); });
    window.addEventListener('beforeprint', stopReveals);
    window.addEventListener('pagehide', stopReveals);
    document.addEventListener('focusin', (event) => {
      groups.forEach((group, target) => {
        if (group.items.some((item) => item.contains(event.target))) {
          observer.unobserve(target);
          groups.delete(target);
        }
      });
      activeAnimations.forEach((animation) => {
        if (animation.effect.target.contains(event.target)) animation.cancel();
      });
    });
  }
  function prepareScrollReveals() {
    const styles = document.querySelector('#site-styles');
    const readinessObserver = new MutationObserver(startWhenReady);
    let started = false;

    function stopWaiting() {
      started = true;
      readinessObserver.disconnect();
    }

    function startWhenReady() {
      if (started || document.readyState === 'loading' || (styles && styles.media !== 'all') ||
          document.documentElement.matches('.page-preparing, .page-loading, .welcome-active, .welcome-pending')) return;
      stopWaiting();
      initScrollReveals();
    }

    // Measure the styled layout after the welcome, without waiting for media downloads.
    readinessObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    if (styles) {
      readinessObserver.observe(styles, { attributes: true, attributeFilter: ['media'] });
      styles.addEventListener('error', stopWaiting, { once: true });
    }
    document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
    window.addEventListener('pagehide', stopWaiting, { once: true });
    window.addEventListener('beforeprint', stopWaiting, { once: true });
    startWhenReady();
  }
  prepareScrollReveals();

  // Archive navigation points back to index.html and does not participate in scrollspy.
  const links = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);
  const header = document.querySelector('.site-header');
  let framePending = false;
  let anchorLock = null;
  let unlockTimer;

  // Bookmarks wrap onto a second row on narrow or zoomed-in screens.
  // Use the actual header height so section links still land below it.
  function measureHeader() {
    if (!header) return;
    document.documentElement.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    scheduleNavigation();
  }
  if (header && 'ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);
  else window.addEventListener('resize', measureHeader, { passive: true });
  window.addEventListener('load', measureHeader);
  measureHeader();

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
