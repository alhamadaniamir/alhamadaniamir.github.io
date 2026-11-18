(() => {
  'use strict';

  // Interleave subjects so even a small screen opens with a mix of equations.
  const formulas = [
    'ω = 2πf', 'ŷ = wᵀx + b', 'S = QKᵀ/√dₖ', 'V = IR',
    'y[n] = (x ∗ h)[n]', 'w ← w − η∇L', 'a = ReLU(z)', 'τ = r × F',
    'x[n] = x(nTₛ)', 'r = y − ŷ', 'p = softmax(z)', 'Δx ≈ J Δθ',
    'X(ω) = ℱ{x(t)}', 'MSE = mean(r²)', 'Z = AV', 'P = IV',
    'fₛ = 1/Tₛ', 'H(p) = −Σ pᵢ ln pᵢ', 'h = tanh(z)', 'v = J(q)q̇',
    'SNR = Pₛ/Pₙ', 'ℓ = −ln p(y|x)', 'z = Wx + b', 'τ = RC',
    's = σ + jω', 'λv = Cv', 'a = σ(z)', 'F = ma',
    'Y(ω) = H(ω)X(ω)', 'RMSE = √MSE', 'Gₜ = rₜ₊₁ + γGₜ₊₁', 'E = ½CV²',
    'f = 1/T', 'z = (x − μ)/σ', 'A = softmax(S)', 'τ = Iα',
    'T = 2π/ω', 'ŷ = Σ αᵢhᵢ(x)', 'σ(z) = 1/(1 + e⁻ᶻ)', 'Q = CV',
    'z = eˢᵀ', 'K(x, y) = xᵀy', 'aₜ = π(sₜ)', 'v = rω'
  ];
  const icons = ['arm', 'board', 'motor', 'chip'];
  const gap = 12;
  const edge = 9;
  const field = document.createElement('div');
  field.className = 'engineering-marks';
  field.setAttribute('aria-hidden', 'true');
  document.body.append(field);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const covered = '.page-preparing,.page-loading,.welcome-active,.welcome-pending,.media-viewer-open';
  let marks = [], bubbles = [];
  let width = 0, height = 0, nextFormula = 0, nextBubble = 0;
  let frame = 0, lastTime = 0, elapsed = 0, changing = null;

  function render(mark) {
    mark.element.style.transform = `translate3d(${mark.x.toFixed(2)}px,${mark.y.toFixed(2)}px,0)`;
  }

  function hasRoom(mark, x, y, w) {
    return x >= edge && y >= edge && x + w <= width - edge && y + mark.h <= height - edge &&
      marks.every(other => other === mark || x + w + gap <= other.x || other.x + other.w + gap <= x ||
        y + mark.h + gap <= other.y || other.y + other.h + gap <= y);
  }

  function layout() {
    const oldWidth = width, oldHeight = height;
    width = field.clientWidth;
    height = field.clientHeight;
    if (oldWidth === width && oldHeight === height) return;
    const cols = Math.min(5, Math.max(1, Math.floor(width / (width <= 760 ? 163 : 225))));
    const rows = Math.min(4, Math.max(1, Math.floor(height / 170)));
    const count = width >= 175 && height >= 120 ? rows * cols : 0;
    const iconCount = Math.min(4, Math.ceil(count / 4), count - 1);
    // Mobile browser chrome can change the height while scrolling. Keep existing
    // trajectories whenever the resized field can still hold them.
    if (count && count === marks.length && oldWidth === width) {
      const ratio = (height - 2 * edge) / (oldHeight - 2 * edge);
      for (const m of marks) m.y = Math.max(edge, Math.min(height - edge - m.h, edge + (m.y - edge) * ratio));
      if (marks.every(m => hasRoom(m, m.x, m.y, m.w))) {
        marks.forEach(render);
        return;
      }
    }
    changing = null;
    nextBubble = 0;
    elapsed = 0;
    marks = [];
    field.replaceChildren();
    const iconSlots = new Map();
    for (let i = 0; i < iconCount; i++) {
      const offset = [.83, .15, .68, .35][i];
      iconSlots.set(Math.floor((i + offset) * count / iconCount), icons[i]);
    }
    for (let i = 0; i < count; i++) {
      const element = document.createElement('span');
      const icon = iconSlots.get(i);
      element.className = icon ? 'engineering-mark engineering-hardware engineering-mark--' + icon :
        'engineering-mark engineering-equation';
      if (!icon) element.textContent = formulas[nextFormula++ % formulas.length];
      field.append(element);
      const angle = .68 + i * 2.4;
      const speed = 14 + i % 5 * 2;
      marks.push({ element, icon, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
    }
    const cellWidth = width / cols, cellHeight = height / rows;
    marks.forEach((m, i) => {
      const rect = m.element.getBoundingClientRect();
      m.w = Math.ceil(rect.width);
      m.h = Math.ceil(rect.height);
      m.x = i % cols * cellWidth + edge + (.11 + (i * .618) % .78) * (cellWidth - m.w - 2 * edge);
      m.y = Math.floor(i / cols) * cellHeight + edge + (.24 + (i * .414) % .69) * (cellHeight - m.h - 2 * edge);
      render(m);
    });
    bubbles = marks.filter(mark => !mark.icon);
    syncMotion();
  }

  // Sweep to the first padded edge on each axis. Exchanging only the velocity
  // normal to that edge preserves sideways drift during glancing collisions.
  function advance(mark, horizontal, dt) {
    const pos = horizontal ? 'x' : 'y', size = horizontal ? 'w' : 'h';
    const cross = horizontal ? 'y' : 'x', crossSize = horizontal ? 'h' : 'w';
    const velocity = horizontal ? 'vx' : 'vy';
    const speed = mark[velocity];
    const sign = Math.sign(speed);
    let room = sign > 0 ? (horizontal ? width : height) - edge - mark[size] - mark[pos] : mark[pos] - edge;
    let obstacle = null;
    for (const other of marks) {
      if (other === mark || mark[cross] + mark[crossSize] + gap <= other[cross] ||
          other[cross] + other[crossSize] + gap <= mark[cross]) continue;
      const distance = sign > 0 ? other[pos] - mark[pos] - mark[size] - gap :
        mark[pos] - other[pos] - other[size] - gap;
      if (distance >= -.001 && distance < room) {
        obstacle = other;
        room = distance;
      }
    }
    const travel = Math.abs(speed) * dt;
    mark[pos] += sign * Math.min(travel, Math.max(0, room));
    if (travel < room) return;
    if (!obstacle) mark[velocity] = -speed;
    else if ((speed - obstacle[velocity]) * sign > 0) {
      mark[velocity] = obstacle[velocity];
      obstacle[velocity] = speed;
    }
  }

  function cycleFormula(dt) {
    elapsed += dt;
    if (!changing && elapsed >= 3.2) {
      changing = bubbles[nextBubble++ % bubbles.length];
      changing.element.classList.add('is-changing');
    }
    if (!changing || elapsed < 3.48) return;
    const m = changing;
    const previous = m.element.textContent;
    const formula = formulas[nextFormula % formulas.length];
    m.element.textContent = formula;
    const w = Math.ceil(m.element.getBoundingClientRect().width);
    const x = Math.min(width - edge - w, Math.max(edge, m.x + (m.w - w) / 2));
    if (hasRoom(m, x, m.y, w)) {
      m.x = x;
      m.w = w;
      nextFormula++;
    } else {
      m.element.textContent = previous;
    }
    m.element.classList.remove('is-changing');
    changing = null;
    elapsed = 0;
  }

  function tick(time) {
    const dt = lastTime ? Math.max(0, Math.min((time - lastTime) / 1000, .05)) : 0;
    lastTime = time;
    cycleFormula(dt);
    for (const m of marks) {
      advance(m, true, dt);
      advance(m, false, dt);
      render(m);
    }
    frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    if (document.hidden || reducedMotion.matches || document.documentElement.matches(covered) || !bubbles.length) {
      cancelAnimationFrame(frame);
      frame = lastTime = 0;
      if (changing) {
        changing.element.classList.remove('is-changing');
        changing = null;
        elapsed = 0;
      }
    } else if (!frame) frame = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', layout, { passive: true });
  const header = document.querySelector('.site-header');
  if (header && 'ResizeObserver' in window) {
    new ResizeObserver(() => requestAnimationFrame(layout)).observe(header);
  }
  matchMedia('print').addEventListener('change', layout);
  new MutationObserver(syncMotion).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', syncMotion);
  layout();
})();
