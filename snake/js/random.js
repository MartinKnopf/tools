/**
 * random.js — Seeded pseudo-random number generator (Mulberry32).
 * Produces deterministic sequences from a numeric seed,
 * enabling reproducible procedural level generation.
 */

export class Random {
  constructor(seed) {
    this.state = seed | 0;
  }

  /** Return a float in [0, 1). */
  next() {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Return an integer in [min, max). */
  int(min, max) {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** Pick a random element from an array. */
  pick(arr) {
    return arr[this.int(0, arr.length)];
  }

  /** Fisher-Yates shuffle (returns new array). */
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

/** Hash a string seed into a 32-bit integer. */
export function hashSeed(str) {
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
  }
  return hash;
}
