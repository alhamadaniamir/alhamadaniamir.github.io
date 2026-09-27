(() => {
  'use strict';

  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  const links = [...document.querySelectorAll('.media-image-link, a.certificate-preview')]
    .filter(link => link.querySelector('img'));
  if (!links.length) return;

  const root = document.documentElement;
  const groupSelector = '.project-media, .certificate-list, .archive-certificates';
  let dialog, viewport, image, title, description, status, previous, next, zoom, original;
  let gallery = [];
  let currentIndex = 0;
  let trigger = null;
  let request = 0;
  let imageReady = false;
  let zoomed = false;
  let scrollPosition = { x: 0, y: 0 };
  let pausedVideos = [];
  let drag = null;
  let dragged = false;
  let backdropPointer = false;
  let zoomLayout = null;
  let resizeFrame = 0;

  function labelControl(control, label) {
    control.setAttribute('aria-label', label);
    control.title = label;
  }

  function captionFor(link) {
    const caption = link.closest('figure')?.querySelector('figcaption')?.cloneNode(true);
    caption?.querySelector('.media-type')?.remove();
    return caption?.textContent.trim() || link.querySelector('img').alt;
  }

  function metadata(link) {
    const thumbnail = link.querySelector('img');
    const certificate = link.closest('.certificate-card');
    return {
      source: certificate ? thumbnail.currentSrc || thumbnail.src : link.href,
      original: link.href,
      alt: thumbnail.alt,
      title: (certificate || link.closest('.project'))?.querySelector('h3, h2')?.textContent.trim() || 'Project image',
      caption: certificate
        ? [...certificate.querySelectorAll('.certificate-issuer, .certificate-date')].map(item => item.textContent.trim()).filter(Boolean).join(' · ')
        : captionFor(link),
      certificate: !!certificate,
    };
  }

  function updateStatus(message = '') {
    status.textContent = `${currentIndex + 1} of ${gallery.length}${message ? ` · ${message}` : ''}`;
  }

  function updateCaptionFocus() {
    if (description.scrollHeight > description.clientHeight + 1) description.tabIndex = 0;
    else description.removeAttribute('tabindex');
  }

  function resetZoom() {
    zoomed = false;
    zoomLayout = null;
    drag = null;
    dialog.classList.remove('is-zoomed', 'is-dragging');
    zoom.setAttribute('aria-pressed', 'false');
    labelControl(zoom, 'Zoom in');
    zoom.dataset.mode = 'zoom';
    image?.removeAttribute('style');
    viewport.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    viewport.setAttribute('aria-label', 'Image preview');
  }

  function sizeZoomedImage(preservePosition = false) {
    if (!imageReady || !zoomed || !viewport.clientWidth || !viewport.clientHeight) return;
    // Keep the same part of an image in view when browser zoom or layout changes.
    const focus = preservePosition && zoomLayout ? {
      x: (viewport.scrollLeft + zoomLayout.viewportWidth / 2 - zoomLayout.left) / zoomLayout.width,
      y: (viewport.scrollTop + zoomLayout.viewportHeight / 2 - zoomLayout.top) / zoomLayout.height,
    } : { x: 0.5, y: 0.5 };
    const fit = Math.min(viewport.clientWidth / image.naturalWidth, viewport.clientHeight / image.naturalHeight);
    const width = image.naturalWidth * fit * 2;
    const height = image.naturalHeight * fit * 2;
    const left = Math.max(0, (viewport.clientWidth - width) / 2);
    const top = Math.max(0, (viewport.clientHeight - height) / 2);
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    image.style.marginLeft = `${left}px`;
    image.style.marginTop = `${top}px`;
    zoomLayout = { width, height, left, top, viewportWidth: viewport.clientWidth, viewportHeight: viewport.clientHeight };
    viewport.scrollTo({
      left: Math.max(0, Math.min(width + left - viewport.clientWidth, focus.x * width + left - viewport.clientWidth / 2)),
      top: Math.max(0, Math.min(height + top - viewport.clientHeight, focus.y * height + top - viewport.clientHeight / 2)),
      behavior: 'instant',
    });
  }

  function toggleZoom() {
    if (!imageReady) return;
    if (zoomed) {
      resetZoom();
      updateStatus();
      return;
    }
    zoomed = true;
    dialog.classList.add('is-zoomed');
    zoom.setAttribute('aria-pressed', 'true');
    labelControl(zoom, 'Fit image');
    zoom.dataset.mode = 'fit';
    viewport.setAttribute('aria-label', 'Image zoomed to 200%. Scroll or drag to inspect. Use Fit image to reset.');
    sizeZoomedImage();
    updateStatus();
  }

  function showImage(index) {
    currentIndex = Math.max(0, Math.min(index, gallery.length - 1));
    const item = metadata(gallery[currentIndex]);
    const imageRequest = ++request;
    const focusedControl = document.activeElement;
    resetZoom();
    imageReady = false;
    zoom.disabled = true;
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === gallery.length - 1;
    // Keep focus in the viewer when a control becomes temporarily unavailable.
    if (focusedControl === zoom || (focusedControl === previous && previous.disabled) || (focusedControl === next && next.disabled)) {
      viewport.focus({ preventScroll: true });
    }
    title.textContent = item.title;
    description.textContent = item.caption;
    description.title = item.caption;
    original.href = item.original;
    labelControl(original, /\.pdf(?:[?#]|$)/i.test(item.original) ? 'Open PDF in a new tab' : 'Open original in a new tab');
    updateStatus('Loading image…');
    viewport.replaceChildren();
    viewport.setAttribute('aria-busy', 'true');
    dialog.classList.add('is-loading');
    updateCaptionFocus();

    // Each request owns its image, so a late download cannot replace a newer selection.
    const incoming = new Image();
    incoming.className = 'media-viewer-image';
    incoming.alt = item.alt;
    incoming.draggable = false;
    incoming.decoding = 'async';
    incoming.onload = () => {
      if (!dialog.open || imageRequest !== request) return;
      image = incoming;
      viewport.replaceChildren(image);
      viewport.removeAttribute('aria-busy');
      dialog.classList.remove('is-loading');
      imageReady = true;
      zoom.disabled = false;
      updateStatus();
    };
    incoming.onerror = () => {
      if (!dialog.open || imageRequest !== request) return;
      const message = document.createElement('p');
      message.className = 'media-viewer-message';
      message.textContent = 'This preview couldn’t load. Use the open-original icon above to view the file.';
      viewport.replaceChildren(message);
      viewport.removeAttribute('aria-busy');
      dialog.classList.remove('is-loading');
      updateStatus('Preview unavailable');
    };
    incoming.src = item.source;
  }

  function releaseViewer(restoreFocus = true) {
    if (!trigger) return;
    request += 1;
    cancelAnimationFrame(resizeFrame);
    resetZoom();
    viewport.replaceChildren();
    image = null;
    imageReady = false;
    root.classList.remove('media-viewer-open');
    const source = trigger;
    trigger = null;
    gallery = [];
    if (restoreFocus) {
      window.scrollTo({ left: scrollPosition.x, top: scrollPosition.y, behavior: 'instant' });
      if (source.isConnected) source.focus({ preventScroll: true });
      if (!document.hidden) pausedVideos.forEach(video => {
        const bounds = video.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0));
        const details = video.closest('details');
        if (bounds.height > 0 && visibleHeight / bounds.height >= 0.3 && (!details || details.open)) video.play().catch(() => {});
      });
    }
    pausedVideos = [];
  }

  function closeViewer(restoreFocus = true) {
    if (!dialog?.open) return;
    dialog.close();
    releaseViewer(restoreFocus);
  }

  function buildViewer() {
    dialog = document.createElement('dialog');
    dialog.className = 'media-viewer';
    dialog.setAttribute('aria-labelledby', 'media-viewer-title');
    dialog.setAttribute('aria-describedby', 'media-viewer-description');
    dialog.innerHTML = `
      <div class="media-viewer-shell">
        <header class="media-viewer-header">
          <h2 id="media-viewer-title" class="visually-hidden"></h2>
          <div class="media-viewer-tools">
            <button class="media-viewer-zoom" type="button" aria-label="Zoom in" title="Zoom in" aria-pressed="false" data-mode="zoom">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5M7.5 10.5h6"/><path class="media-viewer-zoom-plus" d="M10.5 7.5v6"/></svg>
            </button>
            <a class="media-viewer-original" target="_blank" rel="noopener noreferrer" aria-label="Open original in a new tab" title="Open original in a new tab">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 4h6v6M20 4l-9 9M10 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-5"/></svg>
            </a>
            <button class="media-viewer-close" type="button" aria-label="Close image viewer" title="Close image viewer" autofocus>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>
            </button>
          </div>
        </header>
        <div class="media-viewer-stage">
          <button class="media-viewer-prev" type="button" aria-label="Previous image" title="Previous image"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m14 6-6 6 6 6"/></svg></button>
          <div class="media-viewer-viewport" tabindex="0" role="group" aria-label="Image preview"></div>
          <button class="media-viewer-next" type="button" aria-label="Next image" title="Next image"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m10 6 6 6-6 6"/></svg></button>
        </div>
        <footer class="media-viewer-footer">
          <div class="media-viewer-caption"><p id="media-viewer-description" class="media-viewer-description"></p><p class="media-viewer-status" role="status" aria-live="polite" aria-atomic="true"></p></div>
        </footer>
      </div>`;
    document.body.append(dialog);
    const find = name => dialog.querySelector(`.media-viewer-${name}`);
    viewport = find('viewport');
    title = dialog.querySelector('#media-viewer-title');
    description = find('description');
    status = find('status');
    previous = find('prev');
    next = find('next');
    zoom = find('zoom');
    original = find('original');
    find('close').addEventListener('click', () => closeViewer());
    previous.addEventListener('click', () => showImage(currentIndex - 1));
    next.addEventListener('click', () => showImage(currentIndex + 1));
    zoom.addEventListener('click', toggleZoom);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
    dialog.addEventListener('close', () => { if (!dialog.open) releaseViewer(); });
    dialog.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      // Arrow keys pan a focused zoomed image; elsewhere they browse the gallery.
      if (zoomed && document.activeElement === viewport) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const index = currentIndex + (event.key === 'ArrowRight' ? 1 : -1);
        if (index >= 0 && index < gallery.length) showImage(index);
      }
    });
    dialog.addEventListener('pointerdown', event => { backdropPointer = event.target === dialog; });
    dialog.addEventListener('click', event => {
      if (event.target === dialog && backdropPointer) closeViewer();
      backdropPointer = false;
    });
    viewport.addEventListener('click', event => {
      if (event.target === image && !zoomed && !dragged) toggleZoom();
    });
    viewport.addEventListener('pointerdown', event => {
      dragged = false;
      if (!zoomed || event.pointerType !== 'mouse' || event.button !== 0) return;
      event.preventDefault();
      drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      viewport.setPointerCapture(event.pointerId);
      dialog.classList.add('is-dragging');
    });
    viewport.addEventListener('pointermove', event => {
      if (!drag) return;
      const x = event.clientX - drag.x;
      const y = event.clientY - drag.y;
      if (Math.abs(x) + Math.abs(y) > 3) dragged = true;
      viewport.scrollLeft = drag.left - x;
      viewport.scrollTop = drag.top - y;
    });
    const endDrag = () => { drag = null; dialog.classList.remove('is-dragging'); };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
    if ('ResizeObserver' in window) new ResizeObserver(scheduleResize).observe(viewport);
  }

  links.forEach(link => {
    const item = metadata(link);
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-label', `${item.certificate ? 'Preview certificate' : 'View image'}: ${item.certificate ? item.title : item.alt}`);
    const badge = link.querySelector('.media-open');
    if (badge) badge.textContent = 'View image';
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
          document.querySelector('#site-styles')?.media !== 'all') return;
      if (!dialog) buildViewer();
      if (dialog.open) return;
      const container = link.closest(groupSelector);
      gallery = container ? links.filter(candidate => candidate.closest(groupSelector) === container) : [link];
      trigger = link;
      scrollPosition = { x: window.scrollX, y: window.scrollY };
      try { dialog.showModal(); } catch { trigger = null; gallery = []; return; }
      event.preventDefault();
      root.classList.add('media-viewer-open');
      pausedVideos = [...document.querySelectorAll('video')].filter(video => !video.paused);
      pausedVideos.forEach(video => video.pause());
      showImage(gallery.indexOf(link));
    });
  });

  function scheduleResize() {
    if (!dialog?.open) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!dialog.open) return;
      if (zoomed) sizeZoomedImage(true);
      updateCaptionFocus();
    });
  }
  window.addEventListener('resize', scheduleResize);
  window.addEventListener('pagehide', () => closeViewer(false));
  window.addEventListener('beforeprint', () => closeViewer(false));
})();
