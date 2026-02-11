// File sorting task - all file-sort-specific logic

import { gameState, saveState } from '../engine/state.js';
import { randomChoice, randomSample, generateId } from '../engine/utils.js';
import { registerEffect, isEffectEnabled } from '../engine/effects.js';

// Combo tracking
let comboCount = 0;
import {
  drawImageIcon,
  drawDocumentIcon,
  drawSpreadsheetIcon,
  drawMusicIcon,
  drawVideoIcon,
  drawPresentationIcon,
  drawExecutableIcon,
  drawArchiveIcon,
  drawEmailIcon,
  drawPDFIcon,
  createFileIconCanvas,
  drawNetworkIcon,
  drawNetworkIconActive,
  drawShieldIcon,
  drawShieldIconActive
} from '../engine/icons.js';
import {
  renderFile,
  renderFolder,
  clearDesktop,
  generateFilePositions,
  positionFolders,
  createWindow,
  updateScore,
  setOnDropCallback
} from '../engine/ui.js';
import { registerTask, onWaveComplete } from '../engine/waves.js';

// ==================== EFFECT REGISTRATIONS ====================

// Folder gulp
registerEffect('folderGulp', {
  enable() {},
  disable() {}
});

// CRT flicker
registerEffect('crtFlicker', {
  enable() {},
  disable() { document.body.classList.remove('crt-flicker'); }
});

// Wrong drop error text
registerEffect('wrongDropText', {
  enable() {},
  disable() {}
});

// Drop ripple
registerEffect('dropRipple', {
  enable() {},
  disable() {}
});

// Network activity
let networkActivityInterval = null;
registerEffect('networkActivity', {
  enable() {},
  disable() {
    if (networkActivityInterval) {
      clearInterval(networkActivityInterval);
      networkActivityInterval = null;
    }
    // Reset network icon
    const canvas = document.getElementById('tray-network');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 16, 16);
      drawNetworkIcon(ctx);
    }
  }
});

// Shield pulse
registerEffect('shieldPulse', {
  enable() {},
  disable() {
    const shield = document.getElementById('tray-shield');
    if (shield) {
      shield.classList.remove('shield-pulse');
      const ctx = shield.getContext('2d');
      ctx.clearRect(0, 0, 16, 16);
      drawShieldIcon(ctx);
    }
  }
});

// Combo slam
registerEffect('comboSlam', {
  enable() {},
  disable() {}
});

// Typing animation
registerEffect('typingAnimation', {
  enable() {},
  disable() {}
});

// ==================== FILE TYPE DEFINITIONS ====================

const FILE_TYPES = [
  {
    id: 'image',
    extensions: ['.jpg', '.png', '.bmp', '.gif'],
    category: 'Images',
    drawIcon: drawImageIcon,
    generatePreview: generateImagePreview
  },
  {
    id: 'document',
    extensions: ['.doc', '.txt', '.rtf'],
    category: 'Documents',
    drawIcon: drawDocumentIcon,
    generatePreview: generateDocumentPreview
  },
  {
    id: 'spreadsheet',
    extensions: ['.xls', '.csv'],
    category: 'Spreadsheets',
    drawIcon: drawSpreadsheetIcon,
    generatePreview: generateSpreadsheetPreview
  },
  {
    id: 'music',
    extensions: ['.mp3', '.wav', '.ogg'],
    category: 'Music',
    drawIcon: drawMusicIcon,
    generatePreview: generateMusicPreview
  },
  {
    id: 'video',
    extensions: ['.avi', '.mpg', '.mp4'],
    category: 'Videos',
    drawIcon: drawVideoIcon,
    generatePreview: generateVideoPreview
  },
  {
    id: 'presentation',
    extensions: ['.ppt', '.pptx'],
    category: 'Presentations',
    drawIcon: drawPresentationIcon,
    generatePreview: generatePresentationPreview
  },
  {
    id: 'executable',
    extensions: ['.exe', '.bat'],
    category: 'Programs',
    drawIcon: drawExecutableIcon,
    generatePreview: generateExecutablePreview
  },
  {
    id: 'archive',
    extensions: ['.zip', '.rar', '.7z'],
    category: 'Archives',
    drawIcon: drawArchiveIcon,
    generatePreview: generateArchivePreview
  },
  {
    id: 'email',
    extensions: ['.eml', '.msg'],
    category: 'Emails',
    drawIcon: drawEmailIcon,
    generatePreview: generateEmailPreview
  },
  {
    id: 'pdf',
    extensions: ['.pdf'],
    category: 'PDFs',
    drawIcon: drawPDFIcon,
    generatePreview: generatePDFPreview
  }
];

// File name pools
const FILE_NAME_POOLS = {
  image: ['photo', 'screenshot', 'banner', 'logo', 'diagram', 'chart'],
  document: ['memo', 'report', 'notes', 'draft', 'letter', 'agreement'],
  spreadsheet: ['budget', 'forecast', 'inventory', 'sales', 'expenses', 'data'],
  music: ['track', 'song', 'audio', 'recording', 'mix', 'beat'],
  video: ['clip', 'footage', 'recording', 'tutorial', 'demo', 'presentation'],
  presentation: ['slides', 'deck', 'pitch', 'keynote', 'overview', 'summary'],
  executable: ['setup', 'installer', 'tool', 'utility', 'app', 'program'],
  archive: ['backup', 'package', 'bundle', 'collection', 'files', 'data'],
  email: ['message', 're', 'fwd', 'update', 'notification', 'alert'],
  pdf: ['manual', 'guide', 'form', 'invoice', 'contract', 'receipt']
};

// Metadata pools
const METADATA_POOLS = {
  projects: ['Alpha', 'Beta', 'Gamma'],
  departments: ['HR', 'Engineering', 'Marketing', 'Finance'],
  decades: ['90s', '2000s', '2010s', '2020s'],
  priorities: ['URGENT', 'normal', 'archive'],
  clients: ['Acme', 'Globex', 'Initech']
};

// Wave configurations
const WAVE_CONFIGS = [
  { wave: 1, criteria: 'type', fileCount: 4, folders: ['Images', 'Documents'], hint: 'Look at the file icons!' },
  { wave: 2, criteria: 'type', fileCount: 6, folders: ['Images', 'Documents', 'Music'], hint: 'Match files to their type folders' },
  { wave: 3, criteria: 'project', fileCount: 6, folders: ['Project Alpha', 'Project Beta'], hint: 'Check the filename prefixes' },
  { wave: 4, criteria: 'department', fileCount: 8, folders: ['HR', 'Engineering', 'Marketing'], hint: 'Department names are in the filenames' },
  { wave: 5, criteria: 'decade', fileCount: 8, folders: ['90s', '2000s', '2010s'], hint: 'Look for year clues in filenames' },
  { wave: 6, criteria: 'priority', fileCount: 9, folders: ['Urgent', 'Normal', 'Archive'], hint: 'URGENT files need attention!' },
  { wave: 7, criteria: 'client', fileCount: 10, folders: ['Acme Corp', 'Globex', 'Initech'], hint: 'Client names are in prefixes' },
  { wave: 8, criteria: 'type', fileCount: 12, folders: ['Images', 'Documents', 'Videos', 'Music'], hint: 'Final tutorial wave - sort by type!' }
];

// ==================== FILE NAME GENERATION ====================

function generateFileName(typeId, criteria, availableFolders) {
  const type = FILE_TYPES.find(t => t.id === typeId);
  const baseName = randomChoice(FILE_NAME_POOLS[typeId]);
  const extension = randomChoice(type.extensions);

  let prefix = '';
  let suffix = '';

  if (criteria === 'project') {
    const validProjects = METADATA_POOLS.projects.filter(p => availableFolders.includes('Project ' + p));
    const project = validProjects.length > 0 ? randomChoice(validProjects) : METADATA_POOLS.projects[0];
    prefix = project + '_';
  } else if (criteria === 'department') {
    const validDepts = METADATA_POOLS.departments.filter(d => availableFolders.includes(d));
    const dept = validDepts.length > 0 ? randomChoice(validDepts) : METADATA_POOLS.departments[0];
    prefix = dept + '_';
  } else if (criteria === 'decade') {
    const validDecades = METADATA_POOLS.decades.filter(d => availableFolders.includes(d));
    const decade = validDecades.length > 0 ? randomChoice(validDecades) : METADATA_POOLS.decades[0];
    if (decade === '90s') suffix = '_98';
    else if (decade === '2000s') suffix = '_2005';
    else if (decade === '2010s') suffix = '_2015';
    else suffix = '_2023';
  } else if (criteria === 'priority') {
    const folderToPriority = { 'Urgent': 'URGENT', 'Normal': 'normal', 'Archive': 'archive' };
    const validPriorities = availableFolders.map(f => folderToPriority[f]).filter(p => p);
    const priority = validPriorities.length > 0 ? randomChoice(validPriorities) : 'normal';
    if (priority === 'URGENT') prefix = 'URGENT_';
    else if (priority === 'archive') suffix = '_old';
  } else if (criteria === 'client') {
    const folderToClient = { 'Acme Corp': 'Acme', 'Globex': 'Globex', 'Initech': 'Initech' };
    const validClients = availableFolders.map(f => folderToClient[f]).filter(c => c);
    const client = validClients.length > 0 ? randomChoice(validClients) : 'Acme';
    prefix = client + '_';
  }

  const number = Math.floor(Math.random() * 99) + 1;
  return prefix + baseName + suffix + number + extension;
}

function getCorrectFolder(fileName, typeId, criteria) {
  const type = FILE_TYPES.find(t => t.id === typeId);

  if (criteria === 'type') {
    return type.category;
  } else if (criteria === 'project') {
    if (fileName.includes('Alpha')) return 'Project Alpha';
    if (fileName.includes('Beta')) return 'Project Beta';
    if (fileName.includes('Gamma')) return 'Project Gamma';
  } else if (criteria === 'department') {
    if (fileName.includes('HR')) return 'HR';
    if (fileName.includes('Engineering')) return 'Engineering';
    if (fileName.includes('Marketing')) return 'Marketing';
    if (fileName.includes('Finance')) return 'Finance';
  } else if (criteria === 'decade') {
    if (fileName.includes('_98')) return '90s';
    if (fileName.includes('_2005')) return '2000s';
    if (fileName.includes('_2015')) return '2010s';
    if (fileName.includes('_2023')) return '2020s';
  } else if (criteria === 'priority') {
    if (fileName.includes('URGENT')) return 'Urgent';
    if (fileName.includes('_old')) return 'Archive';
    return 'Normal';
  } else if (criteria === 'client') {
    if (fileName.includes('Acme')) return 'Acme Corp';
    if (fileName.includes('Globex')) return 'Globex';
    if (fileName.includes('Initech')) return 'Initech';
  }

  return type.category;
}

// ==================== PROCEDURAL WAVE GENERATION ====================

function generateWaveConfig(waveNumber) {
  const criteriaOptions = ['type', 'project', 'department', 'decade', 'priority', 'client'];
  const criteria = randomChoice(criteriaOptions);

  let folders = [];
  if (criteria === 'type') {
    const folderCount = Math.min(6, 3 + Math.floor(waveNumber / 3));
    const categories = FILE_TYPES.map(t => t.category);
    folders = randomSample(categories, folderCount);
  } else if (criteria === 'project') {
    folders = METADATA_POOLS.projects.slice(0, Math.min(3, 2 + Math.floor(waveNumber / 5)));
    folders = folders.map(p => 'Project ' + p);
  } else if (criteria === 'department') {
    folders = randomSample(METADATA_POOLS.departments, Math.min(4, 3 + Math.floor(waveNumber / 5)));
  } else if (criteria === 'decade') {
    folders = randomSample(METADATA_POOLS.decades, Math.min(4, 3 + Math.floor(waveNumber / 5)));
  } else if (criteria === 'priority') {
    folders = ['Urgent', 'Normal', 'Archive'];
  } else if (criteria === 'client') {
    folders = METADATA_POOLS.clients.map(c => c === 'Acme' ? 'Acme Corp' : c);
  }

  return {
    wave: waveNumber,
    criteria: criteria,
    fileCount: Math.min(20, 4 + waveNumber),
    folders: folders,
    hint: 'Sort the files into the correct folders!'
  };
}

// ==================== FILE PREVIEW ====================

function openFilePreview(fileData) {
  const type = FILE_TYPES.find(t => t.id === fileData.typeId);
  const icon = createFileIconCanvas(type.drawIcon);
  icon.width = 16;
  icon.height = 16;

  const previewContent = type.generatePreview(fileData);

  createWindow({
    title: fileData.name,
    icon: icon,
    content: previewContent
  });
}

// ==================== TYPING ANIMATION HELPER ====================

function typeText(container, fullText, speed) {
  if (!isEffectEnabled('typingAnimation')) {
    container.textContent = fullText;
    return;
  }

  container.textContent = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'blink-cursor';
  cursor.textContent = '_';
  container.appendChild(cursor);

  const interval = setInterval(() => {
    if (i < fullText.length) {
      cursor.before(fullText[i]);
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => cursor.remove(), 2000);
    }
  }, speed);
}

// ==================== PREVIEW GENERATORS ====================

function generateImagePreview(fileData) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  canvas.className = 'preview-canvas';
  const ctx = canvas.getContext('2d');

  const skyColor = '#' + Math.floor(Math.random() * 0x888888 + 0x6699ff).toString(16);
  const groundColor = '#' + Math.floor(Math.random() * 0x446600 + 0x228800).toString(16);

  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = groundColor;
  ctx.fillRect(0, 96, 256, 96);

  ctx.fillStyle = '#654321';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const x = Math.random() * 200;
    ctx.moveTo(x, 96);
    ctx.lineTo(x + 50, 40 + Math.random() * 40);
    ctx.lineTo(x + 100, 96);
    ctx.fill();
  }

  return canvas;
}

function generateDocumentPreview(fileData) {
  const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';
  const fullText = 'MEMO\n' + '='.repeat(40) + '\n\n' + lorem;
  const div = document.createElement('div');
  div.className = 'preview-text';
  typeText(div, fullText, 15);
  return div;
}

function generateSpreadsheetPreview(fileData) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  canvas.className = 'preview-canvas';
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 320, 240);

  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 30);
    ctx.lineTo(320, i * 30);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 80, 0);
    ctx.lineTo(i * 80, 240);
    ctx.stroke();
  }

  ctx.fillStyle = '#4169e1';
  ctx.fillRect(0, 0, 320, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.fillText('A', 35, 20);
  ctx.fillText('B', 115, 20);
  ctx.fillText('C', 195, 20);
  ctx.fillText('D', 275, 20);

  ctx.fillStyle = '#000000';
  for (let row = 1; row < 7; row++) {
    for (let col = 0; col < 4; col++) {
      const value = Math.floor(Math.random() * 1000);
      ctx.fillText(value.toString(), col * 80 + 20, row * 30 + 20);
    }
  }

  return canvas;
}

function generateMusicPreview(fileData) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 200;
  canvas.className = 'preview-canvas';
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 320, 200);

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < 320; x++) {
    const y = 100 + Math.sin(x / 10) * 40 * Math.sin(x / 30);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  return canvas;
}

function generateVideoPreview(fileData) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  canvas.className = 'preview-canvas';
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 320, 240);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(120, 80);
  ctx.lineTo(120, 160);
  ctx.lineTo(200, 120);
  ctx.fill();

  return canvas;
}

function generatePresentationPreview(fileData) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  canvas.className = 'preview-canvas';
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 320, 240);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('Quarterly Review', 60, 40);

  const bars = [60, 100, 80, 120];
  const colors = ['#ff6347', '#4169e1', '#32cd32', '#ffa500'];
  for (let i = 0; i < bars.length; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(60 + i * 50, 200 - bars[i], 40, bars[i]);
  }

  return canvas;
}

function generateExecutablePreview(fileData) {
  const fullText = 'Setup Wizard\n' + '='.repeat(40) + '\n\nWelcome to the installation wizard.\n\nThis will install ' + fileData.name.split('.')[0] + ' on your computer.\n\nClick Next to continue...';
  const div = document.createElement('div');
  div.className = 'preview-text';
  typeText(div, fullText, 15);
  return div;
}

function generateArchivePreview(fileData) {
  const files = ['readme.txt', 'data.csv', 'image1.jpg', 'image2.jpg', 'document.doc', 'backup.zip'];
  let fullText = 'Archive Contents\n' + '='.repeat(40) + '\n\n';
  files.forEach(f => {
    fullText += f + ' (' + Math.floor(Math.random() * 900 + 100) + ' KB)\n';
  });
  const div = document.createElement('div');
  div.className = 'preview-text';
  typeText(div, fullText, 15);
  return div;
}

function generateEmailPreview(fileData) {
  const senders = ['boss@company.com', 'colleague@company.com', 'client@external.com'];
  const subjects = ['Meeting Update', 'Project Status', 'Urgent: Review Needed', 'FYI'];
  const fullText = 'From: ' + randomChoice(senders) + '\nTo: you@company.com\nSubject: ' + randomChoice(subjects) + '\nDate: ' + new Date().toLocaleString() + '\n\nHi,\n\nPlease review the attached materials at your earliest convenience.\n\nBest regards';
  const div = document.createElement('div');
  div.className = 'preview-text';
  typeText(div, fullText, 15);
  return div;
}

function generatePDFPreview(fileData) {
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 360;
  canvas.className = 'preview-canvas';
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 280, 360);

  ctx.fillStyle = '#333333';
  ctx.font = '10px monospace';
  for (let i = 0; i < 20; i++) {
    const text = 'Lorem ipsum dolor sit amet...';
    ctx.fillText(text, 20, 40 + i * 15);
  }

  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  ctx.font = 'bold 48px monospace';
  ctx.save();
  ctx.translate(140, 180);
  ctx.rotate(-Math.PI / 6);
  ctx.fillText('PDF', -40, 10);
  ctx.restore();

  return canvas;
}

// ==================== EFFECTS ====================

// Particle burst
function createParticleBurst(x, y) {
  const colors = ['#ffd700', '#32cd32', '#ffffff', '#ffff00'];
  const particleCount = 8;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 40 + Math.random() * 20;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;

    particle.style.setProperty('--px', px + 'px');
    particle.style.setProperty('--py', py + 'px');

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

// Screen shake
function screenShake() {
  document.body.classList.add('screen-shake');
  setTimeout(() => {
    document.body.classList.remove('screen-shake');
  }, 300);
}

// CRT flicker on wrong drop
function triggerCRTFlicker() {
  if (!isEffectEnabled('crtFlicker')) return;
  document.body.classList.add('crt-flicker');
  setTimeout(() => {
    document.body.classList.remove('crt-flicker');
  }, 100);
}

// Wrong-drop error text
const ERROR_MESSAGES = [
  'Wrong folder!',
  'Access denied',
  'File mismatch!',
  'Error: Bad path',
  'Not this one!',
  'Try again!',
  'Nope!',
  'Invalid target'
];

function showWrongDropText(folderEl) {
  if (!isEffectEnabled('wrongDropText')) return;
  const rect = folderEl.getBoundingClientRect();
  const desktop = document.getElementById('desktop');
  const dBounds = desktop.getBoundingClientRect();

  const text = document.createElement('div');
  text.className = 'wrong-drop-text';
  text.textContent = randomChoice(ERROR_MESSAGES);
  text.style.left = (rect.left - dBounds.left + rect.width / 2) + 'px';
  text.style.top = (rect.top - dBounds.top - 20) + 'px';

  desktop.appendChild(text);
  setTimeout(() => text.remove(), 800);
}

// Folder gulp animation
function triggerFolderGulp(folderEl) {
  if (!isEffectEnabled('folderGulp')) return;
  folderEl.classList.add('gulp');
  setTimeout(() => folderEl.classList.remove('gulp'), 400);
}

// Drop ripple on correct placement
function createDropRipple(folderEl) {
  if (!isEffectEnabled('dropRipple')) return;
  const rect = folderEl.getBoundingClientRect();
  const desktop = document.getElementById('desktop');
  const dBounds = desktop.getBoundingClientRect();

  const ripple = document.createElement('div');
  ripple.className = 'drop-ripple';
  ripple.style.left = (rect.left - dBounds.left + rect.width / 2) + 'px';
  ripple.style.top = (rect.top - dBounds.top + rect.height / 2) + 'px';

  desktop.appendChild(ripple);
  setTimeout(() => ripple.remove(), 400);
}

// Network activity indicator
function triggerNetworkActivity() {
  if (!isEffectEnabled('networkActivity')) return;
  const canvas = document.getElementById('tray-network');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Flicker active icon for 2 seconds
  let flickerCount = 0;
  if (networkActivityInterval) clearInterval(networkActivityInterval);

  networkActivityInterval = setInterval(() => {
    ctx.clearRect(0, 0, 16, 16);
    if (flickerCount % 2 === 0) {
      drawNetworkIconActive(ctx);
    } else {
      drawNetworkIcon(ctx);
    }
    flickerCount++;
    if (flickerCount > 8) {
      clearInterval(networkActivityInterval);
      networkActivityInterval = null;
      ctx.clearRect(0, 0, 16, 16);
      drawNetworkIcon(ctx);
    }
  }, 250);
}

// Shield pulse on combo
function updateShieldState(combo) {
  if (!isEffectEnabled('shieldPulse')) return;
  const shield = document.getElementById('tray-shield');
  if (!shield) return;
  const ctx = shield.getContext('2d');

  if (combo >= 3) {
    ctx.clearRect(0, 0, 16, 16);
    drawShieldIconActive(ctx);
    shield.classList.add('shield-pulse');
  } else {
    ctx.clearRect(0, 0, 16, 16);
    drawShieldIcon(ctx);
    shield.classList.remove('shield-pulse');
  }
}

// Combo character slam
function showComboPopupSlam(x, y, comboLevel) {
  const popup = document.createElement('div');
  popup.className = 'combo-popup';

  const text = 'Combo x' + comboLevel + '!';

  if (isEffectEnabled('comboSlam')) {
    // Wrap each character in a span with staggered delay
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.className = 'combo-char';
      span.textContent = text[i] === ' ' ? '\u00a0' : text[i];
      span.style.animationDelay = (i * 30) + 'ms';
      popup.appendChild(span);
    }
  } else {
    popup.textContent = text;
  }

  popup.style.left = x + 'px';
  popup.style.top = y + 'px';

  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1000);
}

// Update folder badge
function updateFolderBadge(folderName) {
  const folderEl = document.querySelector(`.folder[data-folder-name="${folderName}"]`);
  if (!folderEl) return;

  let badge = folderEl.querySelector('.folder-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'folder-badge';
    folderEl.appendChild(badge);
  }

  const currentCount = parseInt(badge.textContent) || 0;
  badge.textContent = currentCount + 1;
}

// ==================== SCORING ====================

function checkFilePlacement(fileId, folderName) {
  const fileData = gameState.activeFiles.find(f => f.id === fileId);
  if (!fileData) return;

  const correctFolder = fileData.correctFolder;
  const fileEl = document.getElementById(fileId);
  const rect = fileEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Find target folder element
  const targetFolderEl = document.querySelector(`.folder[data-folder-name="${folderName}"]`);

  if (folderName === correctFolder) {
    // Correct!
    comboCount++;

    let score = 10 * gameState.wave;

    if (comboCount >= 3) {
      const comboBonus = 5 * Math.floor(comboCount / 3);
      score += comboBonus;
      showComboPopupSlam(centerX, centerY, comboCount);
    }

    gameState.score += score;
    updateScore();

    // Effects on correct drop
    createParticleBurst(centerX, centerY);
    if (targetFolderEl) {
      triggerFolderGulp(targetFolderEl);
      createDropRipple(targetFolderEl);
    }
    triggerNetworkActivity();
    updateShieldState(comboCount);
    updateFolderBadge(folderName);

    // Track files sorted for disk space effect
    gameState.totalFilesSorted = (gameState.totalFilesSorted || 0) + 1;

    // Remove file
    fileEl.style.transition = 'all 0.3s';
    fileEl.style.opacity = '0';
    fileEl.style.transform = 'scale(0.5)';
    setTimeout(() => {
      fileEl.remove();
      gameState.activeFiles = gameState.activeFiles.filter(f => f.id !== fileId);

      if (gameState.activeFiles.length === 0) {
        comboCount = 0;
        updateShieldState(0);
        onWaveComplete();
      }
    }, 300);
  } else {
    // Wrong!
    comboCount = 0;
    updateShieldState(0);

    gameState.score = Math.max(0, gameState.score - 5);
    updateScore();

    // Effects on wrong drop
    screenShake();
    triggerCRTFlicker();
    if (targetFolderEl) {
      showWrongDropText(targetFolderEl);
    }

    fileEl.classList.add('wrong');
    setTimeout(() => {
      fileEl.classList.remove('wrong');
    }, 300);
  }
}

// ==================== TASK REGISTRATION ====================

registerTask('file-sort', {
  getWaveConfig(waveNumber) {
    return waveNumber <= WAVE_CONFIGS.length
      ? WAVE_CONFIGS[waveNumber - 1]
      : generateWaveConfig(waveNumber);
  },

  getCriteriaText(criteria) {
    if (criteria === 'type') return 'Sort files by TYPE';
    if (criteria === 'project') return 'Sort files by PROJECT';
    if (criteria === 'department') return 'Sort files by DEPARTMENT';
    if (criteria === 'decade') return 'Sort files by DECADE';
    if (criteria === 'priority') return 'Sort files by PRIORITY';
    if (criteria === 'client') return 'Sort files by CLIENT';
    return 'Sort files';
  },

  spawnItems(config) {
    clearDesktop();

    const folderElements = [];
    config.folders.forEach(folderName => {
      const folderEl = renderFolder(folderName);
      folderElements.push(folderEl);
      gameState.folders.push(folderName);
    });

    setTimeout(() => {
      positionFolders(folderElements);
    }, 0);

    const filePositions = generateFilePositions(config.fileCount);

    let validTypes = FILE_TYPES;
    if (config.criteria === 'type') {
      validTypes = FILE_TYPES.filter(type => config.folders.includes(type.category));
    }

    for (let i = 0; i < config.fileCount; i++) {
      const type = randomChoice(validTypes);
      const typeId = type.id;
      const fileName = generateFileName(typeId, config.criteria, config.folders);
      const correctFolder = getCorrectFolder(fileName, typeId, config.criteria);

      const fileData = {
        id: generateId(),
        name: fileName,
        typeId: typeId,
        correctFolder: correctFolder
      };

      gameState.activeFiles.push(fileData);

      renderFile(fileData, filePositions[i], {
        createIconFn: (data) => createFileIconCanvas(type.drawIcon),
        onPreview: openFilePreview
      }, i);
    }

    document.querySelectorAll('.folder-badge').forEach(badge => badge.remove());
    saveState();
  }
});

setOnDropCallback(checkFilePlacement);
