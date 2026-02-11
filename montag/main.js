// Main entry point - imports all modules and initializes the game

import { gameState, loadState, saveState } from './engine/state.js';
import { updateScore, updateWaveDisplay, updateClock, drawCoffeeCup, closeAllWindows, handleResize, createWindow, createDesktopShortcut } from './engine/ui.js';
import { setActiveTask, startWave } from './engine/waves.js';
import { drawVolumeIcon, drawVolumeIconMuted, drawNetworkIcon, drawShieldIcon, drawMyComputerIcon, drawRecycleBinIcon } from './engine/icons.js';
import { registerEffect, isEffectEnabled, initEffects, getAllEffects, toggleEffect } from './engine/effects.js';

// Import tasks (they self-register on import)
import './tasks/file-sort.js';

// ==================== CONTEXT MENU ====================

let activeContextMenu = null;

function removeContextMenu() {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
}

function showContextMenu(x, y) {
  removeContextMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  const items = [
    { label: 'Arrange Icons', action: () => {} },
    { label: 'Refresh', action: () => {
      document.body.classList.add('loading');
      setTimeout(() => document.body.classList.remove('loading'), 500);
    }},
    { separator: true },
    { label: 'Properties', action: () => {
      createWindow({
        title: 'Display Properties',
        content: '<div style="padding: 20px; text-align: center;"><strong>Display Properties</strong><br><br>Resolution: 1024x768<br>Color: 16-bit High Color<br>Refresh Rate: 60 Hz<br><br>Wallpaper: Teal.bmp</div>'
      });
    }}
  ];

  items.forEach(item => {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.className = 'context-menu-separator';
      menu.appendChild(sep);
    } else {
      const el = document.createElement('div');
      el.className = 'context-menu-item';
      el.textContent = item.label;
      el.addEventListener('click', () => {
        removeContextMenu();
        item.action();
      });
      menu.appendChild(el);
    }
  });

  document.body.appendChild(menu);
  activeContextMenu = menu;

  // Adjust if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
}

document.addEventListener('contextmenu', (e) => {
  if (!isEffectEnabled('contextMenu')) return;
  if (e.target.id === 'desktop' || e.target.closest('#desktop')) {
    // Don't intercept context menu on windows
    if (e.target.closest('.window') || e.target.closest('#taskbar')) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY);
  }
});

document.addEventListener('click', (e) => {
  if (activeContextMenu && !activeContextMenu.contains(e.target)) {
    removeContextMenu();
  }
});

registerEffect('contextMenu', {
  enable() {},
  disable() { removeContextMenu(); }
});

// ==================== TRAY TOOLTIPS ====================

const TRAY_MESSAGES = [
  'Your Internet connection speed is 56 Kbps',
  'Norton AntiVirus: Definitions updated',
  'Windows Update: 3 critical updates available',
  'New hardware found: Generic USB Device',
  'Low disk space on drive C:',
  'MSN Messenger: 0 contacts online',
  'Scheduled disk cleanup at 3:00 AM',
  'Printer \'HP LaserJet\' is ready'
];

let trayTooltipInterval = null;

function showTrayTooltip() {
  if (!isEffectEnabled('trayTooltips')) return;

  // Remove existing tooltip
  const existing = document.querySelector('.tray-tooltip');
  if (existing) existing.remove();

  const tooltip = document.createElement('div');
  tooltip.className = 'tray-tooltip';

  const msg = TRAY_MESSAGES[Math.floor(Math.random() * TRAY_MESSAGES.length)];
  tooltip.textContent = msg;

  const closeX = document.createElement('span');
  closeX.className = 'tray-tooltip-close';
  closeX.textContent = ' \u00d7';
  closeX.addEventListener('click', () => tooltip.remove());
  tooltip.appendChild(closeX);

  document.body.appendChild(tooltip);

  // Auto-dismiss after 4s
  setTimeout(() => {
    if (tooltip.parentNode) tooltip.remove();
  }, 4000);
}

function startTrayTooltips() {
  // Random interval between 45-60 seconds
  function scheduleNext() {
    const delay = 45000 + Math.random() * 15000;
    trayTooltipInterval = setTimeout(() => {
      showTrayTooltip();
      scheduleNext();
    }, delay);
  }
  scheduleNext();
}

function stopTrayTooltips() {
  clearTimeout(trayTooltipInterval);
  trayTooltipInterval = null;
  const existing = document.querySelector('.tray-tooltip');
  if (existing) existing.remove();
}

registerEffect('trayTooltips', {
  enable() { startTrayTooltips(); },
  disable() { stopTrayTooltips(); }
});

// ==================== VOLUME MUTE TOGGLE ====================

let isMuted = false;

function setupVolumeToggle() {
  const volumeCanvas = document.getElementById('tray-volume');
  volumeCanvas.addEventListener('click', () => {
    if (!isEffectEnabled('volumeToggle')) return;
    isMuted = !isMuted;
    const ctx = volumeCanvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    if (isMuted) {
      drawVolumeIconMuted(ctx);
      volumeCanvas.title = 'Volume: Muted';
    } else {
      drawVolumeIcon(ctx);
      volumeCanvas.title = 'Volume: On';
    }
  });
}

registerEffect('volumeToggle', {
  enable() {},
  disable() {
    isMuted = false;
    const volumeCanvas = document.getElementById('tray-volume');
    if (volumeCanvas) {
      const ctx = volumeCanvas.getContext('2d');
      ctx.clearRect(0, 0, 16, 16);
      drawVolumeIcon(ctx);
      volumeCanvas.title = 'Volume: On';
    }
  }
});

// ==================== DISK SPACE TRACKING ====================

registerEffect('diskSpace', {
  enable() {},
  disable() {}
});

function getDiskSpaceContent() {
  const sorted = gameState.totalFilesSorted || 0;
  const usedMB = sorted * (1 + Math.floor(Math.random() * 5));
  const totalMB = 2048;
  const freeMB = Math.max(0, 420 - usedMB);
  const color = freeMB < 100 ? '#ff0000' : '#000000';

  return '<div style="padding: 20px; text-align: center;">' +
    '<strong>C:\\</strong><br><br>' +
    '<span style="color: ' + color + '">' + freeMB + ' MB free of ' + (totalMB / 1024) + ' GB</span>' +
    '<br><br>' +
    '<div style="width: 200px; height: 16px; border: 1px solid #000; margin: 0 auto; background: #fff;">' +
    '<div style="width: ' + Math.min(100, ((totalMB - freeMB) / totalMB) * 100) + '%; height: 100%; background: ' + (freeMB < 100 ? '#ff0000' : '#000080') + ';"></div>' +
    '</div>' +
    '<br><small>Files sorted: ' + sorted + '</small>' +
    '</div>';
}

// ==================== SETTINGS WINDOW ====================

function openSettingsWindow() {
  const effects = getAllEffects();

  const content = document.createElement('div');
  content.style.padding = '8px';

  const heading = document.createElement('div');
  heading.style.marginBottom = '8px';
  heading.style.fontWeight = 'bold';
  heading.style.fontSize = '12px';
  heading.textContent = 'Toggle UI Effects:';
  content.appendChild(heading);

  const list = document.createElement('ul');
  list.className = 'settings-list';

  // Human-readable effect names
  const effectLabels = {
    fileSelection: 'File Selection Highlight',
    folderGulp: 'Folder Gulp Animation',
    crtFlicker: 'CRT Flicker on Error',
    clickFlash: 'Click Flash on Pickup',
    wrongDropText: 'Wrong Drop Error Text',
    selectionRect: 'Desktop Selection Rectangle',
    contextMenu: 'Right-Click Context Menu',
    trayTooltips: 'System Tray Tooltips',
    scoreOdometer: 'Score Odometer',
    taskbarPrograms: 'Taskbar Program Buttons',
    networkActivity: 'Network Activity Indicator',
    shieldPulse: 'Norton Shield Pulse',
    volumeToggle: 'Volume Mute Toggle',
    fileTooltip: 'File Hover Tooltip',
    typingAnimation: 'Typing Animation in Previews',
    windowChrome: 'Window Minimize/Maximize/Resize',
    dropRipple: 'Drop Ripple Effect',
    comboSlam: 'Combo Character Slam',
    diskSpace: 'My Computer Disk Space'
  };

  for (const [name, enabled] of Object.entries(effects)) {
    const li = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabled;
    checkbox.addEventListener('change', () => {
      toggleEffect(name);
    });

    const label = document.createElement('label');
    label.textContent = effectLabels[name] || name;
    label.style.cursor = 'pointer';
    label.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked;
      toggleEffect(name);
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    list.appendChild(li);
  }

  content.appendChild(list);

  createWindow({
    title: 'Settings',
    content: content
  });
}

// ==================== START MENU ====================

const startMenu = document.getElementById('start-menu');
const startBtn = document.getElementById('restart-btn');

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startMenu.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (!startMenu.contains(e.target) && e.target !== startBtn) {
    startMenu.classList.remove('active');
  }
});

// Settings handler
document.getElementById('settings-item').addEventListener('click', () => {
  startMenu.classList.remove('active');
  openSettingsWindow();
});

// Shutdown handler
document.getElementById('shutdown-item').addEventListener('click', () => {
  startMenu.classList.remove('active');
  if (confirm('Restart from wave 1? Current progress will be lost.')) {
    closeAllWindows();

    gameState.wave = 1;
    gameState.score = 0;
    gameState.time = 9 * 60;
    gameState.totalFilesSorted = 0;
    saveState();
    startWave(1);
    drawCoffeeCup();
    updateScore();
  }
});

// Resize handler
window.addEventListener('resize', handleResize);

// Initialize system tray icons
function initSystemTray() {
  const volumeCanvas = document.getElementById('tray-volume');
  const networkCanvas = document.getElementById('tray-network');
  const shieldCanvas = document.getElementById('tray-shield');

  drawVolumeIcon(volumeCanvas.getContext('2d'));
  drawNetworkIcon(networkCanvas.getContext('2d'));
  drawShieldIcon(shieldCanvas.getContext('2d'));

  setupVolumeToggle();
}

// Initialize desktop shortcuts
function initDesktopShortcuts() {
  // My Computer
  const myComputerIcon = document.createElement('canvas');
  myComputerIcon.width = 32;
  myComputerIcon.height = 32;
  drawMyComputerIcon(myComputerIcon.getContext('2d'));

  createDesktopShortcut({
    icon: myComputerIcon,
    label: 'My Computer',
    top: '20px',
    right: '20px',
    onDblClick: () => {
      const icon16 = document.createElement('canvas');
      icon16.width = 16;
      icon16.height = 16;
      drawMyComputerIcon(icon16.getContext('2d'));

      const content = isEffectEnabled('diskSpace')
        ? getDiskSpaceContent()
        : '<div style="padding: 20px; text-align: center;"><strong>C:\\</strong><br><br>420 MB free of 2 GB</div>';

      createWindow({
        title: 'My Computer',
        icon: icon16,
        content: content
      });
    }
  });

  // Recycle Bin
  const recycleBinIcon = document.createElement('canvas');
  recycleBinIcon.width = 32;
  recycleBinIcon.height = 32;
  drawRecycleBinIcon(recycleBinIcon.getContext('2d'));

  createDesktopShortcut({
    icon: recycleBinIcon,
    label: 'Recycle Bin',
    top: '120px',
    right: '20px',
    onDblClick: () => {
      const icon16 = document.createElement('canvas');
      icon16.width = 16;
      icon16.height = 16;
      drawRecycleBinIcon(icon16.getContext('2d'));

      createWindow({
        title: 'Recycle Bin',
        icon: icon16,
        content: '<div style="padding: 20px; text-align: center;">Recycle Bin is empty</div>'
      });
    }
  });
}

// ==================== INITIALIZATION ====================

function init() {
  loadState();
  setActiveTask('file-sort');
  updateScore();
  updateWaveDisplay();
  updateClock();
  setInterval(updateClock, 1000);
  drawCoffeeCup();
  setInterval(drawCoffeeCup, 500);
  initSystemTray();
  initDesktopShortcuts();

  // Initialize effects system (loads from localStorage, enables all by default)
  initEffects();

  startWave(gameState.wave);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
