/**
 * renderer.js — Canvas rendering with smooth animations and effects.
 *
 * Draws the grid, targets, snake, items and overlays onto a full-screen
 * canvas.  Movement is interpolated so the snake slides between cells.
 * Particles, screen-shake and cell pulses add satisfying "juice".
 */

// ── colour constants ──────────────────────────────────────────────

const CELL_FILL      = 'rgba(255,255,255,0.18)';
const TARGET_FILL    = 'rgba(255,255,255,0.45)';
const SNAKE_FILL     = '#FFFFFF';
const SNAKE_SHADOW   = 'rgba(0,0,0,0.12)';
const WALL_FILL      = 'rgba(0,0,0,0.18)';
const CRATE_FILL     = '#D4A574';
const ICE_FILL       = '#A8D8EA';
const APPLE_FILL     = '#FF6B6B';
const APPLE_LEAF     = '#6BCB77';
const PORTAL_COLORS  = ['#FF9F43', '#54A0FF', '#FF6B81', '#1DD1A1'];

// ── easing helpers ────────────────────────────────────────────────

function easeOut(t)  { return 1 - (1 - t) * (1 - t); }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function lerp(a, b, t) { return a + (b - a) * t; }

/** Lerp with wrap-around awareness. */
function lerpWrap(a, b, t, size) {
  let diff = b - a;
  if (Math.abs(diff) > size / 2) {
    if (diff > 0) a += size; else a -= size;
  }
  return a + (b - a) * t;
}

// ── Renderer class ────────────────────────────────────────────────

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.dpr    = window.devicePixelRatio || 1;

    // Animation state
    this.moveAnim   = null;   // { start, dur, from, to, crateFrom?, crateTo? }
    this.particles  = [];
    this.pulses     = [];     // { x, y, t }  — cell‐landing pulses
    this.shake      = 0;      // remaining shake time (ms)
    this.bgColor    = '#6EABAB';
    this.time       = 0;
    this.animating  = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  // ── sizing ────────────────────────────────────────────────────

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width  = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.screenW = w;
    this.screenH = h;
  }

  /** Recompute grid metrics for a given gridSize. */
  computeLayout(gridSize) {
    const pad = 32;
    const maxW = this.screenW - pad * 2;
    const maxH = this.screenH - pad * 2 - 120; // room for HUD + bottom bar
    this.cellSize = Math.floor(Math.min(maxW, maxH) / gridSize);
    this.gridPx   = this.cellSize * gridSize;
    this.offsetX   = Math.floor((this.screenW - this.gridPx) / 2);
    this.offsetY   = Math.floor((this.screenH - this.gridPx) / 2) + 10;
    this.gridSize  = gridSize;
  }

  // ── animation triggers ────────────────────────────────────────

  /** Called by main.js after a successful game.move(). */
  animateMove(prevSnake, newSnake, result) {
    this.moveAnim = {
      start: performance.now(),
      dur:   120,
      from:  prevSnake.map(p => ({ ...p })),
      to:    newSnake.map(p => ({ ...p })),
    };
    if (result?.pushedCrate) {
      this.moveAnim.crateFrom = { ...result.pushedCrate.from };
      this.moveAnim.crateTo   = { ...result.pushedCrate.to };
    }
    this.animating = true;
  }

  /** Burst particles at a world position. */
  spawnParticles(wx, wy, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 60 + Math.random() * 100;
      this.particles.push({
        x: wx, y: wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 1.2 + Math.random() * 0.8,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  /** Spawn a celebratory particle burst for winning. */
  spawnWinParticles() {
    const cx = this.screenW / 2;
    const cy = this.screenH / 2;
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B81', '#A66CFF'];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 250;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.6 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
      });
    }
  }

  /** Add a landing pulse on a cell. */
  addPulse(x, y) {
    this.pulses.push({ x, y, t: 1 });
  }

  /** Trigger screen shake. */
  triggerShake(ms = 300) {
    this.shake = ms;
  }

  // ── main render loop ─────────────────────────────────────────

  /** Single-frame draw.  Called from main.js in a rAF loop. */
  draw(game, ts) {
    const dt = this.time ? (ts - this.time) / 1000 : 0.016;
    this.time = ts;
    const ctx = this.ctx;

    // Update animations
    this.updateParticles(dt);
    this.updatePulses(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 1000);

    // Check if move animation finished
    if (this.moveAnim) {
      const elapsed = ts - this.moveAnim.start;
      if (elapsed >= this.moveAnim.dur) {
        this.moveAnim = null;
        this.animating = false;
      }
    }

    // Layout
    this.computeLayout(game.gridSize);

    // Shake offset
    const sx = this.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    const sy = this.shake > 0 ? (Math.random() - 0.5) * 6 : 0;

    // ── background ───────────────────────────────────────────
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.screenW, this.screenH);

    ctx.save();
    ctx.translate(sx, sy);

    // ── grid card background ─────────────────────────────────
    const cardPad = 12;
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    roundRect(ctx,
      this.offsetX - cardPad, this.offsetY - cardPad,
      this.gridPx + cardPad * 2, this.gridPx + cardPad * 2,
      16);
    ctx.fill();

    // ── empty cells ──────────────────────────────────────────
    for (let y = 0; y < game.gridSize; y++) {
      for (let x = 0; x < game.gridSize; x++) {
        this.drawCell(x, y, CELL_FILL);
      }
    }

    // ── target cells ─────────────────────────────────────────
    const pulse = Math.sin(ts / 800) * 0.08 + 0.92;
    for (const t of game.targets) {
      this.drawCell(t.x, t.y, TARGET_FILL, pulse);
    }

    // ── pulses ───────────────────────────────────────────────
    for (const p of this.pulses) {
      const scale = 1 + (1 - p.t) * 0.25;
      const alpha = p.t * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      const cs = this.cellSize * scale;
      const cx = this.offsetX + p.x * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + p.y * this.cellSize + this.cellSize / 2;
      roundRect(ctx, cx - cs / 2, cy - cs / 2, cs, cs, this.cellSize * 0.5);
      ctx.fill();
    }

    // ── ice tiles ────────────────────────────────────────────
    for (const t of game.ice) {
      this.drawCell(t.x, t.y, ICE_FILL + '66');
      // Snowflake icon
      const cx = this.offsetX + t.x * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + t.y * this.cellSize + this.cellSize / 2;
      ctx.fillStyle = ICE_FILL;
      ctx.font = `${this.cellSize * 0.4}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❄', cx, cy);
    }

    // ── walls ────────────────────────────────────────────────
    for (const w of game.walls) {
      this.drawCell(w.x, w.y, WALL_FILL);
    }

    // ── crates ───────────────────────────────────────────────
    this.drawCrates(game, ts);

    // ── portals ──────────────────────────────────────────────
    for (const p of game.portals) {
      const color = PORTAL_COLORS[p.pair % PORTAL_COLORS.length];
      const cx = this.offsetX + p.x * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + p.y * this.cellSize + this.cellSize / 2;
      const r = this.cellSize * 0.3;
      const rot = ts / 600 + p.pair * 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── apples ───────────────────────────────────────────────
    for (const a of game.apples) {
      const cx = this.offsetX + a.x * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + a.y * this.cellSize + this.cellSize / 2;
      const r = this.cellSize * 0.28;
      const bob = Math.sin(ts / 500 + a.x * 3 + a.y * 7) * 2;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r + 3, r * 0.7, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Apple body
      ctx.fillStyle = APPLE_FILL;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, r, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.25, cy + bob - r * 0.25, r * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Leaf
      ctx.fillStyle = APPLE_LEAF;
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy + bob - r - 2, 4, 7, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── snake ────────────────────────────────────────────────
    this.drawSnake(game, ts);

    ctx.restore();

    // ── particles (screen-space, after shake restore) ────────
    this.drawParticles(ctx);
  }

  // ── cell drawing ──────────────────────────────────────────────

  drawCell(x, y, fill, scale = 1) {
    const ctx = this.ctx;
    const pad = this.cellSize * 0.08;
    const cs  = (this.cellSize - pad * 2) * scale;
    const cx  = this.offsetX + x * this.cellSize + this.cellSize / 2;
    const cy  = this.offsetY + y * this.cellSize + this.cellSize / 2;
    const r   = cs * 0.5;

    ctx.fillStyle = fill;
    roundRect(ctx, cx - cs / 2, cy - cs / 2, cs, cs, r);
    ctx.fill();
  }

  // ── crate drawing (with push animation) ───────────────────────

  drawCrates(game, ts) {
    const ctx = this.ctx;
    for (let i = 0; i < game.crates.length; i++) {
      let cx = game.crates[i].x;
      let cy = game.crates[i].y;

      // Interpolate if this crate is being pushed
      if (this.moveAnim && this.moveAnim.crateFrom) {
        const anim = this.moveAnim;
        if (anim.crateTo.x === game.crates[i].x && anim.crateTo.y === game.crates[i].y) {
          const t = easeOut(Math.min(1, (ts - anim.start) / anim.dur));
          cx = lerpWrap(anim.crateFrom.x, anim.crateTo.x, t, game.gridSize);
          cy = lerpWrap(anim.crateFrom.y, anim.crateTo.y, t, game.gridSize);
        }
      }

      const px = this.offsetX + cx * this.cellSize + this.cellSize / 2;
      const py = this.offsetY + cy * this.cellSize + this.cellSize / 2;
      const s  = this.cellSize * 0.38;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      roundRect(ctx, px - s - 1, py - s + 3, s * 2 + 2, s * 2, 6);
      ctx.fill();

      // Body
      ctx.fillStyle = CRATE_FILL;
      roundRect(ctx, px - s, py - s, s * 2, s * 2, 6);
      ctx.fill();

      // X pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - s * 0.5, py - s * 0.5);
      ctx.lineTo(px + s * 0.5, py + s * 0.5);
      ctx.moveTo(px + s * 0.5, py - s * 0.5);
      ctx.lineTo(px - s * 0.5, py + s * 0.5);
      ctx.stroke();
    }
  }

  // ── snake drawing ─────────────────────────────────────────────

  /**
   * Draw the snake as one smooth unified shape.
   *
   * Strategy — thick stroke + circle fills:
   *   1. Stroke the snake centre-line with round caps and round joins
   *      → gives smooth outer corners and end-caps for free.
   *   2. Fill circles at every cell centre with the same radius
   *      → fills inner-corner gaps at L-bends that the stroke misses.
   *   3. Single gradient applied to the whole shape.
   *
   * Both stroke and circles share the same colour/gradient, so the
   * union looks like one continuous rounded piece.
   */
  drawSnake(game, ts) {
    const ctx = this.ctx;
    const gs  = game.gridSize;
    const cs  = this.cellSize;
    const ox  = this.offsetX;
    const oy  = this.offsetY;

    const positions = this.getSnakePositions(game, ts);
    const pad = cs * 0.09;
    const R   = (cs - pad * 2) / 2;            // half-width of snake body
    const lw  = R * 2;                          // stroke lineWidth

    // Convert to pixel centres
    const pts = positions.map(p => ({
      x: ox + p.x * cs + cs / 2,
      y: oy + p.y * cs + cs / 2,
    }));

    // ── helper: render the full snake shape (stroke + circles) ──
    const renderShape = (target, style) => {
      // 1. Stroke the centre-line (round caps + round joins → smooth outer corners)
      target.save();
      target.lineWidth = lw;
      target.lineCap   = 'round';
      target.lineJoin  = 'round';
      target.strokeStyle = style;
      target.beginPath();
      target.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const dx = Math.abs(positions[i].x - positions[i - 1].x);
        const dy = Math.abs(positions[i].y - positions[i - 1].y);
        // Break the sub-path at wrap-around connections
        if (dx > 1.5 || dy > 1.5) {
          target.moveTo(pts[i].x, pts[i].y);
        } else {
          target.lineTo(pts[i].x, pts[i].y);
        }
      }
      target.stroke();
      target.restore();

      // 2. Fill circles at every cell centre (fills inner-corner gaps)
      target.fillStyle = style;
      target.beginPath();
      for (let i = 0; i < pts.length; i++) {
        target.moveTo(pts[i].x + R, pts[i].y);
        target.arc(pts[i].x, pts[i].y, R, 0, Math.PI * 2);
      }
      target.fill();
    };

    // ── shadow ───────────────────────────────────────────────
    ctx.save();
    ctx.translate(0, Math.max(3, cs * 0.04));
    renderShape(ctx, SNAKE_SHADOW);
    ctx.restore();

    // ── body ─────────────────────────────────────────────────
    const grd = ctx.createLinearGradient(0, oy, 0, oy + cs * gs);
    grd.addColorStop(0, '#FFFFFF');
    grd.addColorStop(1, '#F0F0F0');
    renderShape(ctx, grd);

    // ── head eye ─────────────────────────────────────────────
    if (positions.length >= 2) {
      const head = pts[0];
      const next = pts[1];
      let dx = head.x - next.x;
      let dy = head.y - next.y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= mag;
      dy /= mag;

      const eyeOff = cs * 0.16;
      const eyeR   = cs * 0.10;
      const pupilR = cs * 0.055;

      ctx.fillStyle = '#E0E0E0';
      ctx.beginPath();
      ctx.arc(head.x + dx * eyeOff, head.y + dy * eyeOff, eyeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.arc(head.x + dx * eyeOff + dx * 2.5, head.y + dy * eyeOff + dy * 2.5, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Resolve animated or static snake segment positions. */
  getSnakePositions(game, ts) {
    if (!this.moveAnim) return game.snake;

    const t    = easeOut(Math.min(1, (ts - this.moveAnim.start) / this.moveAnim.dur));
    const from = this.moveAnim.from;
    const to   = this.moveAnim.to;
    const gs   = game.gridSize;

    return to.map((p, i) => {
      const src = i < from.length ? from[i] : from[from.length - 1];
      return {
        x: lerpWrap(src.x, p.x, t, gs),
        y: lerpWrap(src.y, p.y, t, gs),
      };
    });
  }

  // ── particles ─────────────────────────────────────────────────

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // gravity
      p.life -= p.decay * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── pulses ────────────────────────────────────────────────────

  updatePulses(dt) {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      this.pulses[i].t -= dt * 2.5;
      if (this.pulses[i].t <= 0) this.pulses.splice(i, 1);
    }
  }
}

// ── snake path builder ────────────────────────────────────────────

// ── canvas helpers ────────────────────────────────────────────────

/** Draw a rounded rectangle path (uniform radius). */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}
