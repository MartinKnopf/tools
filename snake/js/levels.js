/**
 * levels.js — Procedural level generation.
 *
 * Campaign levels are generated with a *reverse-simulation* technique:
 *   1. Place the snake in its SOLVED position on the target cells.
 *   2. "Undo" random moves to create the starting position.
 *   3. The reversed sequence of those undos IS the solution.
 * This guarantees every campaign level is solvable.
 *
 * The custom generator uses a forward random-walk which is simpler
 * but does not guarantee solvability.
 */

import { Random, hashSeed } from './random.js';
import { ALL_DIRS } from './game.js';

// ── campaign level configuration ──────────────────────────────────

/**
 * Returns grid parameters for a given campaign level number.
 * Difficulty ramps gradually: grid size, snake length, solution depth,
 * wall count and apple count all increase.
 */
export function getLevelConfig(n) {
  if (n <= 3)  return { gridSize: 5, snakeLen: 3, depth:  4 + n,     walls: 0, apples: 0 };
  if (n <= 6)  return { gridSize: 5, snakeLen: 3, depth:  5 + n,     walls: 1, apples: 0 };
  if (n <= 10) return { gridSize: 5, snakeLen: 3, depth:  6 + n,     walls: 2, apples: 1 };
  if (n <= 15) return { gridSize: 6, snakeLen: 4, depth:  8 + n - 10, walls: 3, apples: 1 };
  if (n <= 20) return { gridSize: 6, snakeLen: 4, depth: 10 + n - 15, walls: 3, apples: 1 };
  if (n <= 30) return { gridSize: 7, snakeLen: 5, depth: 12 + n - 20, walls: 4, apples: 2 };
  return       { gridSize: 8, snakeLen: 5, depth: Math.min(15 + n - 30, 35), walls: 5, apples: 2 };
}

// ── colour themes ─────────────────────────────────────────────────

export const THEMES = [
  '#6EABAB', // teal
  '#7DB87D', // green
  '#9484B4', // purple
  '#B88888', // rose
  '#A4A07C', // olive
  '#7CA0BC', // steel
  '#AC84AC', // mauve
  '#B8A478', // gold
  '#78B4A0', // mint
  '#B89484', // copper
];

export function themeForLevel(n) {
  return THEMES[(n - 1) % THEMES.length];
}

// ── campaign level generator (reverse simulation) ─────────────────

/**
 * Generate a campaign level.  The seed is simply the level number.
 * Returns a plain level object consumed by the Game constructor.
 */
export function generateCampaignLevel(levelNum) {
  const cfg = getLevelConfig(levelNum);
  const rng = new Random(levelNum * 7919);           // prime‐scaled seed
  const gs  = cfg.gridSize;

  // Retry wrapper – the random walk can occasionally box itself in.
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = tryGenerateReverse(rng, gs, cfg.snakeLen, cfg.depth, cfg.walls, cfg.apples);
    if (result) return result;
  }
  // Fallback: trivial level (should never happen in practice)
  return fallbackLevel(gs, cfg.snakeLen);
}

/**
 * Core reverse-simulation generator.
 *
 * 1. Build target path (random walk on the grid → valid snake shape).
 * 2. That path IS the solved snake position AND the target cells.
 * 3. Walk backwards from the solved position to create the start state.
 * 4. Place walls that don't collide with start or target.
 * 5. Place apples along the backward path (shrink steps).
 */
function tryGenerateReverse(rng, gs, snakeLen, depth, numWalls, numApples) {
  const wrap = v => ((v % gs) + gs) % gs;

  // ── step 1: create the solved snake (target shape) ──────────
  const finalLen = snakeLen + numApples;       // after eating all apples
  const solved = buildRandomPath(rng, gs, finalLen);
  if (!solved) return null;

  // ── step 2: reverse-walk to create starting position ────────
  let snake = solved.map(p => ({ ...p }));
  const forwardDirs = [];      // will become the solution (reversed at end)
  const applePositions = [];   // cells where apples will be placed
  let appleBudget = numApples;

  // Decide which backward steps will be "apple undos" (shrink snake)
  const appleSteps = new Set();
  if (appleBudget > 0) {
    const candidates = [];
    for (let i = 1; i < depth; i++) candidates.push(i);
    const shuffled = rng.shuffle(candidates);
    for (let i = 0; i < Math.min(appleBudget, shuffled.length); i++) {
      appleSteps.add(shuffled[i]);
    }
  }

  for (let step = 0; step < depth; step++) {
    const head = snake[0];
    const second = snake[1];
    // The forward direction for this undo is head → second (reversed body order)
    // Actually it's second → head because the forward move went FROM second TO head
    // Wait – in forward play the head moves from its previous cell to the current cell.
    // The "previous cell" of the head is second (since body follows head).
    // So forward direction = head - second.
    const fwdDir = { x: head.x - second.x, y: head.y - second.y };
    // Fix wrapping in the direction vector
    if (fwdDir.x >  1) fwdDir.x -= gs;
    if (fwdDir.x < -1) fwdDir.x += gs;
    if (fwdDir.y >  1) fwdDir.y -= gs;
    if (fwdDir.y < -1) fwdDir.y += gs;
    forwardDirs.push(fwdDir);

    const isAppleStep = appleSteps.has(step);

    if (isAppleStep) {
      // Apple undo: remove head, don't extend tail → snake shrinks
      applePositions.push({ x: head.x, y: head.y });
      snake.shift();
    } else {
      // Normal undo: remove head, extend tail in a random valid direction
      snake.shift();
      const tail = snake[snake.length - 1];
      const validTailDirs = ALL_DIRS.filter(d => {
        const tx = wrap(tail.x + d.x);
        const ty = wrap(tail.y + d.y);
        return !snake.some(s => s.x === tx && s.y === ty) &&
               !solved.some(t => t.x === tx && t.y === ty); // avoid target cells for clarity
      });
      if (validTailDirs.length === 0) return null; // stuck, retry
      const td = rng.pick(validTailDirs);
      snake.push({ x: wrap(tail.x + td.x), y: wrap(tail.y + td.y) });
    }
  }

  // Snake now holds the starting position.
  // Solution = forwardDirs reversed.
  const solution = forwardDirs.reverse();

  // ── step 3: place walls ─────────────────────────────────────
  const occupied = new Set([
    ...snake.map(p => key(p)),
    ...solved.map(p => key(p)),
    ...applePositions.map(p => key(p)),
  ]);

  const walls = [];
  for (let i = 0; i < numWalls; i++) {
    for (let att = 0; att < 50; att++) {
      const x = rng.int(0, gs);
      const y = rng.int(0, gs);
      const k = key({ x, y });
      if (!occupied.has(k) && !walls.some(w => key(w) === k)) {
        walls.push({ x, y });
        occupied.add(k);
        break;
      }
    }
  }

  return {
    gridSize: gs,
    snake:   snake.map(p => ({ ...p })),
    targets: solved.map(p => ({ ...p })),
    apples:  applePositions,
    walls,
    crates:  [],
    ice:     [],
    portals: [],
    solution,
  };
}

// ── random path builder ───────────────────────────────────────────

/** Build a self-avoiding random walk of `length` cells on a `gs×gs` grid. */
function buildRandomPath(rng, gs, length) {
  const wrap = v => ((v % gs) + gs) % gs;

  for (let attempt = 0; attempt < 30; attempt++) {
    const path = [{ x: rng.int(1, gs - 1), y: rng.int(1, gs - 1) }];
    for (let i = 1; i < length; i++) {
      const last = path[i - 1];
      const dirs = rng.shuffle(ALL_DIRS).filter(d => {
        const nx = wrap(last.x + d.x);
        const ny = wrap(last.y + d.y);
        return !path.some(p => p.x === nx && p.y === ny);
      });
      if (dirs.length === 0) break;   // stuck
      const d = dirs[0];
      path.push({ x: wrap(last.x + d.x), y: wrap(last.y + d.y) });
    }
    if (path.length === length) return path;
  }
  return null;
}

// ── custom level generator (forward walk) ─────────────────────────

/**
 * Generate a custom level from user-specified parameters.
 * Uses forward simulation — solvability is likely but not guaranteed.
 */
export function generateCustomLevel({ seed, gridSize, difficulty, mechanics }) {
  const rng = new Random(typeof seed === 'number' ? seed : hashSeed(seed));
  const gs  = gridSize;
  const wrap = v => ((v % gs) + gs) % gs;

  const snakeLen = Math.min(3 + Math.floor(difficulty / 3), gs - 1);
  const numMoves = 6 + difficulty * 3;

  // Starting snake (horizontal, near centre)
  const sy = Math.floor(gs / 2);
  const sx = Math.floor((gs - snakeLen) / 2);
  const startSnake = [];
  for (let i = snakeLen - 1; i >= 0; i--) startSnake.push({ x: sx + i, y: sy });

  // Place walls
  const walls = [];
  const numWalls = Math.floor(difficulty * 0.7);
  const occupied = new Set(startSnake.map(key));
  for (let i = 0; i < numWalls; i++) {
    for (let att = 0; att < 40; att++) {
      const p = { x: rng.int(0, gs), y: rng.int(0, gs) };
      if (!occupied.has(key(p))) { walls.push(p); occupied.add(key(p)); break; }
    }
  }

  // Forward simulation
  const snake = startSnake.map(p => ({ ...p }));
  const apples = [];
  const numApples = mechanics.apples ? Math.min(Math.ceil(difficulty / 3), 3) : 0;
  const appleAt = new Set();
  if (numApples > 0) {
    for (let i = 0; i < numApples; i++) {
      appleAt.add(rng.int(Math.floor(numMoves * 0.3), Math.floor(numMoves * 0.8)));
    }
  }

  let prevDir = null;
  for (let step = 0; step < numMoves; step++) {
    const head = snake[0];
    const valid = ALL_DIRS.filter(d => {
      const nx = wrap(head.x + d.x);
      const ny = wrap(head.y + d.y);
      if (walls.some(w => w.x === nx && w.y === ny)) return false;
      for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i].x === nx && snake[i].y === ny) return false;
      }
      return true;
    });
    if (valid.length === 0) break;

    // Prefer turns for interesting paths
    let pool = valid;
    if (prevDir && valid.length > 1) {
      const turns = valid.filter(d => d.x !== prevDir.x || d.y !== prevDir.y);
      if (turns.length > 0 && rng.next() < 0.55) pool = turns;
    }
    const dir = rng.pick(pool);
    prevDir = dir;

    const nx = wrap(head.x + dir.x);
    const ny = wrap(head.y + dir.y);

    const eating = appleAt.has(step);
    if (eating) apples.push({ x: nx, y: ny });

    snake.unshift({ x: nx, y: ny });
    if (!eating) snake.pop();
  }

  const targets = snake.map(p => ({ ...p }));

  // Place crates
  const crates = [];
  if (mechanics.crates) {
    const numCrates = Math.min(Math.floor(difficulty / 3), 3);
    for (let i = 0; i < numCrates; i++) {
      for (let att = 0; att < 40; att++) {
        const p = { x: rng.int(0, gs), y: rng.int(0, gs) };
        const k = key(p);
        if (!occupied.has(k) &&
            !targets.some(t => key(t) === k) &&
            !startSnake.some(s => key(s) === k) &&
            !apples.some(a => key(a) === k) &&
            !crates.some(c => key(c) === k)) {
          crates.push(p); break;
        }
      }
    }
  }

  // Place ice tiles
  const ice = [];
  if (mechanics.ice) {
    const numIce = Math.min(difficulty, 5);
    for (let i = 0; i < numIce; i++) {
      for (let att = 0; att < 40; att++) {
        const p = { x: rng.int(0, gs), y: rng.int(0, gs) };
        const k = key(p);
        if (!occupied.has(k) && !walls.some(w => key(w) === k) &&
            !crates.some(c => key(c) === k) && !ice.some(t => key(t) === k)) {
          ice.push(p); break;
        }
      }
    }
  }

  // Place portal pairs
  const portals = [];
  if (mechanics.portals) {
    const numPairs = Math.min(Math.floor(difficulty / 3), 2);
    for (let pair = 0; pair < numPairs; pair++) {
      const placed = [];
      for (let end = 0; end < 2; end++) {
        for (let att = 0; att < 40; att++) {
          const p = { x: rng.int(0, gs), y: rng.int(0, gs) };
          const k = key(p);
          if (!occupied.has(k) && !walls.some(w => key(w) === k) &&
              !crates.some(c => key(c) === k) && !ice.some(t => key(t) === k) &&
              !portals.some(pp => key(pp) === k)) {
            portals.push({ ...p, pair });
            occupied.add(k);
            placed.push(p);
            break;
          }
        }
      }
    }
  }

  return {
    gridSize: gs,
    snake: startSnake,
    targets,
    apples,
    walls,
    crates,
    ice,
    portals,
    solution: [],
  };
}

// ── tiny fallback if generation repeatedly fails ──────────────────

function fallbackLevel(gs, snakeLen) {
  const mid = Math.floor(gs / 2);
  const snake = [];
  const targets = [];
  for (let i = 0; i < snakeLen; i++) {
    snake.push({ x: mid - i, y: mid });
    targets.push({ x: mid + i, y: mid });
  }
  return { gridSize: gs, snake, targets, apples: [], walls: [], crates: [], ice: [], portals: [], solution: [] };
}

// ── helpers ───────────────────────────────────────────────────────

function key(p) { return `${p.x},${p.y}`; }
