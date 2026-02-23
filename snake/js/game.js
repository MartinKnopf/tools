/**
 * game.js — Core game state, movement logic, and win/lose detection.
 *
 * The Game class owns the authoritative grid state. All mutations go
 * through move() which returns a result object consumed by the
 * renderer for animations. Full undo history is kept so the player
 * can freely experiment.
 */

// Cardinal direction vectors
export const DIR = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};

export const ALL_DIRS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

export class Game {
  constructor(level) {
    this.gridSize = level.gridSize;
    this.snake    = deepCopy(level.snake);
    this.targets  = deepCopy(level.targets);
    this.apples   = deepCopy(level.apples  ?? []);
    this.walls    = deepCopy(level.walls    ?? []);
    this.crates   = deepCopy(level.crates   ?? []);
    this.ice      = deepCopy(level.ice      ?? []);
    this.portals  = deepCopy(level.portals  ?? []);
    this.moves    = 0;
    this.history  = [];
    this.won      = false;
    this.gameOver = false;
    this.level    = level; // keep reference for restart
  }

  // ── helpers ──────────────────────────────────────────────────────

  /** Wrap a coordinate into [0, gridSize). */
  wrap(v) {
    return ((v % this.gridSize) + this.gridSize) % this.gridSize;
  }

  /** Check if (x,y) has a wall. */
  hasWall(x, y) {
    return this.walls.some(w => w.x === x && w.y === y);
  }

  /** Return crate index at (x,y) or -1. */
  crateAt(x, y) {
    return this.crates.findIndex(c => c.x === x && c.y === y);
  }

  /** Check whether any snake segment (optionally excluding last) occupies (x,y). */
  snakeAt(x, y, excludeTail = false) {
    const len = excludeTail ? this.snake.length - 1 : this.snake.length;
    for (let i = 0; i < len; i++) {
      if (this.snake[i].x === x && this.snake[i].y === y) return true;
    }
    return false;
  }

  /** Is (x,y) an ice tile? */
  hasIce(x, y) {
    return this.ice.some(t => t.x === x && t.y === y);
  }

  /** Return portal at (x,y) or null. */
  portalAt(x, y) {
    return this.portals.find(p => p.x === x && p.y === y) ?? null;
  }

  // ── movement ─────────────────────────────────────────────────────

  /**
   * Attempt to move the snake one step in `dir`.
   * Returns a result object on success, or null if the move is blocked.
   * The result contains animation hints consumed by the renderer.
   */
  move(dir) {
    if (this.won || this.gameOver) return null;

    const head = this.snake[0];
    let nx = this.wrap(head.x + dir.x);
    let ny = this.wrap(head.y + dir.y);

    // Snapshot for undo
    const snapshot = {
      snake:  deepCopy(this.snake),
      apples: deepCopy(this.apples),
      crates: deepCopy(this.crates),
      moves:  this.moves,
    };

    // Wall check
    if (this.hasWall(nx, ny)) return null;

    // Crate check — try to push
    let pushedCrate = null;
    const ci = this.crateAt(nx, ny);
    if (ci !== -1) {
      const bx = this.wrap(nx + dir.x);
      const by = this.wrap(ny + dir.y);
      // Blocked behind the crate?
      if (this.hasWall(bx, by) ||
          this.crateAt(bx, by) !== -1 ||
          this.snakeAt(bx, by)) {
        return null;
      }
      pushedCrate = { idx: ci, from: { x: nx, y: ny }, to: { x: bx, y: by } };
      this.crates[ci].x = bx;
      this.crates[ci].y = by;
    }

    // Portal teleport
    let teleported = false;
    const portal = this.portalAt(nx, ny);
    if (portal) {
      const exit = this.portals.find(
        p => p.pair === portal.pair && (p.x !== portal.x || p.y !== portal.y)
      );
      if (exit) {
        nx = exit.x;
        ny = exit.y;
        teleported = true;
      }
    }

    // Apple check
    let ateApple = false;
    const ai = this.apples.findIndex(a => a.x === nx && a.y === ny);
    if (ai !== -1) {
      ateApple = true;
      this.apples.splice(ai, 1);
    }

    // Self-collision (exclude tail only if not growing)
    const checkLen = ateApple ? this.snake.length : this.snake.length - 1;
    for (let i = 0; i < checkLen; i++) {
      if (this.snake[i].x === nx && this.snake[i].y === ny) {
        // Game over — still apply the move visually
        this.history.push(snapshot);
        this.snake.unshift({ x: nx, y: ny });
        if (!ateApple) this.snake.pop();
        this.moves++;
        this.gameOver = true;
        return { gameOver: true, pushedCrate, ateApple, teleported };
      }
    }

    // Apply movement
    this.snake.unshift({ x: nx, y: ny });
    if (!ateApple) this.snake.pop();
    this.moves++;
    this.history.push(snapshot);

    // Win check
    this.checkWin();

    return {
      won: this.won,
      gameOver: false,
      pushedCrate,
      ateApple,
      teleported,
      onIce: this.hasIce(nx, ny),
    };
  }

  /** Win when every target is covered and every segment is on a target. */
  checkWin() {
    // Must have eaten all apples first
    if (this.apples.length > 0) return;
    if (this.snake.length !== this.targets.length) return;
    for (const seg of this.snake) {
      if (!this.targets.some(t => t.x === seg.x && t.y === seg.y)) return;
    }
    this.won = true;
  }

  // ── undo / restart ───────────────────────────────────────────────

  undo() {
    if (this.history.length === 0) return false;
    const s = this.history.pop();
    this.snake  = s.snake;
    this.apples = s.apples;
    this.crates = s.crates;
    this.moves  = s.moves;
    this.won = false;
    this.gameOver = false;
    return true;
  }

  restart() {
    while (this.history.length > 0) this.undo();
  }
}

// ── utility ──────────────────────────────────────────────────────

function deepCopy(arr) {
  return arr.map(p => ({ ...p }));
}
