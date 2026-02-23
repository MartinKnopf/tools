/**
 * input.js — Touch-swipe and keyboard-arrow input handling.
 *
 * Emits direction callbacks for UP / DOWN / LEFT / RIGHT.
 * Touch swipes are detected with a minimum threshold to avoid
 * accidental moves.  Keyboard repeats are debounced.
 */

import { DIR } from './game.js';

const SWIPE_THRESHOLD = 20; // px

export class Input {
  /**
   * @param {HTMLElement} element – DOM element to listen on (usually canvas)
   * @param {(dir: {x,y}) => void} onMove – called with a DIR constant
   */
  constructor(element, onMove) {
    this.element = element;
    this.onMove  = onMove;
    this.enabled = true;

    // Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touching    = false;

    // Bind listeners
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchEnd   = this._handleTouchEnd.bind(this);
    this._onKeyDown    = this._handleKeyDown.bind(this);

    element.addEventListener('touchstart',  this._onTouchStart, { passive: true });
    element.addEventListener('touchend',    this._onTouchEnd,   { passive: true });
    document.addEventListener('keydown',    this._onKeyDown);
  }

  /** Temporarily disable input (during animations, overlays, etc). */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // ── touch ─────────────────────────────────────────────────────

  _handleTouchStart(e) {
    if (!this.enabled) return;
    const t = e.touches[0];
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
    this.touching = true;
  }

  _handleTouchEnd(e) {
    if (!this.enabled || !this.touching) return;
    this.touching = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    // Determine primary axis
    if (Math.abs(dx) > Math.abs(dy)) {
      this.onMove(dx > 0 ? DIR.RIGHT : DIR.LEFT);
    } else {
      this.onMove(dy > 0 ? DIR.DOWN : DIR.UP);
    }
  }

  // ── keyboard ──────────────────────────────────────────────────

  _handleKeyDown(e) {
    if (!this.enabled) return;

    const map = {
      ArrowUp:    DIR.UP,
      ArrowDown:  DIR.DOWN,
      ArrowLeft:  DIR.LEFT,
      ArrowRight: DIR.RIGHT,
      w: DIR.UP,    W: DIR.UP,
      s: DIR.DOWN,  S: DIR.DOWN,
      a: DIR.LEFT,  A: DIR.LEFT,
      d: DIR.RIGHT, D: DIR.RIGHT,
    };

    const dir = map[e.key];
    if (dir) {
      e.preventDefault();
      this.onMove(dir);
    }
  }

  /** Clean up all listeners. */
  destroy() {
    this.element.removeEventListener('touchstart', this._onTouchStart);
    this.element.removeEventListener('touchend',   this._onTouchEnd);
    document.removeEventListener('keydown', this._onKeyDown);
  }
}
