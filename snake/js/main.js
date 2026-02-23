/**
 * main.js — Application controller.
 *
 * Manages screen transitions (menu → game → win / game-over),
 * wires up input, renderer and game state, and persists progress
 * in localStorage.
 */

import { Game }       from './game.js';
import { Renderer }   from './renderer.js';
import { Input }      from './input.js';
import {
  generateCampaignLevel,
  generateCustomLevel,
  themeForLevel,
  THEMES,
} from './levels.js';

// ── localStorage keys (namespaced) ────────────────────────────────

const LS_HIGHEST = 'snake_highestLevel';
const LS_BEST    = 'snake_best_';

// ── state ─────────────────────────────────────────────────────────

let game      = null;
let renderer  = null;
let input     = null;
let currentLevel = 1;
let isCustom     = false;       // true when playing a generated level

// ── DOM references ────────────────────────────────────────────────

const canvas          = document.getElementById('gameCanvas');
const hud             = document.getElementById('hud');
const hudInfo         = document.getElementById('hudInfo');
const bottomBar       = document.getElementById('bottomBar');
const menuScreen      = document.getElementById('menuScreen');
const generatorScreen = document.getElementById('generatorScreen');
const winOverlay      = document.getElementById('winOverlay');
const winTitle        = document.getElementById('winTitle');
const winMoves        = document.getElementById('winMoves');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const levelNumEl      = document.getElementById('levelNum');

// ── initialisation ────────────────────────────────────────────────

function init() {
  renderer = new Renderer(canvas);
  input    = new Input(canvas, handleMove);
  input.setEnabled(false);

  // Load progress
  currentLevel = parseInt(localStorage.getItem(LS_HIGHEST), 10) || 1;
  updateMenuLevel();

  // Draw a static background while on menu
  renderer.bgColor = themeForLevel(currentLevel);
  requestAnimationFrame(function loop(ts) {
    if (game) {
      renderer.draw(game, ts);
    } else {
      // Idle background
      const ctx = renderer.ctx;
      renderer.resize();
      ctx.fillStyle = renderer.bgColor;
      ctx.fillRect(0, 0, renderer.screenW, renderer.screenH);
      renderer.drawParticles(ctx);
      renderer.updateParticles(0.016);
    }
    requestAnimationFrame(loop);
  });

  bindUI();
}

// ── UI wiring ─────────────────────────────────────────────────────

function bindUI() {
  // Menu
  document.getElementById('btnPlay').addEventListener('click', () => startLevel(currentLevel));
  document.getElementById('btnPrevLevel').addEventListener('click', () => changeLevel(-1));
  document.getElementById('btnNextLevel').addEventListener('click', () => changeLevel(1));
  document.getElementById('btnGenerator').addEventListener('click', showGenerator);

  // HUD
  document.getElementById('btnBack').addEventListener('click', showMenu);
  document.getElementById('btnUndo').addEventListener('click', handleUndo);
  document.getElementById('btnRestart').addEventListener('click', handleRestart);

  // Win
  document.getElementById('btnNextLevel2').addEventListener('click', () => {
    if (isCustom) { showMenu(); return; }
    currentLevel++;
    startLevel(currentLevel);
  });
  document.getElementById('btnWinMenu').addEventListener('click', showMenu);

  // Game over
  document.getElementById('btnRetry').addEventListener('click', handleRestart);
  document.getElementById('btnGOMenu').addEventListener('click', showMenu);

  // Generator
  document.getElementById('btnGenPlay').addEventListener('click', playCustom);
  document.getElementById('btnGenBack').addEventListener('click', showMenu);

  // Mechanic toggles
  document.querySelectorAll('.toggle[data-mechanic]').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
}

// ── screen transitions ────────────────────────────────────────────

function showMenu() {
  game = null;
  input.setEnabled(false);
  menuScreen.classList.remove('hidden');
  generatorScreen.classList.add('hidden');
  winOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  hud.style.display = 'none';
  bottomBar.style.display = 'none';
  renderer.bgColor = themeForLevel(currentLevel);
  updateMenuLevel();
}

function showGenerator() {
  menuScreen.classList.add('hidden');
  generatorScreen.classList.remove('hidden');
}

function showGame() {
  menuScreen.classList.add('hidden');
  generatorScreen.classList.add('hidden');
  winOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  hud.style.display = '';
  bottomBar.style.display = '';
  input.setEnabled(true);
  updateHud();
}

// ── level management ──────────────────────────────────────────────

function changeLevel(delta) {
  const highest = parseInt(localStorage.getItem(LS_HIGHEST), 10) || 1;
  currentLevel = Math.max(1, Math.min(highest, currentLevel + delta));
  updateMenuLevel();
  renderer.bgColor = themeForLevel(currentLevel);
}

function updateMenuLevel() {
  levelNumEl.textContent = currentLevel;
}

function updateHud() {
  if (!game) return;
  const label = isCustom ? 'Custom' : `Level ${currentLevel}`;
  hudInfo.textContent = `${label} · ${game.moves} moves`;
}

// ── starting a level ──────────────────────────────────────────────

function startLevel(num) {
  isCustom = false;
  const level = generateCampaignLevel(num);
  game = new Game(level);
  renderer.bgColor = themeForLevel(num);
  renderer.moveAnim = null;
  renderer.particles = [];
  renderer.pulses = [];
  renderer.shake = 0;
  showGame();
}

function playCustom() {
  isCustom = true;
  const seed      = document.getElementById('genSeed').value || 'default';
  const gridSize  = parseInt(document.getElementById('genGridSize').value, 10);
  const difficulty = parseInt(document.getElementById('genDifficulty').value, 10);
  const mechanics = {
    apples:  document.querySelector('[data-mechanic="apples"]').classList.contains('active'),
    crates:  document.querySelector('[data-mechanic="crates"]').classList.contains('active'),
    ice:     document.querySelector('[data-mechanic="ice"]').classList.contains('active'),
    portals: document.querySelector('[data-mechanic="portals"]').classList.contains('active'),
  };

  const level = generateCustomLevel({ seed, gridSize, difficulty, mechanics });
  game = new Game(level);
  renderer.bgColor = THEMES[Math.abs(hashStr(seed)) % THEMES.length];
  renderer.moveAnim = null;
  renderer.particles = [];
  renderer.pulses = [];
  showGame();
}

// ── gameplay ──────────────────────────────────────────────────────

function handleMove(dir) {
  if (!game || game.won || game.gameOver) return;
  if (renderer.animating) return; // wait for current animation

  const prevSnake = game.snake.map(p => ({ ...p }));
  const result = game.move(dir);
  if (!result) return;

  // Animate
  renderer.animateMove(prevSnake, game.snake, result);
  updateHud();

  // Spawn target-landing pulses
  for (const seg of game.snake) {
    if (game.targets.some(t => t.x === seg.x && t.y === seg.y)) {
      renderer.addPulse(seg.x, seg.y);
    }
  }

  // Apple eat particles
  if (result.ateApple) {
    const head = game.snake[0];
    const wx = renderer.offsetX + head.x * renderer.cellSize + renderer.cellSize / 2;
    const wy = renderer.offsetY + head.y * renderer.cellSize + renderer.cellSize / 2;
    renderer.spawnParticles(wx, wy, '#FF6B6B', 10);
  }

  // Ice sliding — chain additional moves after animation
  if (result.onIce && !result.won && !result.gameOver) {
    setTimeout(() => handleMove(dir), 140);
    return;
  }

  // Win
  if (result.won) {
    input.setEnabled(false);
    setTimeout(() => {
      renderer.spawnWinParticles();
      winTitle.textContent = isCustom ? 'Puzzle Solved!' : `Level ${currentLevel} Complete!`;
      winMoves.textContent = `Solved in ${game.moves} moves`;
      winOverlay.classList.remove('hidden');

      // Persist progress
      if (!isCustom) {
        const best = parseInt(localStorage.getItem(LS_BEST + currentLevel), 10) || Infinity;
        if (game.moves < best) localStorage.setItem(LS_BEST + currentLevel, game.moves);
        const highest = parseInt(localStorage.getItem(LS_HIGHEST), 10) || 1;
        if (currentLevel >= highest) localStorage.setItem(LS_HIGHEST, currentLevel + 1);
      }
    }, 350);
    return;
  }

  // Game over
  if (result.gameOver) {
    input.setEnabled(false);
    renderer.triggerShake(400);
    setTimeout(() => {
      gameOverOverlay.classList.remove('hidden');
    }, 500);
  }
}

function handleUndo() {
  if (!game) return;
  if (game.gameOver) {
    // On game over, undo restores previous state
    gameOverOverlay.classList.add('hidden');
    input.setEnabled(true);
  }
  const prevSnake = game.snake.map(p => ({ ...p }));
  if (game.undo()) {
    renderer.animateMove(prevSnake, game.snake, {});
    updateHud();
  }
}

function handleRestart() {
  if (!game) return;
  gameOverOverlay.classList.add('hidden');
  winOverlay.classList.add('hidden');
  game.restart();
  renderer.moveAnim = null;
  input.setEnabled(true);
  updateHud();
}

// ── utility ───────────────────────────────────────────────────────

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

// ── boot ──────────────────────────────────────────────────────────

init();
