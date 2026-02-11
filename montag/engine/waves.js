// Wave engine and task registry

import { gameState, saveState } from './state.js';
import { closeAllWindows, showOverlay, updateWaveDisplay } from './ui.js';

// Task registry (tasks self-register by calling registerTask)
const taskRegistry = {};

// Register a task
export function registerTask(name, taskDef) {
  taskRegistry[name] = taskDef;
}

// Set active task
export function setActiveTask(name) {
  if (!taskRegistry[name]) {
    throw new Error(`Task "${name}" not found in registry`);
  }
  gameState.activeTask = name;
}

// Start a wave
export function startWave(waveNumber) {
  gameState.wave = waveNumber;
  saveState();

  const task = taskRegistry[gameState.activeTask];
  if (!task) {
    throw new Error(`No active task set`);
  }

  // Get wave config from task
  const config = task.getWaveConfig(waveNumber);

  // Get criteria text from task
  const criteriaText = task.getCriteriaText(config.criteria);

  // Show overlay
  showOverlay(config.wave, criteriaText, config.hint);

  // Spawn items after delay
  setTimeout(() => {
    updateWaveDisplay();
    task.spawnItems(config);
  }, 2500);
}

// Wave complete handler
export function onWaveComplete() {
  // Close all open windows
  closeAllWindows();

  // Show wave complete message
  showOverlay(gameState.wave, 'Wave Complete!', 'Next wave starting...');

  setTimeout(() => {
    startWave(gameState.wave + 1);
  }, 1500);
}
