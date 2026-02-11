// UI rendering and window management

import { gameState, FILE_SIZE, FOLDER_SIZE, PADDING } from './state.js';
import { clamp } from './utils.js';
import { createFolderIconCanvas, drawFolderIcon, drawFolderIconOpen } from './icons.js';
import { registerEffect, isEffectEnabled } from './effects.js';

const DESKTOP_PADDING = 20;

// Pluggable callback for drag-and-drop (set by task module)
let onDropCallback = null;
export function setOnDropCallback(fn) {
  onDropCallback = fn;
}

// ==================== SCORE ODOMETER ====================

let displayedScore = 0;
let odometerAnimating = false;

function animateOdometer() {
  if (displayedScore === gameState.score) {
    odometerAnimating = false;
    return;
  }

  odometerAnimating = true;
  const diff = gameState.score - displayedScore;
  const step = Math.max(1, Math.abs(Math.ceil(diff / 15)));

  if (diff > 0) {
    displayedScore = Math.min(displayedScore + step, gameState.score);
  } else {
    displayedScore = Math.max(displayedScore + Math.min(-1, -step), gameState.score);
  }

  document.getElementById('score-display').textContent = displayedScore;
  requestAnimationFrame(animateOdometer);
}

// Register score odometer effect
registerEffect('scoreOdometer', {
  enable() {},
  disable() {
    // Snap score instantly when disabled
    displayedScore = gameState.score;
    document.getElementById('score-display').textContent = displayedScore;
  }
});

// ==================== FILE SELECTION (MULTISELECT) ====================

const selectedFiles = new Set();
let lastSelectedFile = null; // For shift-click range selection

function clearFileSelection() {
  selectedFiles.forEach(el => el.classList.remove('selected'));
  selectedFiles.clear();
  lastSelectedFile = null;
}

function selectFile(fileEl, e) {
  const isMultiKey = e && (e.ctrlKey || e.metaKey);
  const isShift = e && e.shiftKey;

  if (isShift && lastSelectedFile) {
    // Range select: select all files between lastSelectedFile and fileEl
    const allFiles = Array.from(document.querySelectorAll('#desktop .file'));
    const startIdx = allFiles.indexOf(lastSelectedFile);
    const endIdx = allFiles.indexOf(fileEl);
    if (startIdx !== -1 && endIdx !== -1) {
      const from = Math.min(startIdx, endIdx);
      const to = Math.max(startIdx, endIdx);
      if (!isMultiKey) {
        // Clear previous selection unless Ctrl is also held
        clearFileSelection();
      }
      for (let i = from; i <= to; i++) {
        allFiles[i].classList.add('selected');
        selectedFiles.add(allFiles[i]);
      }
    }
  } else if (isMultiKey) {
    // Toggle individual file in selection
    if (selectedFiles.has(fileEl)) {
      fileEl.classList.remove('selected');
      selectedFiles.delete(fileEl);
    } else {
      fileEl.classList.add('selected');
      selectedFiles.add(fileEl);
    }
  } else {
    // Plain click: select only this file
    clearFileSelection();
    fileEl.classList.add('selected');
    selectedFiles.add(fileEl);
  }

  lastSelectedFile = fileEl;
}

// Select files intersecting a rectangle (used by selection rect)
function selectFilesInRect(rectLeft, rectTop, rectRight, rectBottom) {
  const desktop = document.getElementById('desktop');
  const dBounds = desktop.getBoundingClientRect();
  const files = desktop.querySelectorAll('.file');

  files.forEach(file => {
    const r = file.getBoundingClientRect();
    // Check overlap
    if (r.right >= rectLeft && r.left <= rectRight &&
        r.bottom >= rectTop && r.top <= rectBottom) {
      file.classList.add('selected');
      selectedFiles.add(file);
    } else {
      file.classList.remove('selected');
      selectedFiles.delete(file);
    }
  });
}

// Desktop click clears selection (but not after a selection-rect drag)
let suppressNextDesktopClick = false;

document.addEventListener('click', (e) => {
  if (!isEffectEnabled('fileSelection')) return;
  if (suppressNextDesktopClick) {
    suppressNextDesktopClick = false;
    return;
  }
  if (!e.target.closest('.file') && !e.target.closest('.selection-rect')) {
    clearFileSelection();
  }
});

registerEffect('fileSelection', {
  enable() {},
  disable() { clearFileSelection(); }
});

// ==================== CLICK FLASH ====================

function createClickFlash(x, y) {
  if (!isEffectEnabled('clickFlash')) return;
  const flash = document.createElement('div');
  flash.className = 'click-flash';
  flash.style.left = (x - 6) + 'px';
  flash.style.top = (y - 6) + 'px';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 150);
}

registerEffect('clickFlash', {
  enable() {},
  disable() {}
});

// ==================== SELECTION RECTANGLE ====================

let selectionRect = null;
let selRectStartX = 0;
let selRectStartY = 0;
let isDrawingSelRect = false;

function startSelectionRect(e) {
  if (!isEffectEnabled('selectionRect')) return;
  if (e.target.id !== 'desktop') return;

  selRectStartX = e.clientX;
  selRectStartY = e.clientY;
  isDrawingSelRect = true;

  // Clear selection unless holding Ctrl/Cmd
  if (!e.ctrlKey && !e.metaKey) {
    clearFileSelection();
  }
}

function updateSelectionRect(e) {
  if (!isDrawingSelRect) return;

  if (!selectionRect) {
    selectionRect = document.createElement('div');
    selectionRect.className = 'selection-rect';
    document.getElementById('desktop').appendChild(selectionRect);
  }

  const desktop = document.getElementById('desktop');
  const bounds = desktop.getBoundingClientRect();

  const x = Math.min(selRectStartX, e.clientX) - bounds.left;
  const y = Math.min(selRectStartY, e.clientY) - bounds.top;
  const w = Math.abs(e.clientX - selRectStartX);
  const h = Math.abs(e.clientY - selRectStartY);

  selectionRect.style.left = x + 'px';
  selectionRect.style.top = y + 'px';
  selectionRect.style.width = w + 'px';
  selectionRect.style.height = h + 'px';

  // Select files intersecting the rect
  if (isEffectEnabled('fileSelection')) {
    const rectLeft = Math.min(selRectStartX, e.clientX);
    const rectTop = Math.min(selRectStartY, e.clientY);
    const rectRight = Math.max(selRectStartX, e.clientX);
    const rectBottom = Math.max(selRectStartY, e.clientY);
    selectFilesInRect(rectLeft, rectTop, rectRight, rectBottom);
  }
}

function endSelectionRect() {
  if (selectionRect) {
    // Suppress the click event that follows mouseup so it doesn't clear the selection
    if (selectedFiles.size > 0) {
      suppressNextDesktopClick = true;
    }
    selectionRect.remove();
    selectionRect = null;
  }
  isDrawingSelRect = false;
}

document.addEventListener('mousedown', (e) => {
  if (e.target.id === 'desktop') startSelectionRect(e);
});
document.addEventListener('mousemove', updateSelectionRect);
document.addEventListener('mouseup', endSelectionRect);

registerEffect('selectionRect', {
  enable() {},
  disable() { endSelectionRect(); }
});

// ==================== FILE HOVER TOOLTIP ====================

let tooltipTimeout = null;
let activeTooltip = null;

// File type to fake properties mapping
const FILE_TYPE_PROPS = {
  image: { type: 'JPEG Image', sizeRange: [80, 2048] },
  document: { type: 'Word Document', sizeRange: [12, 512] },
  spreadsheet: { type: 'Excel Spreadsheet', sizeRange: [24, 1024] },
  music: { type: 'MP3 Audio', sizeRange: [1024, 8192] },
  video: { type: 'AVI Video', sizeRange: [4096, 65536] },
  presentation: { type: 'PowerPoint Presentation', sizeRange: [256, 4096] },
  executable: { type: 'Application', sizeRange: [512, 16384] },
  archive: { type: 'ZIP Archive', sizeRange: [256, 32768] },
  email: { type: 'Outlook Message', sizeRange: [4, 256] },
  pdf: { type: 'PDF Document', sizeRange: [64, 2048] }
};

function generateFakeDate() {
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const year = 1998 + Math.floor(Math.random() * 3);
  return month + '/' + day + '/' + year;
}

function showFileTooltip(fileEl, fileData) {
  if (!isEffectEnabled('fileTooltip')) return;
  const props = FILE_TYPE_PROPS[fileData.typeId] || { type: 'File', sizeRange: [10, 500] };
  const size = props.sizeRange[0] + Math.floor(Math.random() * (props.sizeRange[1] - props.sizeRange[0]));
  const sizeStr = size >= 1024 ? (size / 1024).toFixed(1) + ' MB' : size + ' KB';

  const tooltip = document.createElement('div');
  tooltip.className = 'file-tooltip';
  tooltip.textContent = 'Type: ' + props.type + '\nSize: ' + sizeStr + '\nModified: ' + generateFakeDate();
  tooltip.style.whiteSpace = 'pre';

  const rect = fileEl.getBoundingClientRect();
  const desktop = document.getElementById('desktop');
  const dBounds = desktop.getBoundingClientRect();
  tooltip.style.left = (rect.right - dBounds.left + 8) + 'px';
  tooltip.style.top = (rect.top - dBounds.top) + 'px';

  desktop.appendChild(tooltip);
  activeTooltip = tooltip;
}

function hideFileTooltip() {
  clearTimeout(tooltipTimeout);
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}

registerEffect('fileTooltip', {
  enable() {},
  disable() { hideFileTooltip(); }
});

// ==================== TASKBAR PROGRAM BUTTONS ====================

const windowButtonMap = new Map();

function addTaskbarButton(windowEl, title) {
  if (!isEffectEnabled('taskbarPrograms')) return;
  const container = document.getElementById('taskbar-programs');
  if (!container) return;

  const btn = document.createElement('button');
  btn.className = 'taskbar-program';
  btn.textContent = title || 'Window';
  btn.addEventListener('click', () => {
    windowEl.style.zIndex = gameState.nextZ++;
  });

  container.appendChild(btn);
  windowButtonMap.set(windowEl, btn);
}

function removeTaskbarButton(windowEl) {
  const btn = windowButtonMap.get(windowEl);
  if (btn) {
    btn.remove();
    windowButtonMap.delete(windowEl);
  }
}

registerEffect('taskbarPrograms', {
  enable() {},
  disable() {
    const container = document.getElementById('taskbar-programs');
    if (container) container.innerHTML = '';
    windowButtonMap.clear();
  }
});

// ==================== WINDOW CHROME ====================

registerEffect('windowChrome', {
  enable() {},
  disable() {}
});

// ==================== LAYOUT ====================

// Calculate grid layout for files based on screen size
export function calculateGridLayout(count) {
  const desktop = document.getElementById('desktop');
  const bounds = desktop.getBoundingClientRect();

  const fileWidth = 80;
  const fileHeight = 90;
  const minGap = 10;

  const isMobile = bounds.width < 768;
  const folderAreaHeight = isMobile ? 200 : 140;
  const usableWidth = bounds.width - (DESKTOP_PADDING * 2);
  const usableHeight = bounds.height - folderAreaHeight - (DESKTOP_PADDING * 2);

  const maxCols = Math.max(1, Math.floor((usableWidth + minGap) / (fileWidth + minGap)));
  const cols = isMobile ? Math.min(maxCols, Math.max(3, Math.ceil(Math.sqrt(count)))) : maxCols;
  const rows = Math.ceil(count / cols);

  const totalFileWidth = cols * fileWidth;
  const totalGapWidth = usableWidth - totalFileWidth;
  const gapX = Math.max(minGap, totalGapWidth / (cols + 1));

  const totalFileHeight = rows * fileHeight;
  const gapY = Math.min(20, Math.max(minGap, (usableHeight - totalFileHeight) / (rows + 1)));

  const positions = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = DESKTOP_PADDING + gapX + col * (fileWidth + gapX);
    const y = DESKTOP_PADDING + gapY + row * (fileHeight + gapY);
    positions.push({ x, y });
  }

  return positions;
}

// Generate positions for files using grid layout
export function generateFilePositions(count) {
  return calculateGridLayout(count);
}

// Position folders centered at bottom
export function positionFolders(folders) {
  const desktop = document.getElementById('desktop');
  const bounds = desktop.getBoundingClientRect();
  const folderWidth = 80;
  const isMobile = bounds.width < 768;

  const folderGap = isMobile ? 10 : 20;
  const totalWidth = folders.length * folderWidth + (folders.length - 1) * folderGap;

  if (isMobile && totalWidth > bounds.width - 20) {
    const foldersPerRow = Math.ceil(folders.length / 2);
    const rowWidth = foldersPerRow * folderWidth + (foldersPerRow - 1) * folderGap;

    folders.forEach((folder, i) => {
      const row = Math.floor(i / foldersPerRow);
      const col = i % foldersPerRow;
      const startX = (bounds.width - rowWidth) / 2;
      folder.style.left = (startX + col * (folderWidth + folderGap)) + 'px';
      folder.style.top = (bounds.height - 120 - row * 70) + 'px';
    });
  } else {
    const startX = Math.max(10, (bounds.width - totalWidth) / 2);
    const y = bounds.height - 120;

    folders.forEach((folder, i) => {
      folder.style.left = (startX + i * (folderWidth + folderGap)) + 'px';
      folder.style.top = y + 'px';
    });
  }
}

// Render a file on desktop (pluggable: task passes icon creator and preview handler)
export function renderFile(fileData, position, { createIconFn, onPreview }, index = 0) {
  const fileEl = document.createElement('div');
  fileEl.className = 'file';
  fileEl.id = fileData.id;
  fileEl.style.left = position.x + 'px';
  fileEl.style.top = position.y + 'px';
  fileEl.style.setProperty('--file-index', index);

  const icon = createIconFn(fileData);
  fileEl.appendChild(icon);

  const label = document.createElement('div');
  label.className = 'file-label';
  label.textContent = fileData.name;
  fileEl.appendChild(label);

  // Mouse drag events
  fileEl.addEventListener('mousedown', handleMouseDown);

  // Touch events for mobile
  fileEl.addEventListener('touchstart', handleTouchStart);
  fileEl.addEventListener('touchmove', handleTouchMove);
  fileEl.addEventListener('touchend', handleTouchEnd);

  // Double-click to preview
  fileEl.addEventListener('dblclick', () => onPreview(fileData));

  // Touch double-tap detection
  let lastTap = 0;
  fileEl.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
      onPreview(fileData);
    }
    lastTap = now;
  });

  // File hover tooltip
  fileEl.addEventListener('mouseenter', () => {
    tooltipTimeout = setTimeout(() => showFileTooltip(fileEl, fileData), 800);
  });
  fileEl.addEventListener('mouseleave', hideFileTooltip);
  fileEl.addEventListener('mousedown', hideFileTooltip);

  document.getElementById('desktop').appendChild(fileEl);
  return fileEl;
}

// Render a folder on desktop
export function renderFolder(folderName) {
  const folderEl = document.createElement('div');
  folderEl.className = 'folder';
  folderEl.dataset.folderName = folderName;

  const icon = createFolderIconCanvas();
  folderEl.appendChild(icon);

  const label = document.createElement('div');
  label.className = 'folder-label';
  label.textContent = folderName;
  folderEl.appendChild(label);

  // Mouse drag events
  folderEl.addEventListener('mousedown', handleMouseDown);

  // Touch events for mobile
  folderEl.addEventListener('touchstart', handleTouchStart);
  folderEl.addEventListener('touchmove', handleTouchMove);
  folderEl.addEventListener('touchend', handleTouchEnd);

  document.getElementById('desktop').appendChild(folderEl);
  return folderEl;
}

// Clear desktop (preserve desktop shortcuts)
export function clearDesktop() {
  const desktop = document.getElementById('desktop');
  const filesToRemove = desktop.querySelectorAll('.file, .folder');
  filesToRemove.forEach(el => el.remove());
  gameState.activeFiles = [];
  gameState.folders = [];
}

// Create window
export function createWindow(options) {
  const windowEl = document.createElement('div');
  windowEl.className = 'window';
  windowEl.style.left = (window.innerWidth / 2 - 200) + 'px';
  windowEl.style.top = (window.innerHeight / 2 - 150) + 'px';
  windowEl.style.zIndex = gameState.nextZ++;

  // Title bar
  const titleBar = document.createElement('div');
  titleBar.className = 'window-titlebar';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'window-title';

  if (options.icon) {
    titleDiv.appendChild(options.icon);
  }

  const titleText = document.createElement('span');
  titleText.textContent = options.title || 'Window';
  titleDiv.appendChild(titleText);

  // Window buttons container
  const buttonsDiv = document.createElement('div');
  buttonsDiv.className = 'window-buttons';

  // Minimize button (cosmetic with inset press)
  if (isEffectEnabled('windowChrome')) {
    const minBtn = document.createElement('div');
    minBtn.className = 'window-btn';
    minBtn.innerHTML = '_';
    minBtn.title = 'Minimize';
    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Cosmetic: flash inset style briefly
      minBtn.style.borderStyle = 'inset';
      setTimeout(() => { minBtn.style.borderStyle = ''; }, 150);
    });
    buttonsDiv.appendChild(minBtn);

    // Maximize button
    const maxBtn = document.createElement('div');
    maxBtn.className = 'window-btn';
    maxBtn.innerHTML = '&#9633;';
    maxBtn.title = 'Maximize';
    maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      windowEl.classList.toggle('maximized');
    });
    buttonsDiv.appendChild(maxBtn);
  }

  const closeBtn = document.createElement('div');
  closeBtn.className = 'window-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => closeWindow(windowEl));
  buttonsDiv.appendChild(closeBtn);

  titleBar.appendChild(titleDiv);
  titleBar.appendChild(buttonsDiv);

  // Menu bar (decorative)
  const menuBar = document.createElement('div');
  menuBar.className = 'window-menubar';
  menuBar.innerHTML = '<div class="window-menubar-item">File</div><div class="window-menubar-item">Edit</div><div class="window-menubar-item">View</div><div class="window-menubar-item">Help</div>';

  // Content
  const content = document.createElement('div');
  content.className = 'window-content';
  if (options.content) {
    if (typeof options.content === 'string') {
      content.innerHTML = options.content;
    } else {
      content.appendChild(options.content);
    }
  }

  // Status bar (decorative)
  const statusBar = document.createElement('div');
  statusBar.className = 'window-statusbar';
  statusBar.innerHTML = '<span>Ready</span><span>1 object(s)</span>';

  windowEl.appendChild(titleBar);
  windowEl.appendChild(menuBar);
  windowEl.appendChild(content);
  windowEl.appendChild(statusBar);

  // Resize grip
  if (isEffectEnabled('windowChrome')) {
    const grip = document.createElement('div');
    grip.className = 'window-resize-grip';
    windowEl.appendChild(grip);
    setupWindowResize(windowEl, grip);
  }

  document.getElementById('windows-container').appendChild(windowEl);

  // Setup dragging
  setupWindowDrag(windowEl, titleBar);

  // Bring to front
  bringToFront(windowEl);

  // Taskbar program button
  addTaskbarButton(windowEl, options.title || 'Window');

  return windowEl;
}

// Close window
export function closeWindow(windowEl) {
  removeTaskbarButton(windowEl);
  windowEl.remove();
}

// Close all open windows
export function closeAllWindows() {
  const container = document.getElementById('windows-container');
  container.innerHTML = '';
  // Clear taskbar program buttons
  windowButtonMap.clear();
  const programs = document.getElementById('taskbar-programs');
  if (programs) programs.innerHTML = '';
}

// Bring window to front
function bringToFront(windowEl) {
  windowEl.style.zIndex = gameState.nextZ++;
}

// Setup window dragging
function setupWindowDrag(windowEl, titleBar) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  titleBar.addEventListener('mousedown', (e) => {
    if (e.target.closest('.window-close') || e.target.closest('.window-btn')) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = windowEl.offsetLeft;
    initialTop = windowEl.offsetTop;
    bringToFront(windowEl);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    windowEl.style.left = (initialLeft + dx) + 'px';
    windowEl.style.top = (initialTop + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  titleBar.addEventListener('touchstart', (e) => {
    if (e.target.closest('.window-close') || e.target.closest('.window-btn')) return;

    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    initialLeft = windowEl.offsetLeft;
    initialTop = windowEl.offsetTop;
    bringToFront(windowEl);
    e.preventDefault();
  });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    windowEl.style.left = (initialLeft + dx) + 'px';
    windowEl.style.top = (initialTop + dy) + 'px';
  });

  document.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// Setup window resize via grip
function setupWindowResize(windowEl, grip) {
  let isResizing = false;
  let startX, startY, startW, startH;

  grip.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = windowEl.offsetWidth;
    startH = windowEl.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const w = Math.max(320, startW + (e.clientX - startX));
    const h = Math.max(200, startH + (e.clientY - startY));
    windowEl.style.width = w + 'px';
    windowEl.style.height = h + 'px';
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}

// UI update functions
export function updateScore() {
  if (isEffectEnabled('scoreOdometer')) {
    if (!odometerAnimating) {
      requestAnimationFrame(animateOdometer);
    }
  } else {
    displayedScore = gameState.score;
    document.getElementById('score-display').textContent = gameState.score;
  }

  // Trigger pop animation
  const scoreEl = document.getElementById('score-display');
  scoreEl.classList.remove('score-pop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('score-pop');
}

export function updateWaveDisplay() {
  document.getElementById('wave-display').textContent = gameState.wave;
}

export function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').innerHTML = hours + '<span class="blink-colon">:</span>' + minutes;
}

export function drawCoffeeCup() {
  const canvas = document.getElementById('coffee-cup');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 16, 20);

  // Cup
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(2, 8, 12, 11);
  ctx.fillStyle = '#654321';
  ctx.fillRect(3, 9, 10, 9);

  // Handle
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(14, 13, 2, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Coffee fill
  const fillHeight = Math.floor(gameState.time / (9 * 60 / 4) * 2);
  if (fillHeight > 0) {
    ctx.fillStyle = '#3d2817';
    ctx.fillRect(3, 18 - fillHeight, 10, fillHeight);
  }

  // Steam (if warm) - animated
  if (fillHeight >= 4) {
    const phase = Math.floor(Date.now() / 500) % 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      const offset = (phase + i) % 3 - 1;
      ctx.moveTo(5 + i * 4 + offset, 8);
      ctx.lineTo(6 + i * 4 + offset, 4);
      ctx.lineTo(5 + i * 4 + offset, 2);
      ctx.stroke();
    }
  }
}

// Show wave overlay
export function showOverlay(wave, criteriaText, hint) {
  const overlay = document.getElementById('wave-overlay');
  document.getElementById('wave-title').textContent = 'Wave ' + wave;
  document.getElementById('wave-criteria').textContent = criteriaText;

  const hintEl = document.getElementById('wave-hint');
  hintEl.innerHTML = (hint || '') + '<span class="blink-cursor">_</span>';

  document.body.classList.add('loading');
  overlay.classList.add('active');

  setTimeout(() => {
    overlay.classList.remove('active');
    document.body.classList.remove('loading');
  }, 2000);
}

// Reposition files using grid layout
export function repositionFiles() {
  const files = document.querySelectorAll('.file');
  if (files.length === 0) return;

  const positions = calculateGridLayout(files.length);
  files.forEach((file, i) => {
    if (positions[i]) {
      file.style.left = positions[i].x + 'px';
      file.style.top = positions[i].y + 'px';
    }
  });
}

// Debounce resize handler
let resizeTimeout;
export function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const folders = document.querySelectorAll('.folder');
    if (folders.length > 0) {
      positionFolders(Array.from(folders));
    }
    repositionFiles();
  }, 100);
}

// ==================== DRAG AND DROP ====================

// Mouse drag state
let draggedElement = null;
let isDraggingMouse = false;
let dragStartX, dragStartY;
let dragElementStartLeft, dragElementStartTop;
const DRAG_THRESHOLD = 5;

// Multi-drag: track start positions for all selected files being dragged together
let dragGroup = []; // [{ el, startLeft, startTop }]

function handleMouseDown(e) {
  if (e.target.closest('.window')) return;

  draggedElement = this;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragElementStartLeft = parseInt(this.style.left) || 0;
  dragElementStartTop = parseInt(this.style.top) || 0;
  isDraggingMouse = false;

  // File selection on click (pass event for Ctrl/Shift multiselect)
  if (isEffectEnabled('fileSelection') && this.classList.contains('file')) {
    // If clicking an already-selected file without modifier, don't deselect others yet
    // (the user might be about to drag the group)
    if (selectedFiles.has(this) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      // Keep current selection, will clear on mouseup if no drag occurred
    } else {
      selectFile(this, e);
    }
  }

  e.preventDefault();
}

function handleMouseMove(e) {
  if (!draggedElement) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  if (!isDraggingMouse && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    isDraggingMouse = true;

    // Build the drag group: the dragged element + any other selected files
    dragGroup = [];
    if (draggedElement.classList.contains('file') && selectedFiles.has(draggedElement) && selectedFiles.size > 1) {
      selectedFiles.forEach(el => {
        el.classList.add('dragging');
        dragGroup.push({
          el,
          startLeft: parseInt(el.style.left) || 0,
          startTop: parseInt(el.style.top) || 0
        });
      });
    } else {
      draggedElement.classList.add('dragging');
      dragGroup = [{
        el: draggedElement,
        startLeft: dragElementStartLeft,
        startTop: dragElementStartTop
      }];
    }

    createClickFlash(dragStartX, dragStartY);
  }

  if (isDraggingMouse) {
    const desktop = document.getElementById('desktop');
    const bounds = desktop.getBoundingClientRect();

    // Move all elements in the drag group
    dragGroup.forEach(({ el, startLeft, startTop }) => {
      const newLeft = clamp(startLeft + dx, 0, bounds.width - 80);
      const newTop = clamp(startTop + dy, 0, bounds.height - 90);
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    });

    // Highlight folders when dragging files over them (use the primary dragged element)
    if (draggedElement.classList.contains('file')) {
      const folders = document.querySelectorAll('.folder');
      folders.forEach(folder => {
        const rect = folder.getBoundingClientRect();
        const elemRect = draggedElement.getBoundingClientRect();
        const centerX = elemRect.left + elemRect.width / 2;
        const centerY = elemRect.top + elemRect.height / 2;

        if (centerX >= rect.left && centerX <= rect.right &&
            centerY >= rect.top && centerY <= rect.bottom) {
          folder.classList.add('hover');
          swapFolderIcon(folder, true);
        } else {
          folder.classList.remove('hover');
          swapFolderIcon(folder, false);
        }
      });
    }
  }
}

function handleMouseUp(e) {
  if (!draggedElement) return;

  if (isDraggingMouse) {
    if (draggedElement.classList.contains('file')) {
      const folders = document.querySelectorAll('.folder');
      let targetFolder = null;

      const elemRect = draggedElement.getBoundingClientRect();
      const centerX = elemRect.left + elemRect.width / 2;
      const centerY = elemRect.top + elemRect.height / 2;

      folders.forEach(folder => {
        const rect = folder.getBoundingClientRect();
        if (centerX >= rect.left && centerX <= rect.right &&
            centerY >= rect.top && centerY <= rect.bottom) {
          targetFolder = folder;
        }
        folder.classList.remove('hover');
      });

      // Drop all files in drag group onto the folder
      if (targetFolder && onDropCallback) {
        const folderName = targetFolder.dataset.folderName;
        const ids = dragGroup.filter(g => g.el.classList.contains('file')).map(g => g.el.id);
        ids.forEach(id => onDropCallback(id, folderName));
      }
    }

    dragGroup.forEach(({ el }) => el.classList.remove('dragging'));
  } else {
    // No drag happened — if we clicked an already-selected file without modifier,
    // now narrow selection to just that file
    if (isEffectEnabled('fileSelection') && draggedElement.classList.contains('file')) {
      if (selectedFiles.has(draggedElement) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        clearFileSelection();
        draggedElement.classList.add('selected');
        selectedFiles.add(draggedElement);
        lastSelectedFile = draggedElement;
      }
    }
  }

  draggedElement = null;
  isDraggingMouse = false;
  dragGroup = [];
}

document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);

// Touch drag support
let touchElement = null;
let isDraggingTouch = false;
let touchStartX, touchStartY;
let touchElementStartLeft, touchElementStartTop;
let touchDragGroup = []; // multi-drag for touch

function handleTouchStart(e) {
  if (e.target.closest('.window')) return;

  const touch = e.touches[0];
  touchElement = this;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchElementStartLeft = parseInt(this.style.left) || 0;
  touchElementStartTop = parseInt(this.style.top) || 0;
  isDraggingTouch = false;
}

function handleTouchMove(e) {
  if (!touchElement) return;

  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (!isDraggingTouch && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    isDraggingTouch = true;
    e.preventDefault();

    // Build touch drag group
    if (touchElement.classList.contains('file') && selectedFiles.has(touchElement) && selectedFiles.size > 1) {
      touchDragGroup = [];
      selectedFiles.forEach(el => {
        el.classList.add('dragging');
        touchDragGroup.push({
          el,
          startLeft: parseInt(el.style.left) || 0,
          startTop: parseInt(el.style.top) || 0
        });
      });
    } else {
      touchElement.classList.add('dragging');
      touchDragGroup = [{
        el: touchElement,
        startLeft: touchElementStartLeft,
        startTop: touchElementStartTop
      }];
    }
  }

  if (isDraggingTouch) {
    e.preventDefault();

    const desktop = document.getElementById('desktop');
    const bounds = desktop.getBoundingClientRect();

    // Move all elements in touch drag group
    touchDragGroup.forEach(({ el, startLeft, startTop }) => {
      const newLeft = clamp(startLeft + dx, 0, bounds.width - 80);
      const newTop = clamp(startTop + dy, 0, bounds.height - 90);
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    });

    if (touchElement.classList.contains('file')) {
      const folders = document.querySelectorAll('.folder');
      folders.forEach(folder => {
        const rect = folder.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          folder.classList.add('hover');
          swapFolderIcon(folder, true);
        } else {
          folder.classList.remove('hover');
          swapFolderIcon(folder, false);
        }
      });
    }
  }
}

function handleTouchEnd(e) {
  if (!isDraggingTouch) {
    touchElement = null;
    return;
  }

  e.preventDefault();

  const touch = e.changedTouches[0];

  if (touchElement.classList.contains('file')) {
    const folders = document.querySelectorAll('.folder');
    let targetFolder = null;

    folders.forEach(folder => {
      const rect = folder.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        targetFolder = folder;
      }
      folder.classList.remove('hover');
    });

    // Drop all files in touch drag group onto the folder
    if (targetFolder && onDropCallback) {
      const folderName = targetFolder.dataset.folderName;
      const ids = touchDragGroup.filter(g => g.el.classList.contains('file')).map(g => g.el.id);
      ids.forEach(id => onDropCallback(id, folderName));
    }
  }

  touchDragGroup.forEach(({ el }) => el.classList.remove('dragging'));
  touchElement = null;
  isDraggingTouch = false;
  touchDragGroup = [];
}

// Swap folder icon between closed and open states
function swapFolderIcon(folderEl, isOpen) {
  const canvas = folderEl.querySelector('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isOpen) {
    drawFolderIconOpen(ctx);
  } else {
    drawFolderIcon(ctx);
  }
}

// Create desktop shortcut
export function createDesktopShortcut(options) {
  const shortcut = document.createElement('div');
  shortcut.className = 'desktop-shortcut';
  shortcut.style.top = options.top || '20px';
  shortcut.style.right = options.right || '20px';

  if (options.icon) {
    shortcut.appendChild(options.icon);
  }

  const label = document.createElement('div');
  label.className = 'desktop-shortcut-label';
  label.textContent = options.label || '';
  shortcut.appendChild(label);

  if (options.onDblClick) {
    shortcut.addEventListener('dblclick', options.onDblClick);

    let lastTap = 0;
    shortcut.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
        options.onDblClick();
      }
      lastTap = now;
    });
  }

  document.getElementById('desktop').appendChild(shortcut);
  return shortcut;
}
