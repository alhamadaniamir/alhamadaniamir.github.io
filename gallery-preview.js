(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.media-more').forEach(details => {
    const summary = details.querySelector(':scope > summary');
    const content = details.querySelector(':scope > .media-more-content');
    if (!summary || !content) return;

    const collapse = document.createElement('button');
    collapse.className = 'media-more-collapse';
    collapse.type = 'button';
    collapse.textContent = 'Show fewer screenshots';
    collapse.setAttribute('aria-controls', content.id);
    content.append(collapse);

    let animation = null;
    let closing = false;

    function cancelClose() {
      animation?.cancel();
      animation = null;
      closing = false;
      content.inert = false;
      collapse.disabled = false;
    }

    function finishClose() {
      if (!closing || !details.open) return;
      const parent = details.closest('.project-details');
      if (parent && !parent.open) {
        cancelClose();
        details.open = false;
        return;
      }

      const inset = (document.querySelector('.site-header')?.getBoundingClientRect().height || 0) + 20;
      const bounds = summary.getBoundingClientRect();
      const visible = bounds.top >= inset && bounds.bottom <= window.innerHeight - 20;
      const target = visible ? window.scrollY : Math.max(0, window.scrollY + bounds.top - inset);
      cancelClose();
      summary.focus({ preventScroll: true });
      details.open = false;
      // Settle the collapsed layout before paint, without scrolling through the whole project.
      window.scrollTo({ top: target, behavior: 'instant' });
    }

    function closeGallery() {
      if (!details.open || closing) return;
      closing = true;
      summary.focus({ preventScroll: true });
      content.inert = true;
      collapse.disabled = true;
      if (reducedMotion.matches || typeof content.animate !== 'function') {
        finishClose();
        return;
      }
      animation = content.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 140,
        easing: 'ease-out',
        fill: 'forwards',
      });
      animation.finished.then(finishClose, () => {});
    }

    collapse.addEventListener('click', closeGallery);
    summary.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || !details.open) return;
      event.preventDefault();
      if (closing) cancelClose();
      else closeGallery();
    });
    details.addEventListener('toggle', () => {
      if (details.open) return;
      cancelClose();
      if (content.contains(document.activeElement)) summary.focus({ preventScroll: true });
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches && closing) finishClose();
    });
    window.addEventListener('pagehide', cancelClose);
  });
})();
