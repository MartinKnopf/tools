/**
 * localStorage utilities for managing drawings
 *
 * Two-tier storage schema:
 * - localdraw:drawings → array of metadata { id, name, createdAt, updatedAt }
 * - localdraw:drawing:<id> → scene data { elements, appState, files }
 */

const DRAWINGS_KEY = 'localdraw:drawings';

/**
 * Get prefix for drawing data key
 * @param {string} id - Drawing ID
 * @returns {string} Storage key
 */
function getDrawingKey(id) {
  return `localdraw:drawing:${id}`;
}

/**
 * Get list of all drawing metadata
 * @returns {Array<{id: string, name: string, createdAt: number, updatedAt: number}>}
 */
export function getDrawingList() {
  const json = localStorage.getItem(DRAWINGS_KEY);
  return json ? JSON.parse(json) : [];
}

/**
 * Get scene data for a specific drawing
 * @param {string} id - Drawing ID
 * @returns {{elements: Array, appState: object, files: object} | null}
 */
export function getDrawingData(id) {
  const json = localStorage.getItem(getDrawingKey(id));
  return json ? JSON.parse(json) : null;
}

/**
 * Create a new drawing
 * @param {string} name - Drawing name
 * @returns {{id: string, name: string, createdAt: number, updatedAt: number}}
 */
export function createDrawing(name) {
  const drawings = getDrawingList();
  const now = Date.now();
  const newDrawing = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
  };

  drawings.push(newDrawing);
  localStorage.setItem(DRAWINGS_KEY, JSON.stringify(drawings));

  // Initialize empty scene data with dark mode default
  localStorage.setItem(
    getDrawingKey(newDrawing.id),
    JSON.stringify({
      elements: [],
      appState: {
        theme: 'dark',
        viewBackgroundColor: '#121212'
      },
      files: {}
    })
  );

  return newDrawing;
}

/**
 * Save scene data for a drawing
 * @param {string} id - Drawing ID
 * @param {{elements: Array, appState: object, files: object}} sceneData
 */
export function saveDrawingData(id, sceneData) {
  const drawings = getDrawingList();
  const drawing = drawings.find(d => d.id === id);

  if (drawing) {
    drawing.updatedAt = Date.now();
    localStorage.setItem(DRAWINGS_KEY, JSON.stringify(drawings));
  }

  // Only persist safe appState fields
  const safeAppState = {
    viewBackgroundColor: sceneData.appState?.viewBackgroundColor,
    theme: sceneData.appState?.theme,
    zoom: sceneData.appState?.zoom,
    scrollX: sceneData.appState?.scrollX,
    scrollY: sceneData.appState?.scrollY,
  };

  localStorage.setItem(
    getDrawingKey(id),
    JSON.stringify({
      elements: sceneData.elements,
      appState: safeAppState,
      files: sceneData.files || {},
    })
  );
}

/**
 * Rename a drawing
 * @param {string} id - Drawing ID
 * @param {string} newName - New name
 */
export function renameDrawing(id, newName) {
  const drawings = getDrawingList();
  const drawing = drawings.find(d => d.id === id);

  if (drawing) {
    drawing.name = newName;
    drawing.updatedAt = Date.now();
    localStorage.setItem(DRAWINGS_KEY, JSON.stringify(drawings));
  }
}

/**
 * Delete a drawing
 * @param {string} id - Drawing ID
 */
export function deleteDrawing(id) {
  const drawings = getDrawingList();
  const filtered = drawings.filter(d => d.id !== id);

  localStorage.setItem(DRAWINGS_KEY, JSON.stringify(filtered));
  localStorage.removeItem(getDrawingKey(id));
}
