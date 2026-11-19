(() => {
  'use strict';

  // Interleave subjects so even a small screen opens with a mix of equations.
  const formulas = [
    ['Average speed', 'v = distance ÷ time'],
    ['Bits and bytes', '1 byte = 8 bits'],
    ['Sending a file', 'time = bits ÷ bit rate'],
    ['Clock period', 'T = 1 ÷ f'],
    ['Acceleration', 'a = Δv ÷ Δt'],
    ['CPU time', 't = cycles ÷ clock rate'],
    ['Image resolution', 'pixels = width × height'],
    ['Ohm’s law', 'V = I × R'],
    ['Displacement', 'Δx = x₂ − x₁'],
    ['Binary storage', '1 KiB = 1,024 bytes'],
    ['Data rate', 'bit rate = bits ÷ time'],
    ['Prediction error', 'e = actual − predicted'],
    ['Constant acceleration', 'v = v₀ + at'],
    ['Instructions per cycle', 'IPC = instr. ÷ cycles'],
    ['Signal travel time', 't = distance ÷ speed'],
    ['Electrical power', 'P = V × I'],
    ['Angular speed', 'ω = Δθ ÷ Δt'],
    ['n address bits', 'addresses = 2ⁿ'],
    ['Network throughput', 'MB/s = Mb/s ÷ 8'],
    ['Binary value', '1010₂ = 10'],
    ['Wheel speed', 'v = rω'],
    ['CPU clock', '1 GHz = 10⁹ Hz'],
    ['Digital sampling', 'samples = rate × time'],
    ['Cache hits', 'hit rate = hits ÷ accesses'],
    ['Constant speed', 'distance = v × t'],
    ['One byte', '2⁸ = 256 values'],
    ['Symbol rate', 'baud = symbols ÷ time'],
    ['Model accuracy', 'accuracy = correct ÷ total']
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
  let marks = [], equations = [];
  let width = 0, height = 0, nextFormula = 0, nextEquation = 0;
  let frame = 0, lastTime = 0, elapsed = 0, changing = null;

  const radians = Math.PI / 180;

  function setFormula(mark, formula) {
    mark.label.textContent = formula[0];
    mark.value.textContent = formula[1];
    mark.formula = formula;
  }

  function measure(mark) {
    const textWidth = mark.element.offsetWidth;
    const textHeight = mark.element.offsetHeight;
    if (mark.icon) return { w: textWidth, h: textHeight, textWidth, textHeight };

    // Reserve enough space for every angle of this equation's slow turn.
    // Only the lettering is painted, centered inside these collision bounds.
    const maxTilt = (Math.abs(mark.tilt) + mark.sway) * radians;
    const w = Math.ceil(Math.hypot(textWidth, textHeight)) + 2;
    const h = Math.ceil(textHeight + textWidth * Math.sin(maxTilt)) + 2;
    return { w, h, textWidth, textHeight };
  }

  function render(mark) {
    const x = mark.x + (mark.w - mark.textWidth) / 2;
    const y = mark.y + (mark.h - mark.textHeight) / 2;
    const angle = mark.icon ? 0 : mark.tilt + mark.sway * Math.sin(mark.phase);
    mark.element.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg)`;
  }

  function hasRoom(mark, x, y, w, h) {
    return x >= edge && y >= edge && x + w <= width - edge && y + h <= height - edge &&
      marks.every(other => other === mark || x + w + gap <= other.x || other.x + other.w + gap <= x ||
        y + h + gap <= other.y || other.y + other.h + gap <= y);
  }

  function layout() {
    const oldWidth = width, oldHeight = height;
    width = field.clientWidth;
    height = field.clientHeight;
    if (oldWidth === width && oldHeight === height) return;
    const cols = Math.min(4, Math.max(1, Math.floor(width / (width <= 760 ? 183 : 240))));
    const rows = Math.min(4, Math.max(1, Math.floor(height / 170)));
    const count = width >= 175 && height >= 120 ? rows * cols : 0;
    const iconCount = Math.min(4, Math.ceil(count / 4), count - 1);
    // Mobile browser chrome can change the height while scrolling. Keep existing
    // trajectories whenever the resized field can still hold them.
    if (count && count === marks.length && oldWidth === width) {
      const ratio = (height - 2 * edge) / (oldHeight - 2 * edge);
      for (const m of marks) m.y = Math.max(edge, Math.min(height - edge - m.h, edge + (m.y - edge) * ratio));
      if (marks.every(m => hasRoom(m, m.x, m.y, m.w, m.h))) {
        marks.forEach(render);
        return;
      }
    }
    changing = null;
    nextEquation = 0;
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
      field.append(element);
      const angle = .68 + i * 2.4;
      const speed = 14 + i % 5 * 2;
      const mark = {
        element, icon, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        tilt: (i % 2 ? 1 : -1) * (9 + i * 7 % 18), sway: 7 + i % 7,
        phase: i * 1.74, turnRate: .18 + (i % 6) * .023
      };
      if (!icon) {
        mark.label = document.createElement('small');
        mark.value = document.createElement('span');
        element.append(mark.label, mark.value);
        setFormula(mark, formulas[nextFormula++ % formulas.length]);
      }
      marks.push(mark);
    }
    const cellWidth = width / cols, cellHeight = height / rows;
    marks.forEach((m, i) => {
      Object.assign(m, measure(m));
      m.x = i % cols * cellWidth + edge + (.11 + (i * .618) % .78) * (cellWidth - m.w - 2 * edge);
      m.y = Math.floor(i / cols) * cellHeight + edge + (.24 + (i * .414) % .69) * (cellHeight - m.h - 2 * edge);
      render(m);
    });
    equations = marks.filter(mark => !mark.icon);
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
      changing = equations[nextEquation++ % equations.length];
      changing.element.classList.add('is-changing');
    }
    if (!changing || elapsed < 3.48) return;
    const m = changing;
    const previous = m.formula;
    const formula = formulas[nextFormula % formulas.length];
    setFormula(m, formula);
    const bounds = measure(m);
    const { w, h } = bounds;
    const x = Math.min(width - edge - w, Math.max(edge, m.x + (m.w - w) / 2));
    const y = Math.min(height - edge - h, Math.max(edge, m.y + (m.h - h) / 2));
    if (hasRoom(m, x, y, w, h)) {
      Object.assign(m, bounds, { x, y });
      nextFormula++;
    } else {
      setFormula(m, previous);
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
      m.phase += m.turnRate * dt;
      advance(m, true, dt);
      advance(m, false, dt);
      render(m);
    }
    frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    if (document.hidden || reducedMotion.matches || document.documentElement.matches(covered) || !equations.length) {
      cancelAnimationFrame(frame);
      frame = lastTime = 0;
      if (changing) {
        changing.element.classList.remove('is-changing');
        changing = null;
        elapsed = 0;
      }
    } else if (!frame) frame = requestAnimationFrame(tick);
  }

  function start() {
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
  }

  // Measure once the local typeface is ready so the collision boxes match the glyphs.
  document.fonts.load('750 16px "Equation Rounded"').then(start, start);
})();
