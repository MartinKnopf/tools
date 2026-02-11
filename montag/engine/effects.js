// Central effects registry - all UI effects register here and can be toggled at runtime

const STORAGE_KEY = 'montag_effects';
const effects = {};
let enabledEffects = {};

// Register an effect with enable/disable functions
export function registerEffect(name, { enable, disable }) {
  effects[name] = { enable, disable };
}

// Toggle an effect on/off
export function toggleEffect(name) {
  if (!effects[name]) return;

  enabledEffects[name] = !enabledEffects[name];

  if (enabledEffects[name]) {
    effects[name].enable();
  } else {
    effects[name].disable();
  }

  saveEffects();
}

// Check if an effect is enabled
export function isEffectEnabled(name) {
  return enabledEffects[name] !== false;
}

// Get all registered effects and their states
export function getAllEffects() {
  const result = {};
  for (const name in effects) {
    result[name] = enabledEffects[name] !== false;
  }
  return result;
}

// Persist effect state to localStorage
function saveEffects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledEffects));
}

// Load persisted state and enable all effects by default
export function initEffects() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      enabledEffects = JSON.parse(saved);
    } catch (e) {
      enabledEffects = {};
    }
  }

  // Enable all registered effects that aren't explicitly disabled
  for (const name in effects) {
    if (enabledEffects[name] !== false) {
      enabledEffects[name] = true;
      effects[name].enable();
    }
  }
}
