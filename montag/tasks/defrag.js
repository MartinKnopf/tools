// Disk Defragmenter task - sliding puzzle mini-game
// Win98 Disk Defragmenter aesthetic: sort colored blocks on a grid

import { gameState, saveState } from '../engine/state.js';
import { registerEffect, isEffectEnabled } from '../engine/effects.js';
import { clearDesktop, createWindow, updateScore } from '../engine/ui.js';
import { registerTask, onWaveComplete } from '../engine/waves.js';

// ==================== EFFECTS (LOCAL COPIES) ====================

function createParticleBurst(x, y) {
  const colors = ['#ffd700', '#32cd32', '#ffffff', '#ffff00'];
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const angle = (i / 8) * Math.PI * 2;
    const distance = 40 + Math.random() * 20;
    particle.style.setProperty('--px', Math.cos(angle) * distance + 'px');
    particle.style.setProperty('--py', Math.sin(angle) * distance + 'px');
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

function screenShake() {
  document.body.classList.add('screen-shake');
  setTimeout(() => document.body.classList.remove('screen-shake'), 300);
}

function triggerCRTFlicker() {
  if (!isEffectEnabled('crtFlicker')) return;
  document.body.classList.add('crt-flicker');
  setTimeout(() => document.body.classList.remove('crt-flicker'), 100);
}

// ==================== DEFRAG ICON ====================

function drawDefragIcon(ctx) {
  // 16x16 pixel art: grid of colored blocks representing disk fragments
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 16, 16);

  // Draw a small grid of colored blocks
  const colors = ['#0000ff', '#0080ff', '#00c0ff', '#00ff80', '#00ff00', '#80ff00'];
  let ci = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (row === 3 && col === 3) {
        // Empty cell
        ctx.fillStyle = '#202020';
      } else {
        ctx.fillStyle = colors[ci % colors.length];
        ci++;
      }
      ctx.fillRect(col * 4, row * 4, 3, 3);
    }
  }
}

function createDefragIconCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  drawDefragIcon(canvas.getContext('2d'));
  return canvas;
}

// ==================== WAVE CONFIGURATIONS ====================

const WAVE_CONFIGS = [
  { wave: 1, gridSize: 3, shuffleMoves: 20, hint: 'Slide blocks to sort them in order' },
  { wave: 2, gridSize: 3, shuffleMoves: 50, hint: 'Click a block next to the empty space' },
  { wave: 3, gridSize: 4, shuffleMoves: 20, hint: 'Bigger drive — more fragments' },
  { wave: 4, gridSize: 4, shuffleMoves: 50, hint: 'Plan your moves carefully' },
  { wave: 5, gridSize: 4, shuffleMoves: 100, hint: 'Fewer moves = higher score' },
  { wave: 6, gridSize: 5, shuffleMoves: 20, hint: 'Full defrag on a large drive' },
  { wave: 7, gridSize: 5, shuffleMoves: 50, hint: 'Getting harder now...' },
  { wave: 8, gridSize: 5, shuffleMoves: 100, hint: 'Only experts can defrag this fast' }
];

function getWaveConfig(waveNumber) {
  if (waveNumber <= WAVE_CONFIGS.length) {
    return WAVE_CONFIGS[waveNumber - 1];
  }
  // Procedural waves beyond 8
  return {
    wave: waveNumber,
    gridSize: 5,
    shuffleMoves: 100 + (waveNumber - 8) * 20,
    hint: 'Deep defragmentation in progress...'
  };
}

// ==================== PUZZLE LOGIC ====================

// Generate solved board: [1, 2, 3, ..., n*n-1, 0] where 0 is the empty cell
function createSolvedBoard(size) {
  const board = [];
  for (let i = 1; i < size * size; i++) {
    board.push(i);
  }
  board.push(0);
  return board;
}

// Shuffle by applying random valid moves (guarantees solvability)
function shuffleBoard(board, size, moves) {
  let emptyIdx = board.indexOf(0);
  let lastMove = -1; // Avoid undoing the previous move

  for (let i = 0; i < moves; i++) {
    const neighbors = getNeighbors(emptyIdx, size);
    // Filter out the last-moved position to avoid back-and-forth
    const candidates = neighbors.filter(n => n !== lastMove);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];

    lastMove = emptyIdx;
    board[emptyIdx] = board[pick];
    board[pick] = 0;
    emptyIdx = pick;
  }

  return board;
}

// Get valid neighbor indices for a position in the grid
function getNeighbors(idx, size) {
  const row = Math.floor(idx / size);
  const col = idx % size;
  const neighbors = [];
  if (row > 0) neighbors.push(idx - size);       // up
  if (row < size - 1) neighbors.push(idx + size); // down
  if (col > 0) neighbors.push(idx - 1);           // left
  if (col < size - 1) neighbors.push(idx + 1);    // right
  return neighbors;
}

// Check if the board is solved
function isSolved(board, size) {
  for (let i = 0; i < size * size - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[size * size - 1] === 0;
}

// Count how many blocks are in their correct position
function countCorrect(board, size) {
  let count = 0;
  for (let i = 0; i < size * size - 1; i++) {
    if (board[i] === i + 1) count++;
  }
  return count;
}

// ==================== BLOCK COLORS ====================

// Generate a color gradient from blue to green for block numbers
function getBlockColor(number, total) {
  const t = (number - 1) / Math.max(1, total - 1);
  // Blue (210°) to Green (120°) in HSL
  const hue = 210 - t * 90;
  const sat = 70 + t * 10;
  const lit = 45 + t * 10;
  return 'hsl(' + hue + ', ' + sat + '%, ' + lit + '%)';
}

// ==================== GAME STATE ====================

let defragWindowEl = null;
let currentBoard = [];
let currentSize = 0;
let moveCount = 0;
let shuffleMovesUsed = 0;
let gridContainer = null;
let moveCountEl = null;
let progressBarEl = null;
let statusTextEl = null;

// ==================== BUILD DEFRAG WINDOW ====================

function createDefragWindow(board, size, config) {
  const icon = createDefragIconCanvas();
  icon.width = 16;
  icon.height = 16;

  currentBoard = board;
  currentSize = size;
  moveCount = 0;
  shuffleMovesUsed = config.shuffleMoves;

  const container = document.createElement('div');
  container.className = 'defrag-container';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'defrag-toolbar';
  toolbar.innerHTML =
    '<span class="defrag-toolbar-label">Drive C: — Defragmenting...</span>' +
    '<span class="defrag-move-count">Moves: <strong id="defrag-moves">0</strong></span>';
  container.appendChild(toolbar);

  // Grid
  gridContainer = document.createElement('div');
  gridContainer.className = 'defrag-grid';
  gridContainer.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
  gridContainer.style.gridTemplateRows = 'repeat(' + size + ', 1fr)';
  container.appendChild(gridContainer);

  // Progress area
  const progressArea = document.createElement('div');
  progressArea.className = 'defrag-progress-area';

  statusTextEl = document.createElement('div');
  statusTextEl.className = 'defrag-status-text';
  progressArea.appendChild(statusTextEl);

  const progressTrack = document.createElement('div');
  progressTrack.className = 'defrag-progress-track';
  progressBarEl = document.createElement('div');
  progressBarEl.className = 'defrag-progress-bar';
  progressTrack.appendChild(progressBarEl);
  progressArea.appendChild(progressTrack);

  container.appendChild(progressArea);

  // Create the window
  defragWindowEl = createWindow({
    title: 'Disk Defragmenter',
    icon: icon,
    content: container
  });

  // Size and center the window
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;
  if (isMobile) {
    defragWindowEl.classList.add('maximized');
  } else {
    const ww = Math.min(480, vw - 40);
    const wh = Math.min(520, vh - 100);
    defragWindowEl.style.width = ww + 'px';
    defragWindowEl.style.height = wh + 'px';
    defragWindowEl.style.left = ((vw - ww) / 2) + 'px';
    defragWindowEl.style.top = ((vh - 40 - wh) / 2) + 'px';
  }

  // Style the window content
  const contentEl = defragWindowEl.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.background = '#000';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';

  // Cache move counter element
  moveCountEl = defragWindowEl.querySelector('#defrag-moves');

  // Render the grid
  renderGrid();
  updateProgress();

  return defragWindowEl;
}

// ==================== GRID RENDERING ====================

function renderGrid() {
  gridContainer.innerHTML = '';
  const total = currentSize * currentSize - 1;

  for (let i = 0; i < currentBoard.length; i++) {
    const value = currentBoard[i];
    const cell = document.createElement('div');

    if (value === 0) {
      // Empty cell
      cell.className = 'defrag-cell defrag-cell-empty';
    } else {
      cell.className = 'defrag-cell';
      cell.textContent = value;
      cell.style.backgroundColor = getBlockColor(value, total);

      // Highlight correctly placed blocks
      if (value === i + 1) {
        cell.classList.add('defrag-cell-correct');
      }

      // Click/tap handler
      cell.addEventListener('click', () => handleCellClick(i));
      cell.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleCellClick(i);
      });
    }

    gridContainer.appendChild(cell);
  }
}

// ==================== CELL CLICK HANDLER ====================

function handleCellClick(clickedIdx) {
  const emptyIdx = currentBoard.indexOf(0);
  const neighbors = getNeighbors(emptyIdx, currentSize);

  // Only allow clicking blocks adjacent to the empty space
  if (!neighbors.includes(clickedIdx)) return;

  // Swap the clicked block with the empty space
  currentBoard[emptyIdx] = currentBoard[clickedIdx];
  currentBoard[clickedIdx] = 0;
  moveCount++;

  // Update UI
  if (moveCountEl) moveCountEl.textContent = moveCount;
  renderGrid();
  updateProgress();

  // Check for completion
  if (isSolved(currentBoard, currentSize)) {
    handlePuzzleComplete();
  }
}

// ==================== PROGRESS BAR ====================

function updateProgress() {
  const total = currentSize * currentSize - 1;
  const correct = countCorrect(currentBoard, currentSize);
  const pct = Math.round((correct / total) * 100);

  if (progressBarEl) {
    progressBarEl.style.width = pct + '%';
  }
  if (statusTextEl) {
    statusTextEl.textContent = pct + '% defragmented — ' + correct + '/' + total + ' clusters in place';
  }
}

// ==================== COMPLETION ====================

function handlePuzzleComplete() {
  // Calculate score
  const baseScore = 10 * gameState.wave;
  // Optimal moves is roughly the shuffle count (generous estimate)
  const optimalEstimate = Math.floor(shuffleMovesUsed * 0.6);
  const moveBonus = Math.max(0, (optimalEstimate - moveCount)) * gameState.wave;
  const totalScore = baseScore + moveBonus;

  gameState.score += totalScore;
  updateScore();

  // Effects
  if (defragWindowEl) {
    const rect = defragWindowEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    createParticleBurst(cx, cy);
    createParticleBurst(cx - 40, cy - 20);
    createParticleBurst(cx + 40, cy + 20);
  }
  screenShake();
  triggerCRTFlicker();

  // Update status
  if (statusTextEl) {
    statusTextEl.textContent = '100% defragmented! +' + totalScore + ' points (' + moveCount + ' moves)';
  }

  // Mark as complete after a short celebration delay
  setTimeout(() => {
    defragWindowEl = null;
    gridContainer = null;
    moveCountEl = null;
    progressBarEl = null;
    statusTextEl = null;
    onWaveComplete();
  }, 1200);
}

// ==================== TASK REGISTRATION ====================

registerTask('defrag', {
  getWaveConfig(waveNumber) {
    return getWaveConfig(waveNumber);
  },

  getCriteriaText(criteria) {
    return 'Defragment the drive — slide blocks into order';
  },

  spawnItems(config) {
    clearDesktop();

    const size = config.gridSize;
    const board = createSolvedBoard(size);
    shuffleBoard(board, size, config.shuffleMoves);

    // Store a dummy entry in activeFiles so the engine knows a task is active
    gameState.activeFiles.push({ id: 'defrag-puzzle', name: 'Disk Defragmenter' });

    createDefragWindow(board, size, config);
    saveState();
  }
});
