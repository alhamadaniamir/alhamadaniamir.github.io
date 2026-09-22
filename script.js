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
    if (!document.body.classList.contains('home-page') || reducedMotion.matches ||
        !('IntersectionObserver' in window) || typeof Element.prototype.animate !== 'function') return;

    const groups = new Map();
    const activeAnimations = new Set();

    function register(elements, options = {}) {
      const items = [...elements];
      // Keep the initial viewport and restored scroll position immediately readable.
      if (!items.length || items[0].getBoundingClientRect().top < window.innerHeight) return;
      groups.set(items[0], { items, distance: 10, duration: 420, ...options });
    }

    document.querySelectorAll('.home-page main > .section').forEach((section) => {
      if (section.matches('.about-section, .approach-section, .contact-section')) {
        register([section]);
      } else {
        register(section.querySelectorAll(':scope > .section-heading, :scope > .section-intro'));
      }
    });
    document.querySelectorAll('.home-page .interest').forEach((item) => register([item], { stagger: true }));
    document.querySelectorAll('.home-page .toolkit-group, .home-page .education-item').forEach((item) => register([item]));
    document.querySelectorAll('.home-page .project').forEach((project) => {
      register(project.querySelectorAll(':scope > .project-topline, :scope > h3, :scope > p'));
    });
    document.querySelectorAll('.home-page .media-item').forEach((item) => register([item], { distance: 6, duration: 340 }));
    document.querySelectorAll('.home-page .certificate-card').forEach((item) => register([item], { distance: 0, duration: 320 }));

    const observer = new IntersectionObserver((entries) => {
      let stagger = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const group = groups.get(entry.target);
        observer.unobserve(entry.target);
        groups.delete(entry.target);
        if (!group || reducedMotion.matches || document.hidden ||
            group.items.some((item) => item.contains(document.activeElement))) return;

        const delay = group.stagger ? Math.min(stagger++, 2) * 55 : 0;
        group.items.forEach((item) => {
          // Animate on entry only: content is never hidden awaiting JavaScript.
          const animation = item.animate(
            [{ opacity: 0, transform: `translateY(${group.distance}px)` }, { opacity: 1, transform: 'translateY(0)' }],
            { duration: group.duration, delay, easing: 'cubic-bezier(.2, .65, .3, 1)', fill: 'backwards' },
          );
          animation.id = 'scroll-reveal';
          activeAnimations.add(animation);
          const cleanup = () => activeAnimations.delete(animation);
          animation.finished.then(cleanup, cleanup);
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
  // Wait for the stylesheet and initial layout before identifying offscreen groups.
  if (document.readyState === 'complete') initScrollReveals();
  else window.addEventListener('load', initScrollReveals, { once: true });

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
