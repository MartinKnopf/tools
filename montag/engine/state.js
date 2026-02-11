// Constants
export const STORAGE_KEY = 'montag_state';
export const FILE_SIZE = 32;
export const FOLDER_SIZE = 48;
export const PADDING = 16;
export const GRID_GAP = 24;
export const ICON_SIZE = 32;
export const PIXEL_SIZE = 2;

// Game state (shared reference across all modules)
export const gameState = {
  score: 0,
  wave: 1,
  lastWave: 0,
  activeFiles: [],
  folders: [],
  nextZ: 100,
  time: 9 * 60,
  timerInterval: null,
  activeTask: null
};

// Save state to localStorage
export function saveState() {
  const saveData = {
    score: gameState.score,
    wave: gameState.wave,
    lastWave: gameState.lastWave,
    time: gameState.time
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
}

// Load state from localStorage
export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      gameState.score = data.score || 0;
      gameState.wave = data.wave || 1;
      gameState.lastWave = data.lastWave || 0;
      gameState.time = data.time !== undefined ? data.time : 9 * 60;
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }
}
