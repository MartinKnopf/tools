// Batch Jobs task - manual data processing pipelines
// Drag files through a sequence of programs (Database, Spreadsheet, Log Viewer, Printer, FTP, Archive)

import { gameState, saveState } from '../engine/state.js';
import { randomChoice, randomSample, generateId } from '../engine/utils.js';
import { isEffectEnabled } from '../engine/effects.js';
import {
  drawSpreadsheetIcon,
  drawDocumentIcon,
  drawArchiveIcon,
  createFileIconCanvas,
  drawPixel,
  drawRect
} from '../engine/icons.js';
import {
  renderFile,
  renderFolder,
  clearDesktop,
  generateFilePositions,
  positionFolders,
  createWindow,
  closeWindow,
  updateScore,
  setOnDropCallback
} from '../engine/ui.js';
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

// ==================== PROGRAM ICONS (48×48 for folder/drop targets) ====================

function drawDatabaseProgramIcon(ctx) {
  // Cylinder shape database
  ctx.fillStyle = '#808080';
  ctx.fillRect(10, 12, 28, 24);
  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.ellipse(24, 12, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a0a0a0';
  ctx.beginPath();
  ctx.ellipse(24, 36, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(24, 12, 14, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Table lines
  ctx.strokeStyle = '#000080';
  ctx.beginPath();
  ctx.moveTo(14, 20); ctx.lineTo(34, 20);
  ctx.moveTo(14, 26); ctx.lineTo(34, 26);
  ctx.moveTo(24, 14); ctx.lineTo(24, 32);
  ctx.stroke();
}

function drawSpreadsheetProgramIcon(ctx) {
  // Green spreadsheet
  ctx.fillStyle = '#228b22';
  ctx.fillRect(8, 6, 32, 36);
  ctx.fillStyle = '#fff';
  ctx.fillRect(12, 12, 24, 26);
  ctx.strokeStyle = '#228b22';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(12, 12 + i * 6.5);
    ctx.lineTo(36, 12 + i * 6.5);
    ctx.stroke();
  }
  for (let i = 0; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(12 + i * 8, 12);
    ctx.lineTo(12 + i * 8, 38);
    ctx.stroke();
  }
}

function drawLogViewerProgramIcon(ctx) {
  // Notepad-style with colored lines
  ctx.fillStyle = '#fff';
  ctx.fillRect(8, 6, 32, 36);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 6, 32, 36);
  // Colored log lines
  const lineColors = ['#808080', '#ff0000', '#008000', '#808080', '#ff0000', '#808080'];
  lineColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(12, 12 + i * 5, 20 - (i % 3) * 4, 2);
  });
}

function drawPrinterProgramIcon(ctx) {
  // Printer box
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(6, 16, 36, 18);
  ctx.fillStyle = '#808080';
  ctx.fillRect(8, 18, 32, 14);
  // Paper in
  ctx.fillStyle = '#fff';
  ctx.fillRect(14, 8, 20, 10);
  // Paper out
  ctx.fillRect(14, 32, 20, 10);
  // Lines on paper
  ctx.fillStyle = '#000';
  ctx.fillRect(16, 35, 14, 1);
  ctx.fillRect(16, 38, 10, 1);
  // Feed slot
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 24, 28, 2);
  // Green LED
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(34, 20, 3, 3);
}

function drawFtpProgramIcon(ctx) {
  // Two folders with arrow
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(4, 14, 16, 12);
  ctx.fillRect(4, 11, 8, 3);
  ctx.fillStyle = '#4169e1';
  ctx.fillRect(28, 14, 16, 12);
  ctx.fillRect(28, 11, 8, 3);
  // Arrow between
  ctx.fillStyle = '#008000';
  ctx.fillRect(22, 18, 4, 4);
  ctx.beginPath();
  ctx.moveTo(26, 16);
  ctx.lineTo(30, 20);
  ctx.lineTo(26, 24);
  ctx.fill();
}

function drawArchiveProgramIcon(ctx) {
  // WinZip-style: yellow box with zipper
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(8, 8, 32, 32);
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 32, 32);
  // Zipper down the middle
  ctx.fillStyle = '#000';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(22 + (i % 2 ? 2 : 0), 10 + i * 5, 4, 3);
  }
  // Handle
  ctx.fillStyle = '#808080';
  ctx.fillRect(20, 34, 8, 4);
}

function drawPaintProgramIcon(ctx) {
  // Paint palette with colored dots + brush
  ctx.fillStyle = '#f5deb3';
  ctx.beginPath();
  ctx.ellipse(22, 26, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8b7355';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Color dots
  const colors = ['#ff0000', '#00aa00', '#0000ff', '#ffff00', '#ff00ff'];
  const positions = [[12, 22], [16, 30], [24, 32], [30, 28], [32, 20]];
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(positions[i][0], positions[i][1], 3, 0, Math.PI * 2);
    ctx.fill();
  });
  // Brush handle
  ctx.fillStyle = '#8b4513';
  ctx.save();
  ctx.translate(10, 10);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-2, -10, 4, 16);
  ctx.restore();
  // Brush tip
  ctx.fillStyle = '#ffa500';
  ctx.save();
  ctx.translate(10, 10);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-3, -13, 6, 4);
  ctx.restore();
}

function drawNotepadProgramIcon(ctx) {
  // White page with blue title bar, text lines, dog-ear corner
  ctx.fillStyle = '#000080';
  ctx.fillRect(8, 6, 32, 6);
  ctx.fillStyle = '#fff';
  ctx.fillRect(8, 12, 32, 30);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 6, 32, 36);
  // Dog-ear corner
  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(40, 6);
  ctx.lineTo(40, 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#808080';
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(32, 14);
  ctx.lineTo(40, 14);
  ctx.stroke();
  // Text lines
  ctx.fillStyle = '#000';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(12, 16 + i * 5, 22 - (i % 3) * 4, 2);
  }
  // Title bar text
  ctx.fillStyle = '#fff';
  ctx.fillRect(10, 8, 14, 2);
}

function drawEmailProgramIcon(ctx) {
  // Envelope with blue "e" badge
  ctx.fillStyle = '#fff';
  ctx.fillRect(6, 14, 30, 20);
  // Flap
  ctx.fillStyle = '#d4d0c8';
  ctx.beginPath();
  ctx.moveTo(6, 14);
  ctx.lineTo(21, 26);
  ctx.lineTo(36, 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 14, 30, 20);
  ctx.beginPath();
  ctx.moveTo(6, 14);
  ctx.lineTo(21, 26);
  ctx.lineTo(36, 14);
  ctx.stroke();
  // Blue "e" badge
  ctx.fillStyle = '#0066cc';
  ctx.beginPath();
  ctx.arc(34, 14, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#003366';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px serif';
  ctx.fillText('e', 31, 18);
}

function drawDialupProgramIcon(ctx) {
  // Gray modem box
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(4, 16, 40, 16);
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(4, 28, 40, 4);
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 16, 40, 16);
  // LEDs
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(8, 20, 4, 3);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(14, 20, 4, 3);
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(20, 20, 4, 3);
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(26, 20, 4, 3);
  // LED labels
  ctx.fillStyle = '#000';
  ctx.font = '5px monospace';
  ctx.fillText('TX', 8, 27);
  ctx.fillText('RX', 14, 27);
  ctx.fillText('CD', 20, 27);
  ctx.fillText('OH', 26, 27);
  // Phone cord
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(36, 24);
  ctx.quadraticCurveTo(42, 20, 42, 12);
  ctx.stroke();
  // Brand text
  ctx.fillStyle = '#000';
  ctx.font = '5px monospace';
  ctx.fillText('US Robotics', 8, 15);
}

// ==================== FILE ICONS (32×32 for desktop files) ====================

function drawDatabaseFileIcon(ctx) {
  drawRect(ctx, 4, 4, 24, 24, '#c0c0c0');
  drawRect(ctx, 6, 8, 20, 16, '#fff');
  ctx.strokeStyle = '#000080';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, 14); ctx.lineTo(26, 14);
  ctx.moveTo(6, 20); ctx.lineTo(26, 20);
  ctx.moveTo(16, 8); ctx.lineTo(16, 24);
  ctx.stroke();
  ctx.strokeStyle = '#000';
  ctx.strokeRect(4, 4, 24, 24);
}

function drawLogFileIcon(ctx) {
  drawRect(ctx, 6, 4, 20, 24, '#fff');
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 4, 20, 24);
  const colors = ['#808080', '#ff0000', '#008000', '#808080'];
  colors.forEach((c, i) => {
    drawRect(ctx, 9, 9 + i * 5, 14 - (i % 2) * 4, 2, c);
  });
}

function drawPrintedFileIcon(ctx) {
  drawRect(ctx, 6, 4, 20, 24, '#fff');
  for (let i = 0; i < 7; i++) {
    drawRect(ctx, 9, 8 + i * 3, 14, 1, '#000');
  }
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 4, 20, 24);
}

function drawPaintFileIcon(ctx) {
  // Small picture frame with colored rectangles
  drawRect(ctx, 4, 4, 24, 24, '#fff');
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, 24, 24);
  drawRect(ctx, 7, 7, 8, 6, '#ff4444');
  drawRect(ctx, 17, 7, 8, 6, '#4444ff');
  drawRect(ctx, 7, 15, 8, 6, '#44bb44');
  drawRect(ctx, 17, 15, 8, 6, '#ffcc00');
  drawRect(ctx, 12, 22, 8, 3, '#ff8800');
}

function drawNotepadFileIcon(ctx) {
  // Small text doc with monospace lines
  drawRect(ctx, 6, 4, 20, 24, '#fff');
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 4, 20, 24);
  // Title bar accent
  drawRect(ctx, 6, 4, 20, 3, '#000080');
  // Text lines
  for (let i = 0; i < 6; i++) {
    drawRect(ctx, 9, 10 + i * 3, 14 - (i % 2) * 4, 1, '#000');
  }
}

function drawEmailFileIcon(ctx) {
  // Sealed envelope
  drawRect(ctx, 4, 8, 24, 16, '#fff');
  ctx.fillStyle = '#d4d0c8';
  ctx.beginPath();
  ctx.moveTo(4, 8);
  ctx.lineTo(16, 18);
  ctx.lineTo(28, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 8, 24, 16);
  ctx.beginPath();
  ctx.moveTo(4, 8);
  ctx.lineTo(16, 18);
  ctx.lineTo(28, 8);
  ctx.stroke();
}

// ==================== FAKE DATA GENERATORS ====================

const NAMES = ['J. Smith', 'R. Chen', 'M. Garcia', 'K. Jones', 'L. Park', 'S. Brown', 'A. Wilson', 'T. Lee'];
const REGIONS = ['East', 'West', 'North', 'South'];
const DEPARTMENTS = ['Sales', 'HR', 'Engineering', 'Purchasing'];
const STATUSES = ['Active', 'Inactive', 'Pending', 'Error'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

function generateTableData(columnName, correctValue) {
  const rows = [];
  // Pick columns based on what's needed
  const cols = ['Name'];
  cols.push(columnName);
  cols.push('Amount');

  for (let i = 0; i < 7; i++) {
    const name = NAMES[i % NAMES.length];
    let colVal;
    const pool = columnName === 'Region' ? REGIONS
      : columnName === 'Department' ? DEPARTMENTS
      : columnName === 'Status' ? STATUSES
      : QUARTERS;
    // ~50% get the correct value
    colVal = Math.random() < 0.5 ? correctValue : randomChoice(pool.filter(v => v !== correctValue));
    const amount = '$' + (Math.floor(Math.random() * 9000) + 1000).toLocaleString();
    rows.push({ Name: name, [columnName]: colVal, Amount: amount });
  }
  return { cols, rows };
}

const LOG_TEMPLATES = {
  error: [
    '[ERROR] Connection timeout at {time}',
    '[ERROR] Failed to write /tmp/data.log',
    '[ERROR] Disk read failure sector 0x4F',
    '[ERROR] Authentication failed for user admin'
  ],
  ok: [
    '[OK] Backup completed successfully',
    '[OK] Database sync finished',
    '[OK] Heartbeat response 200ms',
    '[OK] Scheduled task completed'
  ],
  info: [
    '[INFO] Heartbeat check at {time}',
    '[INFO] User session started id=4821',
    '[INFO] Cache cleared (42 entries)',
    '[INFO] Monitoring service active'
  ]
};

function generateLogLines() {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const hour = String(8 + Math.floor(i / 2)).padStart(2, '0');
    const min = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const time = hour + ':' + min + ':' + sec;
    const roll = Math.random();
    let type, template;
    if (roll < 0.25) {
      type = 'error';
      template = randomChoice(LOG_TEMPLATES.error);
    } else if (roll < 0.45) {
      type = 'ok';
      template = randomChoice(LOG_TEMPLATES.ok);
    } else {
      type = 'info';
      template = randomChoice(LOG_TEMPLATES.info);
    }
    lines.push({ type, text: template.replace('{time}', time) });
  }
  return lines;
}

function generateSpreadsheetData() {
  const data = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 4; c++) {
      row.push(Math.floor(Math.random() * 900) + 100);
    }
    data.push(row);
  }
  return data;
}

// Seeded random for deterministic canvas art
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >>> 16) / 32767;
  };
}

function generateCanvasArt(seed) {
  const rng = seededRandom(seed);
  const colors = ['#ff4444', '#4444ff', '#44bb44', '#ffcc00', '#ff8800', '#cc44cc', '#44cccc'];
  const rects = [];
  const count = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    rects.push({
      x: Math.floor(rng() * 120),
      y: Math.floor(rng() * 80),
      w: 30 + Math.floor(rng() * 60),
      h: 20 + Math.floor(rng() * 50),
      color: colors[Math.floor(rng() * colors.length)]
    });
  }
  return rects;
}

const TEXT_CONTENT_TEMPLATES = {
  ini: (find) => {
    const lines = [
      '[Server]', 'hostname=' + find, 'port=8080', 'max_connections=100',
      '', '[Database]', 'host=' + find, 'name=appdb', 'user=admin',
      '', '[Logging]', 'level=debug', 'output=' + find + '/var/log/app.log',
      '', '[Network]', 'bind_address=' + find, 'timeout=30'
    ];
    return lines.join('\n');
  },
  batch: (find) => {
    const lines = [
      '@echo off', 'REM Deploy script v2.1', 'SET MODE=' + find,
      'echo Starting %MODE% deployment...', 'copy files\\*.dat C:\\TEMP',
      'SET SERVER=' + find, 'ping %SERVER%',
      'IF ERRORLEVEL 1 GOTO :ERROR', 'echo Mode: ' + find,
      'echo Transfer complete.', 'GOTO :END', ':ERROR',
      'echo Connection failed to ' + find, ':END', 'pause'
    ];
    return lines.join('\n');
  },
  html: (find) => {
    const lines = [
      '<html>', '<head><title>Site Config</title></head>', '<body>',
      '  <a href="' + find + '/index.html">Home</a>',
      '  <img src="' + find + '/logo.gif">',
      '  <form action="' + find + '/submit.cgi">',
      '    <input type="text" name="query">', '  </form>',
      '  <!-- Server: ' + find + ' -->', '</body>', '</html>'
    ];
    return lines.join('\n');
  },
  log: (find) => {
    const lines = [
      '08:01:22 [INFO] Service started', '08:05:14 [' + find + '] Watchdog active',
      '08:12:33 [INFO] Heartbeat OK', '08:15:01 [' + find + '] Threshold exceeded',
      '08:22:47 [INFO] Cache flushed', '08:30:02 [' + find + '] Alert triggered',
      '08:45:18 [INFO] Backup started', '09:01:05 [' + find + '] Recovery check',
      '09:15:22 [INFO] Maintenance window', '09:30:44 [' + find + '] Status update'
    ];
    return lines.join('\n');
  }
};

function generateTextContent(findValue) {
  const types = Object.keys(TEXT_CONTENT_TEMPLATES);
  const type = types[Math.floor(Math.random() * types.length)];
  return TEXT_CONTENT_TEMPLATES[type](findValue);
}

const EMAIL_SENDERS = [
  { from: 'jsmith@company.com', name: 'J. Smith' },
  { from: 'newsletter@techdigest.com', name: 'Tech Digest' },
  { from: 'hr@company.com', name: 'HR Department' },
  { from: 'promo@deals99.com', name: 'Deals99' },
  { from: 'admin@company.com', name: 'System Admin' },
  { from: 'boss@company.com', name: 'The Boss' }
];

const EMAIL_SUBJECTS_DISTRACTOR = [
  'RE: Meeting tomorrow', 'Weekly Newsletter', 'Lunch plans?',
  'FW: Office party Friday', 'Your account statement', 'Team standup notes',
  'URGENT: Password expiring', 'RE: Project timeline'
];

function generateInboxEmails(attachment) {
  const emails = [];
  // Correct email with attachment
  const correctSender = EMAIL_SENDERS[Math.floor(Math.random() * 3)];
  emails.push({
    from: correctSender.name,
    subject: 'RE: ' + attachment.replace(/_/g, ' '),
    size: (Math.floor(Math.random() * 400) + 200) + ' KB',
    hasAttachment: true,
    body: 'Hi,\n\nPlease find the ' + attachment.replace(/_/g, ' ') + ' attached.\nLet me know if you need anything else.\n\nRegards,\n' + correctSender.name
  });
  // 3-5 distractor emails
  const distractorCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < distractorCount; i++) {
    const sender = EMAIL_SENDERS[(i + 1) % EMAIL_SENDERS.length];
    emails.push({
      from: sender.name,
      subject: EMAIL_SUBJECTS_DISTRACTOR[i % EMAIL_SUBJECTS_DISTRACTOR.length],
      size: (Math.floor(Math.random() * 50) + 5) + ' KB',
      hasAttachment: false,
      body: 'This is a regular email with no relevant attachments.\n\n' + sender.name
    });
  }
  // Shuffle
  for (let i = emails.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emails[i], emails[j]] = [emails[j], emails[i]];
  }
  return emails;
}

const EMAIL_RECIPIENTS = [
  { addr: 'boss@company.com', name: 'The Boss' },
  { addr: 'client@acme.com', name: 'ACME Client' },
  { addr: 'team@company.com', name: 'Team List' },
  { addr: 'archive@company.com', name: 'Archive' }
];

const PHONE_NUMBERS = ['555-0147', '555-0200', '555-0333', '555-0911'];

const FIND_REPLACE_POOL = [
  { find: 'localhost', replace: '192.168.1.50' },
  { find: 'admin', replace: 'root' },
  { find: '8080', replace: '443' },
  { find: 'ERROR', replace: 'WARNING' },
  { find: 'debug', replace: 'production' },
  { find: 'http://', replace: 'https://' },
  { find: 'C:\\TEMP', replace: 'D:\\DATA' },
  { find: 'DISABLED', replace: 'ENABLED' }
];

// ==================== TOAST HELPER ====================

function showToast(parentEl, message, isError) {
  const existing = parentEl.querySelector('.pipeline-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'pipeline-toast';
  toast.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);' +
    'background:' + (isError ? '#ff0000' : '#008000') + ';color:#fff;padding:4px 12px;' +
    'font-size:11px;border:2px outset #fff;white-space:nowrap;z-index:10;';
  toast.textContent = message;
  parentEl.style.position = 'relative';
  parentEl.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2000);
}

// ==================== PROGRAM WINDOW BUILDERS ====================

// --- 1. SQL Query Tool ---
function openDatabaseWindow(fileData, stepConfig, onComplete) {
  const { column, value } = stepConfig;
  const tableData = generateTableData(column, value);

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'program-toolbar';
  toolbar.textContent = 'Table: ' + fileData.name;
  container.appendChild(toolbar);

  // Data table
  const tableWrap = document.createElement('div');
  tableWrap.style.cssText = 'flex:1;overflow:auto;padding:4px;';
  const table = document.createElement('table');
  table.className = 'data-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  tableData.cols.forEach(c => {
    const th = document.createElement('th');
    th.textContent = c;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tableData.rows.forEach(row => {
    const tr = document.createElement('tr');
    tableData.cols.forEach(c => {
      const td = document.createElement('td');
      td.textContent = row[c];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  container.appendChild(tableWrap);

  // Query bar
  const queryBar = document.createElement('div');
  queryBar.className = 'query-bar';

  const label = document.createElement('span');
  label.textContent = 'SELECT * WHERE ';
  label.style.fontSize = '11px';
  queryBar.appendChild(label);

  // Column dropdown
  const colPools = ['Region', 'Department', 'Status', 'Quarter'];
  const colSelect = document.createElement('select');
  colSelect.innerHTML = '<option value="">Column</option>';
  colPools.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    colSelect.appendChild(opt);
  });
  queryBar.appendChild(colSelect);

  // Operator (always =)
  const opSpan = document.createElement('span');
  opSpan.textContent = ' = ';
  opSpan.style.fontSize = '11px';
  queryBar.appendChild(opSpan);

  // Value dropdown (populated based on column)
  const valSelect = document.createElement('select');
  valSelect.innerHTML = '<option value="">Value</option>';
  queryBar.appendChild(valSelect);

  colSelect.addEventListener('change', () => {
    const pool = colSelect.value === 'Region' ? REGIONS
      : colSelect.value === 'Department' ? DEPARTMENTS
      : colSelect.value === 'Status' ? STATUSES
      : colSelect.value === 'Quarter' ? QUARTERS : [];
    valSelect.innerHTML = '<option value="">Value</option>';
    pool.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      valSelect.appendChild(opt);
    });
  });

  // Run Query button
  const runBtn = document.createElement('button');
  runBtn.className = 'pipeline-btn';
  runBtn.textContent = 'Run Query';
  queryBar.appendChild(runBtn);

  container.appendChild(queryBar);

  // Build the window
  const win = createWindow({ title: 'SQL Query Tool \u2014 ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win);

  runBtn.addEventListener('click', () => {
    if (colSelect.value === column && valSelect.value === value) {
      // Correct! Filter the table
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        const colIdx = tableData.cols.indexOf(column);
        if (cells[colIdx] && cells[colIdx].textContent !== value) {
          tr.style.textDecoration = 'line-through';
          tr.style.opacity = '0.3';
          tr.style.transition = 'opacity 0.3s';
        }
      });

      // Show export button
      runBtn.style.display = 'none';
      const exportBtn = document.createElement('button');
      exportBtn.className = 'pipeline-btn';
      exportBtn.textContent = 'Export';
      exportBtn.style.background = '#008000';
      exportBtn.style.color = '#fff';
      queryBar.appendChild(exportBtn);
      exportBtn.addEventListener('click', () => {
        closeWindow(win);
        onComplete();
      });
    } else {
      showToast(contentEl, '0 rows returned \u2014 adjust your query', true);
      colSelect.value = '';
      valSelect.innerHTML = '<option value="">Value</option>';
    }
  });
}

// --- 2. Spreadsheet Processor ---
function openSpreadsheetWindow(fileData, stepConfig, onComplete) {
  const correctFn = stepConfig.fn;
  const data = generateSpreadsheetData();
  const colLetters = ['A', 'B', 'C', 'D'];

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;';

  // Formula toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'program-toolbar';
  toolbar.style.display = 'flex';
  toolbar.style.gap = '4px';

  const functions = [
    { id: 'sum', label: '\u03A3 SUM' },
    { id: 'average', label: '\u03BC AVERAGE' },
    { id: 'sort', label: '\u2195 SORT' },
    { id: 'pivot', label: '\u229E PIVOT' }
  ];

  const fnButtons = {};
  functions.forEach(fn => {
    const btn = document.createElement('button');
    btn.className = 'pipeline-btn';
    btn.textContent = fn.label;
    btn.dataset.fn = fn.id;
    toolbar.appendChild(btn);
    fnButtons[fn.id] = btn;
  });
  container.appendChild(toolbar);

  // Grid area
  const gridWrap = document.createElement('div');
  gridWrap.style.cssText = 'flex:1;overflow:auto;padding:4px;';

  const table = document.createElement('table');
  table.className = 'data-table';
  table.style.background = '#fff';

  // Header row
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const cornerTh = document.createElement('th');
  cornerTh.textContent = '';
  headRow.appendChild(cornerTh);
  colLetters.forEach(l => {
    const th = document.createElement('th');
    th.textContent = l;
    th.style.background = '#228b22';
    th.style.color = '#fff';
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach((row, ri) => {
    const tr = document.createElement('tr');
    const rowLabel = document.createElement('td');
    rowLabel.textContent = ri + 1;
    rowLabel.style.fontWeight = 'bold';
    rowLabel.style.background = '#c0c0c0';
    tr.appendChild(rowLabel);
    row.forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      td.style.textAlign = 'right';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  gridWrap.appendChild(table);
  container.appendChild(gridWrap);

  // Save button (hidden initially)
  const saveBar = document.createElement('div');
  saveBar.style.cssText = 'padding:4px 8px;background:#c0c0c0;display:none;';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'pipeline-btn';
  saveBtn.textContent = 'Save';
  saveBtn.style.background = '#008000';
  saveBtn.style.color = '#fff';
  saveBar.appendChild(saveBtn);
  container.appendChild(saveBar);

  const win = createWindow({ title: 'Spreadsheet \u2014 ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win);

  // Button handlers
  Object.keys(fnButtons).forEach(fnId => {
    fnButtons[fnId].addEventListener('click', () => {
      if (fnId === correctFn) {
        // Animate correct result
        fnButtons[fnId].style.background = '#008000';
        fnButtons[fnId].style.color = '#fff';

        if (fnId === 'sum' || fnId === 'average') {
          // Add result row
          const resultRow = document.createElement('tr');
          resultRow.style.background = '#ffffcc';
          const labelTd = document.createElement('td');
          labelTd.textContent = fnId === 'sum' ? '\u03A3' : '\u03BC';
          labelTd.style.fontWeight = 'bold';
          labelTd.style.background = '#228b22';
          labelTd.style.color = '#fff';
          resultRow.appendChild(labelTd);
          for (let c = 0; c < 4; c++) {
            const td = document.createElement('td');
            td.style.textAlign = 'right';
            td.style.fontWeight = 'bold';
            const colSum = data.reduce((s, r) => s + r[c], 0);
            td.textContent = fnId === 'sum' ? colSum : Math.round(colSum / data.length);
            resultRow.appendChild(td);
          }
          tbody.appendChild(resultRow);
        } else if (fnId === 'sort') {
          // Re-order rows by first column
          const sorted = [...data].sort((a, b) => a[0] - b[0]);
          const trs = tbody.querySelectorAll('tr');
          sorted.forEach((row, ri) => {
            const cells = trs[ri].querySelectorAll('td');
            row.forEach((val, ci) => { cells[ci + 1].textContent = val; });
          });
        } else if (fnId === 'pivot') {
          // Show a summary row
          const resultRow = document.createElement('tr');
          resultRow.style.background = '#e0e0ff';
          const labelTd = document.createElement('td');
          labelTd.textContent = 'Pvt';
          labelTd.style.fontWeight = 'bold';
          labelTd.style.background = '#000080';
          labelTd.style.color = '#fff';
          resultRow.appendChild(labelTd);
          for (let c = 0; c < 4; c++) {
            const td = document.createElement('td');
            td.style.textAlign = 'right';
            td.style.fontWeight = 'bold';
            const vals = data.map(r => r[c]);
            td.textContent = Math.max(...vals) - Math.min(...vals);
            resultRow.appendChild(td);
          }
          tbody.appendChild(resultRow);
        }

        saveBar.style.display = 'block';
        saveBtn.addEventListener('click', () => {
          closeWindow(win);
          onComplete();
        });
      } else {
        // Wrong
        fnButtons[fnId].style.background = '#ff0000';
        fnButtons[fnId].style.color = '#fff';
        setTimeout(() => {
          fnButtons[fnId].style.background = '';
          fnButtons[fnId].style.color = '';
        }, 400);
        showToast(contentEl, 'Error: Cannot apply ' + fnId.toUpperCase() + ' to this data type', true);
      }
    });
  });
}

// --- 3. Log Viewer ---
function openLogViewerWindow(fileData, stepConfig, onComplete) {
  const correctAction = stepConfig.action;
  const logLines = generateLogLines();

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'program-toolbar';
  toolbar.style.display = 'flex';
  toolbar.style.gap = '4px';

  const actions = [
    { id: 'strip-errors', label: 'Strip Errors' },
    { id: 'extract', label: 'Extract Data' },
    { id: 'format', label: 'Format Report' },
    { id: 'dedup', label: 'Remove Dupes' }
  ];

  const actionButtons = {};
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'pipeline-btn';
    btn.textContent = a.label;
    btn.dataset.action = a.id;
    toolbar.appendChild(btn);
    actionButtons[a.id] = btn;
  });
  container.appendChild(toolbar);

  // Log area
  const logArea = document.createElement('div');
  logArea.style.cssText = 'flex:1;overflow:auto;padding:8px;background:#fff;font-family:monospace;font-size:11px;';

  logLines.forEach(line => {
    const div = document.createElement('div');
    div.className = 'log-line' + (line.type === 'error' ? ' log-line-error' : line.type === 'ok' ? ' log-line-ok' : '');
    div.textContent = line.text;
    div.dataset.type = line.type;
    logArea.appendChild(div);
  });
  container.appendChild(logArea);

  // Save bar (hidden)
  const saveBar = document.createElement('div');
  saveBar.style.cssText = 'padding:4px 8px;background:#c0c0c0;display:none;';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'pipeline-btn';
  saveBtn.textContent = 'Save';
  saveBtn.style.background = '#008000';
  saveBtn.style.color = '#fff';
  saveBar.appendChild(saveBtn);
  container.appendChild(saveBar);

  const win = createWindow({ title: 'Log Viewer \u2014 ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win);

  Object.keys(actionButtons).forEach(actionId => {
    actionButtons[actionId].addEventListener('click', () => {
      if (actionId === correctAction) {
        actionButtons[actionId].style.background = '#008000';
        actionButtons[actionId].style.color = '#fff';

        const lines = logArea.querySelectorAll('.log-line');
        if (actionId === 'strip-errors') {
          lines.forEach(l => {
            if (l.dataset.type === 'error') {
              l.style.transition = 'opacity 0.3s, height 0.3s';
              l.style.opacity = '0';
              setTimeout(() => { l.style.height = '0'; l.style.overflow = 'hidden'; }, 300);
            }
          });
        } else if (actionId === 'extract') {
          lines.forEach(l => {
            if (l.dataset.type === 'info') {
              l.style.transition = 'opacity 0.3s';
              l.style.opacity = '0.2';
            }
          });
        } else if (actionId === 'format') {
          lines.forEach((l, i) => {
            setTimeout(() => {
              l.textContent = String(i + 1).padStart(3, '0') + '| ' + l.textContent;
              l.style.borderBottom = '1px dotted #ccc';
            }, i * 50);
          });
        } else if (actionId === 'dedup') {
          const seen = new Set();
          lines.forEach(l => {
            const key = l.textContent.replace(/\d{2}:\d{2}:\d{2}/g, 'XX:XX:XX');
            if (seen.has(key)) {
              l.style.transition = 'opacity 0.3s';
              l.style.opacity = '0';
              setTimeout(() => { l.style.height = '0'; l.style.overflow = 'hidden'; }, 300);
            }
            seen.add(key);
          });
        }

        setTimeout(() => {
          saveBar.style.display = 'block';
          saveBtn.addEventListener('click', () => {
            closeWindow(win);
            onComplete();
          });
        }, 500);
      } else {
        actionButtons[actionId].style.background = '#ff0000';
        actionButtons[actionId].style.color = '#fff';
        setTimeout(() => {
          actionButtons[actionId].style.background = '';
          actionButtons[actionId].style.color = '';
        }, 400);
        showToast(contentEl, 'Warning: Operation not applicable', true);
      }
    });
  });
}

// --- 4. Print Spooler (Terminal) ---
function openPrinterWindow(fileData, stepConfig, onComplete) {
  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:16px;gap:12px;';

  // Print dialog
  const dialog = document.createElement('div');
  dialog.style.cssText = 'border:2px outset #fff;background:#c0c0c0;padding:16px;width:260px;font-size:12px;';
  dialog.innerHTML =
    '<div style="margin-bottom:8px;font-weight:bold;">Print</div>' +
    '<div style="margin-bottom:4px;">Printer: HP LaserJet 4 on LPT1:</div>' +
    '<div style="margin-bottom:4px;">Status: Ready</div>' +
    '<div style="margin-bottom:4px;">Pages: All</div>' +
    '<div style="margin-bottom:12px;">Copies: 1</div>';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
  const okBtn = document.createElement('button');
  okBtn.className = 'pipeline-btn';
  okBtn.textContent = 'OK';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'pipeline-btn';
  cancelBtn.textContent = 'Cancel';
  btnRow.appendChild(okBtn);
  btnRow.appendChild(cancelBtn);
  dialog.appendChild(btnRow);
  container.appendChild(dialog);

  const win = createWindow({ title: 'Print \u2014 ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win, 320, 280);

  cancelBtn.addEventListener('click', () => {
    // Cancel just closes without completing
    closeWindow(win);
    // Re-show the file on desktop
    const fileEl = document.getElementById(fileData.id);
    if (fileEl) fileEl.style.display = '';
  });

  okBtn.addEventListener('click', () => {
    // Transition to progress view
    dialog.remove();

    const progressWrap = document.createElement('div');
    progressWrap.style.cssText = 'padding:16px;text-align:center;width:100%;';

    const statusText = document.createElement('div');
    statusText.style.cssText = 'font-size:12px;margin-bottom:8px;';
    statusText.textContent = 'Printing page 1 of 3...';
    progressWrap.appendChild(statusText);

    const progressTrack = document.createElement('div');
    progressTrack.className = 'program-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'program-progress-bar';
    progressTrack.appendChild(progressBar);
    progressWrap.appendChild(progressTrack);

    container.appendChild(progressWrap);

    let page = 1;
    let progress = 0;
    let jammed = false;
    const paperJam = Math.random() < 0.6;

    const printInterval = setInterval(() => {
      progress += 5 + Math.floor(Math.random() * 8);
      if (progress > 100) progress = 100;
      progressBar.style.width = progress + '%';

      if (progress < 33) {
        statusText.textContent = 'Printing page 1 of 3...';
      } else if (progress < 66) {
        statusText.textContent = 'Printing page 2 of 3...';
      } else {
        statusText.textContent = 'Printing page 3 of 3...';
      }

      // Paper jam at ~50%
      if (paperJam && !jammed && progress >= 50) {
        jammed = true;
        clearInterval(printInterval);
        statusText.textContent = 'Paper Jam in Tray 2!';
        statusText.style.color = '#ff0000';

        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'pipeline-btn';
        resumeBtn.textContent = 'Resume';
        resumeBtn.style.marginTop = '8px';
        progressWrap.appendChild(resumeBtn);
        resumeBtn.addEventListener('click', () => {
          resumeBtn.remove();
          statusText.style.color = '';
          // Continue printing
          const resumeInterval = setInterval(() => {
            progress += 5 + Math.floor(Math.random() * 8);
            if (progress > 100) progress = 100;
            progressBar.style.width = progress + '%';
            statusText.textContent = progress < 100 ? 'Printing page 3 of 3...' : 'Print job complete';
            if (progress >= 100) {
              clearInterval(resumeInterval);
              setTimeout(() => {
                closeWindow(win);
                onComplete();
              }, 600);
            }
          }, 150);
        });
        return;
      }

      if (progress >= 100) {
        clearInterval(printInterval);
        statusText.textContent = 'Print job complete';
        setTimeout(() => {
          closeWindow(win);
          onComplete();
        }, 600);
      }
    }, 150);
  });
}

// --- 5. FTP Client (Terminal) ---
function openFtpWindow(fileData, stepConfig, onComplete) {
  const correctDir = stepConfig.dir;
  const dirs = ['/var/www/public/', '/home/backups/', '/data/reports/', '/tmp/staging/'];

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;';

  // Two-pane view
  const panes = document.createElement('div');
  panes.style.cssText = 'display:flex;flex:1;min-height:0;';

  // Local pane
  const localPane = document.createElement('div');
  localPane.className = 'ftp-pane';
  localPane.innerHTML = '<div style="font-weight:bold;padding:4px;background:#c0c0c0;border-bottom:1px solid #808080;">Local</div>';
  const localFile = document.createElement('div');
  localFile.style.cssText = 'padding:8px;font-size:11px;';
  localFile.textContent = '\uD83D\uDCC4 ' + fileData.name;
  localPane.appendChild(localFile);
  panes.appendChild(localPane);

  // Middle controls
  const middle = document.createElement('div');
  middle.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;gap:8px;background:#c0c0c0;';
  const uploadBtn = document.createElement('button');
  uploadBtn.className = 'pipeline-btn';
  uploadBtn.textContent = 'Upload \u2192';
  middle.appendChild(uploadBtn);
  panes.appendChild(middle);

  // Remote pane
  const remotePane = document.createElement('div');
  remotePane.className = 'ftp-pane';
  remotePane.innerHTML = '<div style="font-weight:bold;padding:4px;background:#c0c0c0;border-bottom:1px solid #808080;">Remote</div>';
  let selectedDir = null;
  dirs.forEach(d => {
    const dirEl = document.createElement('div');
    dirEl.style.cssText = 'padding:4px 8px;font-size:11px;cursor:pointer;';
    dirEl.textContent = '\uD83D\uDCC1 ' + d;
    dirEl.addEventListener('click', () => {
      // Deselect others
      remotePane.querySelectorAll('[data-dir]').forEach(el => {
        el.style.background = '';
        el.style.color = '';
      });
      dirEl.style.background = '#000080';
      dirEl.style.color = '#fff';
      selectedDir = d;
    });
    dirEl.dataset.dir = d;
    remotePane.appendChild(dirEl);
  });
  panes.appendChild(remotePane);
  container.appendChild(panes);

  // Transfer log area
  const logArea = document.createElement('div');
  logArea.style.cssText = 'height:60px;overflow:auto;background:#000;color:#00ff00;font-family:monospace;font-size:10px;padding:4px;';
  logArea.textContent = '220 FTP Server ready.\n';
  container.appendChild(logArea);

  const win = createWindow({ title: 'WS_FTP \u2014 ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win, 440, 340);

  uploadBtn.addEventListener('click', () => {
    if (!selectedDir) {
      logArea.textContent += 'Error: No directory selected.\n';
      logArea.scrollTop = logArea.scrollHeight;
      return;
    }

    if (selectedDir === correctDir) {
      // Correct! Show transfer progress
      uploadBtn.disabled = true;
      logArea.textContent += 'CWD ' + selectedDir + '\n250 Directory changed.\nSTOR ' + fileData.name + '\n';

      let progress = 0;
      const transferInterval = setInterval(() => {
        progress += 8 + Math.floor(Math.random() * 15);
        if (progress > 100) progress = 100;
        const speed = (1.8 + Math.random() * 3).toFixed(1);
        logArea.textContent += progress + '% (' + speed + ' KB/s)\n';
        logArea.scrollTop = logArea.scrollHeight;

        if (progress >= 100) {
          clearInterval(transferInterval);
          logArea.textContent += '226 Transfer complete.\n';
          logArea.scrollTop = logArea.scrollHeight;
          setTimeout(() => {
            closeWindow(win);
            onComplete();
          }, 600);
        }
      }, 200);
    } else {
      // Wrong directory
      logArea.textContent += 'CWD ' + selectedDir + '\n550 Permission Denied.\n';
      logArea.scrollTop = logArea.scrollHeight;
      // Deselect
      remotePane.querySelectorAll('[data-dir]').forEach(el => {
        el.style.background = '';
        el.style.color = '';
      });
      selectedDir = null;
    }
  });
}

// --- 6. File Compressor ---
function openArchiveWindow(fileData, stepConfig, onComplete) {
  const correctMethod = stepConfig.method;
  const fakeSize = Math.floor(Math.random() * 400) + 100;

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;padding:16px;gap:12px;';

  // File info
  const fileInfo = document.createElement('div');
  fileInfo.style.fontSize = '12px';
  fileInfo.innerHTML = '<strong>File:</strong> ' + fileData.name + '<br><strong>Size:</strong> ' + fakeSize + ' KB';
  container.appendChild(fileInfo);

  // Compression methods
  const methodsDiv = document.createElement('div');
  methodsDiv.style.cssText = 'border:2px inset #808080;padding:8px;background:#fff;';
  methodsDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;font-size:12px;">Compression method:</div>';

  const methods = [
    { id: 'store', label: 'Store (no compression)' },
    { id: 'deflate', label: 'Deflate (normal)' },
    { id: 'deflate64', label: 'Deflate64 (maximum)' }
  ];
  let selectedMethod = null;

  methods.forEach(m => {
    const label = document.createElement('label');
    label.style.cssText = 'display:block;padding:2px 0;font-size:12px;cursor:pointer;';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'compress-method';
    radio.value = m.id;
    radio.addEventListener('change', () => { selectedMethod = m.id; });
    label.appendChild(radio);
    label.appendChild(document.createTextNode(' ' + m.label));
    methodsDiv.appendChild(label);
  });
  container.appendChild(methodsDiv);

  // Add to Archive button
  const addBtn = document.createElement('button');
  addBtn.className = 'pipeline-btn';
  addBtn.textContent = 'Add to Archive';
  container.appendChild(addBtn);

  // Progress area
  const progressWrap = document.createElement('div');
  progressWrap.style.cssText = 'display:none;';
  const progressTrack = document.createElement('div');
  progressTrack.className = 'program-progress';
  const progressBar = document.createElement('div');
  progressBar.className = 'program-progress-bar';
  progressTrack.appendChild(progressBar);
  progressWrap.appendChild(progressTrack);
  const progressText = document.createElement('div');
  progressText.style.cssText = 'font-size:11px;margin-top:4px;';
  progressWrap.appendChild(progressText);
  container.appendChild(progressWrap);

  const win = createWindow({ title: 'WinZip \u2014 ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  sizeAndCenter(win, 340, 320);

  addBtn.addEventListener('click', () => {
    if (!selectedMethod) {
      showToast(contentEl, 'Select a compression method', true);
      return;
    }

    if (selectedMethod === correctMethod) {
      // Correct! Show compression progress
      addBtn.disabled = true;
      progressWrap.style.display = 'block';

      let progress = 0;
      const ratio = selectedMethod === 'store' ? 100
        : selectedMethod === 'deflate' ? 45 + Math.floor(Math.random() * 20)
        : 25 + Math.floor(Math.random() * 20);
      const resultSize = Math.floor(fakeSize * ratio / 100);

      const compressInterval = setInterval(() => {
        progress += 6 + Math.floor(Math.random() * 12);
        if (progress > 100) progress = 100;
        progressBar.style.width = progress + '%';
        progressText.textContent = 'Compressing... ' + fakeSize + ' KB \u2192 ' +
          Math.floor(resultSize * progress / 100) + ' KB (' + Math.floor(100 - ratio * progress / 100) + '% ratio)';

        if (progress >= 100) {
          clearInterval(compressInterval);
          progressText.textContent = 'Archive created: ' + fakeSize + ' KB \u2192 ' + resultSize + ' KB';
          setTimeout(() => {
            closeWindow(win);
            onComplete();
          }, 600);
        }
      }, 120);
    } else {
      showToast(contentEl, 'Warning: Compression method not suitable for this file type', true);
      // Reset radio buttons
      methodsDiv.querySelectorAll('input').forEach(r => { r.checked = false; });
      selectedMethod = null;
    }
  });
}

// --- 7. Paint (Image Editor) ---
function openPaintWindow(fileData, stepConfig, onComplete) {
  const correctTool = stepConfig.correctTool;
  const art = generateCanvasArt(fileData.name);

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'program-toolbar';
  toolbar.style.display = 'flex';
  toolbar.style.gap = '4px';

  const tools = [
    { id: 'rotate', label: 'Rotate 90°' },
    { id: 'flip', label: 'Flip H' },
    { id: 'crop', label: 'Crop' },
    { id: 'resize', label: 'Resize 50%' }
  ];

  const toolButtons = {};
  tools.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'pipeline-btn';
    btn.textContent = t.label;
    btn.dataset.tool = t.id;
    toolbar.appendChild(btn);
    toolButtons[t.id] = btn;
  });
  container.appendChild(toolbar);

  // Canvas area
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'paint-canvas-wrap';
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 140;
  canvas.style.cssText = 'border:1px solid #808080;background:#fff;';
  const ctx = canvas.getContext('2d');

  // Draw the art
  function drawArt() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    art.forEach(r => {
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });
  }
  drawArt();

  canvasWrap.appendChild(canvas);
  container.appendChild(canvasWrap);

  // Save bar (hidden)
  const saveBar = document.createElement('div');
  saveBar.style.cssText = 'padding:4px 8px;background:#c0c0c0;display:none;';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'pipeline-btn';
  saveBtn.textContent = 'Save';
  saveBtn.style.background = '#008000';
  saveBtn.style.color = '#fff';
  saveBar.appendChild(saveBtn);
  container.appendChild(saveBar);

  const win = createWindow({ title: 'Paint — ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win, 360, 320);

  Object.keys(toolButtons).forEach(toolId => {
    toolButtons[toolId].addEventListener('click', () => {
      if (toolId === correctTool) {
        toolButtons[toolId].style.background = '#008000';
        toolButtons[toolId].style.color = '#fff';

        // Animate transformation
        canvas.style.transition = 'transform 0.4s ease';
        if (toolId === 'rotate') {
          canvas.style.transform = 'rotate(90deg)';
        } else if (toolId === 'flip') {
          canvas.style.transform = 'scaleX(-1)';
        } else if (toolId === 'crop') {
          canvas.style.transform = 'scale(0.7)';
          canvas.style.border = '2px dashed #ff0000';
        } else if (toolId === 'resize') {
          canvas.style.transform = 'scale(0.5)';
        }

        setTimeout(() => {
          saveBar.style.display = 'block';
          saveBtn.addEventListener('click', () => {
            closeWindow(win);
            onComplete();
          });
        }, 500);
      } else {
        toolButtons[toolId].style.background = '#ff0000';
        toolButtons[toolId].style.color = '#fff';
        setTimeout(() => {
          toolButtons[toolId].style.background = '';
          toolButtons[toolId].style.color = '';
        }, 400);
        showToast(contentEl, 'Cannot apply ' + toolId + ' to this format', true);
      }
    });
  });
}

// --- 8. Notepad (Find & Replace) ---
function openNotepadWindow(fileData, stepConfig, onComplete) {
  const correctFind = stepConfig.find;
  const correctReplace = stepConfig.replace;

  const textContent = generateTextContent(correctFind);

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;';

  // Find/Replace toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'program-toolbar';
  toolbar.style.display = 'flex';
  toolbar.style.gap = '4px';
  toolbar.style.alignItems = 'center';
  toolbar.style.flexWrap = 'wrap';

  const findLabel = document.createElement('span');
  findLabel.textContent = 'Find:';
  findLabel.style.fontSize = '11px';
  toolbar.appendChild(findLabel);

  // Find dropdown
  const findSelect = document.createElement('select');
  findSelect.innerHTML = '<option value="">Select...</option>';
  const findOptions = FIND_REPLACE_POOL.map(p => p.find);
  const uniqueFinds = [...new Set(findOptions)];
  uniqueFinds.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    findSelect.appendChild(opt);
  });
  toolbar.appendChild(findSelect);

  const replLabel = document.createElement('span');
  replLabel.textContent = ' → ';
  replLabel.style.fontSize = '11px';
  toolbar.appendChild(replLabel);

  // Replace dropdown
  const replaceSelect = document.createElement('select');
  replaceSelect.innerHTML = '<option value="">Select...</option>';
  const replaceOptions = FIND_REPLACE_POOL.map(p => p.replace);
  const uniqueReplaces = [...new Set(replaceOptions)];
  uniqueReplaces.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    replaceSelect.appendChild(opt);
  });
  toolbar.appendChild(replaceSelect);

  const replaceAllBtn = document.createElement('button');
  replaceAllBtn.className = 'pipeline-btn';
  replaceAllBtn.textContent = 'Replace All';
  toolbar.appendChild(replaceAllBtn);

  container.appendChild(toolbar);

  // Text area
  const textArea = document.createElement('div');
  textArea.className = 'notepad-content';
  textArea.textContent = textContent;
  container.appendChild(textArea);

  // Save bar (hidden)
  const saveBar = document.createElement('div');
  saveBar.style.cssText = 'padding:4px 8px;background:#c0c0c0;display:none;';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'pipeline-btn';
  saveBtn.textContent = 'Save';
  saveBtn.style.background = '#008000';
  saveBtn.style.color = '#fff';
  saveBar.appendChild(saveBtn);
  container.appendChild(saveBar);

  const win = createWindow({ title: 'Notepad — ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win);

  replaceAllBtn.addEventListener('click', () => {
    if (findSelect.value === correctFind && replaceSelect.value === correctReplace) {
      // Count occurrences
      const regex = new RegExp(correctFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = textContent.match(regex);
      const count = matches ? matches.length : 0;

      // Highlight and replace
      const escaped = correctFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const highlightRegex = new RegExp(escaped, 'g');
      textArea.innerHTML = textContent.replace(highlightRegex,
        '<span class="notepad-highlight">' + correctFind + '</span>');

      setTimeout(() => {
        textArea.innerHTML = textContent.replace(highlightRegex,
          '<span class="notepad-highlight">' + correctReplace + '</span>');
        showToast(contentEl, count + ' replacements made', false);
        saveBar.style.display = 'block';
        saveBtn.addEventListener('click', () => {
          closeWindow(win);
          onComplete();
        });
      }, 800);
    } else {
      showToast(contentEl, '0 matches found', true);
      findSelect.value = '';
      replaceSelect.value = '';
    }
  });
}

// --- 9. Outlook Express (Email Client) ---
function openEmailWindow(fileData, stepConfig, onComplete) {
  const mode = stepConfig.mode;

  if (mode === 'download') {
    openEmailDownloadWindow(fileData, stepConfig, onComplete);
  } else {
    openEmailSendWindow(fileData, stepConfig, onComplete);
  }
}

function openEmailDownloadWindow(fileData, stepConfig, onComplete) {
  const attachment = stepConfig.attachment;
  const emails = generateInboxEmails(attachment);

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'program-toolbar';
  toolbar.textContent = 'Inbox — Outlook Express';
  container.appendChild(toolbar);

  // Email list
  const listWrap = document.createElement('div');
  listWrap.style.cssText = 'flex:1;overflow:auto;min-height:0;';

  const table = document.createElement('table');
  table.className = 'data-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>From</th><th>Subject</th><th>Size</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  // Preview pane
  const preview = document.createElement('div');
  preview.style.cssText = 'height:100px;overflow:auto;padding:8px;background:#fff;border-top:2px inset #808080;font-size:11px;white-space:pre-wrap;color:#808080;';
  preview.textContent = 'Select an email to preview...';

  emails.forEach(email => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML =
      '<td>' + email.from + '</td>' +
      '<td>' + email.subject + (email.hasAttachment ? ' 📎' : '') + '</td>' +
      '<td>' + email.size + '</td>';

    tr.addEventListener('click', () => {
      // Deselect others
      tbody.querySelectorAll('tr').forEach(r => {
        r.style.background = '';
        r.style.color = '';
      });
      tr.style.background = '#000080';
      tr.style.color = '#fff';

      // Show preview
      preview.style.color = '#000';
      if (email.hasAttachment) {
        preview.innerHTML = email.body +
          '\n\n<div style="margin-top:8px;border-top:1px solid #ccc;padding-top:8px;">' +
          '📎 Attachment: <strong>' + attachment + '</strong></div>';

        // Show save attachment button
        let saveBtn = preview.querySelector('.save-attach-btn');
        if (!saveBtn) {
          saveBtn = document.createElement('button');
          saveBtn.className = 'pipeline-btn save-attach-btn';
          saveBtn.textContent = 'Save Attachment';
          saveBtn.style.marginTop = '4px';
          saveBtn.style.background = '#008000';
          saveBtn.style.color = '#fff';
          preview.appendChild(saveBtn);
          saveBtn.addEventListener('click', () => {
            closeWindow(win);
            onComplete();
          });
        }
      } else {
        preview.textContent = email.body;
        showToast(contentEl, 'No attachment found', true);
      }
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  listWrap.appendChild(table);
  container.appendChild(listWrap);
  container.appendChild(preview);

  const win = createWindow({ title: 'Outlook Express — Inbox', content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win, 460, 380);
}

function openEmailSendWindow(fileData, stepConfig, onComplete) {
  const correctRecipient = stepConfig.recipient;

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:12px;gap:8px;';

  // To field
  const toRow = document.createElement('div');
  toRow.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;';
  toRow.innerHTML = '<strong>To:</strong>';
  const toSelect = document.createElement('select');
  toSelect.innerHTML = '<option value="">Select recipient...</option>';
  EMAIL_RECIPIENTS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.addr;
    opt.textContent = r.name + ' <' + r.addr + '>';
    toSelect.appendChild(opt);
  });
  toRow.appendChild(toSelect);
  container.appendChild(toRow);

  // Subject
  const subjRow = document.createElement('div');
  subjRow.style.cssText = 'font-size:12px;';
  subjRow.innerHTML = '<strong>Subject:</strong> RE: ' + fileData.name;
  container.appendChild(subjRow);

  // Attachment indicator
  const attachRow = document.createElement('div');
  attachRow.style.cssText = 'font-size:11px;color:#808080;';
  attachRow.textContent = '📎 Attached: ' + fileData.name;
  container.appendChild(attachRow);

  // Body
  const body = document.createElement('div');
  body.style.cssText = 'flex:1;border:2px inset #808080;padding:8px;background:#fff;font-size:11px;overflow:auto;white-space:pre-wrap;';
  body.textContent = 'Please find the processed file attached.\n\nRegards,\nData Processing Dept.';
  container.appendChild(body);

  // Send button
  const sendBtn = document.createElement('button');
  sendBtn.className = 'pipeline-btn';
  sendBtn.textContent = 'Send';
  sendBtn.style.alignSelf = 'flex-end';
  container.appendChild(sendBtn);

  // Progress area
  const progressWrap = document.createElement('div');
  progressWrap.style.cssText = 'display:none;';
  const progressText = document.createElement('div');
  progressText.style.cssText = 'font-size:11px;margin-bottom:4px;';
  progressWrap.appendChild(progressText);
  const progressTrack = document.createElement('div');
  progressTrack.className = 'program-progress';
  const progressBar = document.createElement('div');
  progressBar.className = 'program-progress-bar';
  progressTrack.appendChild(progressBar);
  progressWrap.appendChild(progressTrack);
  container.appendChild(progressWrap);

  const win = createWindow({ title: 'Outlook Express — New Message', content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win, 400, 340);

  sendBtn.addEventListener('click', () => {
    if (!toSelect.value) {
      showToast(contentEl, 'Select a recipient', true);
      return;
    }

    if (toSelect.value === correctRecipient) {
      sendBtn.disabled = true;
      progressWrap.style.display = 'block';
      progressText.textContent = 'Connecting to SMTP server...';

      let progress = 0;
      const steps = ['Connecting to SMTP server...', 'Authenticating...', 'Sending message...', 'Message sent!'];

      const sendInterval = setInterval(() => {
        progress += 6 + Math.floor(Math.random() * 10);
        if (progress > 100) progress = 100;
        progressBar.style.width = progress + '%';
        progressText.textContent = steps[Math.min(Math.floor(progress / 30), steps.length - 1)];

        if (progress >= 100) {
          clearInterval(sendInterval);
          setTimeout(() => {
            closeWindow(win);
            onComplete();
          }, 600);
        }
      }, 150);
    } else {
      showToast(contentEl, 'Undeliverable: mailbox not found', true);
      toSelect.value = '';
    }
  });
}

// --- 10. Dial-Up Networking (Modem) ---
function openDialupWindow(fileData, stepConfig, onComplete) {
  const correctNumber = stepConfig.number;

  const container = document.createElement('div');
  container.className = 'program-content';
  container.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:16px;gap:12px;';

  // Connection dialog
  const dialog = document.createElement('div');
  dialog.style.cssText = 'border:2px outset #fff;background:#c0c0c0;padding:16px;width:280px;font-size:12px;';

  const title = document.createElement('div');
  title.style.cssText = 'margin-bottom:12px;font-weight:bold;';
  title.textContent = 'Connect To';
  dialog.appendChild(title);

  const modemInfo = document.createElement('div');
  modemInfo.style.cssText = 'margin-bottom:8px;font-size:11px;color:#808080;';
  modemInfo.textContent = 'Modem: US Robotics 28.8K Faxmodem';
  dialog.appendChild(modemInfo);

  const phoneRow = document.createElement('div');
  phoneRow.style.cssText = 'margin-bottom:12px;';
  const phoneLabel = document.createElement('div');
  phoneLabel.style.cssText = 'margin-bottom:4px;';
  phoneLabel.textContent = 'Phone number:';
  phoneRow.appendChild(phoneLabel);

  const phoneSelect = document.createElement('select');
  phoneSelect.style.cssText = 'width:100%;font-family:monospace;padding:2px;';
  phoneSelect.innerHTML = '<option value="">Select number...</option>';
  PHONE_NUMBERS.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = n;
    phoneSelect.appendChild(opt);
  });
  phoneRow.appendChild(phoneSelect);
  dialog.appendChild(phoneRow);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
  const connectBtn = document.createElement('button');
  connectBtn.className = 'pipeline-btn';
  connectBtn.textContent = 'Connect';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'pipeline-btn';
  cancelBtn.textContent = 'Cancel';
  btnRow.appendChild(connectBtn);
  btnRow.appendChild(cancelBtn);
  dialog.appendChild(btnRow);
  container.appendChild(dialog);

  const win = createWindow({ title: 'Dial-Up Networking — ' + fileData.name, content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  sizeAndCenter(win, 340, 320);

  cancelBtn.addEventListener('click', () => {
    closeWindow(win);
    const fileEl = document.getElementById(fileData.id);
    if (fileEl) fileEl.style.display = '';
  });

  connectBtn.addEventListener('click', () => {
    if (!phoneSelect.value) {
      showToast(contentEl, 'Select a phone number', true);
      return;
    }

    if (phoneSelect.value === correctNumber) {
      // Correct! Transition to terminal
      dialog.remove();

      const terminal = document.createElement('div');
      terminal.className = 'modem-terminal';
      container.style.padding = '0';
      container.style.alignItems = 'stretch';

      const lines = [
        { text: 'ATZ', delay: 0 },
        { text: 'OK', delay: 400 },
        { text: 'ATDT ' + correctNumber, delay: 800 },
        { text: 'RING...', delay: 1400 },
        { text: 'RING...', delay: 2000 },
        { text: 'CARRIER 28800', delay: 2600 },
        { text: 'CONNECT 28800/ARQ/V34/LAPM', delay: 3000 }
      ];

      let lineIdx = 0;
      function addLine() {
        if (lineIdx >= lines.length) {
          // Show transfer progress
          showTransfer();
          return;
        }
        const line = document.createElement('div');
        line.textContent = lines[lineIdx].text;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
        lineIdx++;
        if (lineIdx < lines.length) {
          setTimeout(addLine, lines[lineIdx].delay - lines[lineIdx - 1].delay);
        } else {
          setTimeout(addLine, 400);
        }
      }

      container.appendChild(terminal);
      setTimeout(addLine, 300);

      function showTransfer() {
        const transferLine = document.createElement('div');
        transferLine.style.marginTop = '8px';
        transferLine.textContent = 'Transferring: ' + fileData.name;
        terminal.appendChild(transferLine);

        const progressLine = document.createElement('div');
        terminal.appendChild(progressLine);

        let progress = 0;
        const barWidth = 20;
        const transferInterval = setInterval(() => {
          progress += 3 + Math.floor(Math.random() * 5);
          if (progress > 100) progress = 100;
          const filled = Math.floor(progress / 100 * barWidth);
          const empty = barWidth - filled;
          const speed = (1.2 + Math.random() * 2.5).toFixed(1);
          progressLine.textContent = '[' + '█'.repeat(filled) + '░'.repeat(empty) + '] ' + progress + '% ' + speed + ' KB/s';
          terminal.scrollTop = terminal.scrollHeight;

          if (progress >= 100) {
            clearInterval(transferInterval);
            const doneLine = document.createElement('div');
            doneLine.style.marginTop = '4px';
            doneLine.textContent = 'Transfer complete.';
            terminal.appendChild(doneLine);
            const disconnectLine = document.createElement('div');
            disconnectLine.textContent = 'NO CARRIER';
            terminal.appendChild(disconnectLine);
            terminal.scrollTop = terminal.scrollHeight;
            setTimeout(() => {
              closeWindow(win);
              onComplete();
            }, 800);
          }
        }, 200);
      }
    } else {
      // Wrong number — show NO CARRIER in terminal-like style
      dialog.remove();

      const terminal = document.createElement('div');
      terminal.className = 'modem-terminal';
      container.style.padding = '0';
      container.style.alignItems = 'stretch';

      container.appendChild(terminal);

      const modemLines = [
        { text: 'ATZ', delay: 300 },
        { text: 'OK', delay: 700 },
        { text: 'ATDT ' + phoneSelect.value, delay: 1100 },
        { text: 'RING...', delay: 1700 }
      ];

      let idx = 0;
      function addModemLine() {
        if (idx >= modemLines.length) {
          // NO CARRIER
          setTimeout(() => {
            const errLine = document.createElement('div');
            errLine.className = 'modem-error';
            errLine.textContent = 'NO CARRIER';
            terminal.appendChild(errLine);
            terminal.scrollTop = terminal.scrollHeight;

            // Retry button
            setTimeout(() => {
              const retryBtn = document.createElement('button');
              retryBtn.className = 'pipeline-btn';
              retryBtn.textContent = 'Retry';
              retryBtn.style.cssText = 'margin:8px;';
              container.appendChild(retryBtn);
              retryBtn.addEventListener('click', () => {
                // Rebuild the dialog
                terminal.remove();
                retryBtn.remove();
                container.style.padding = '16px';
                container.style.alignItems = 'center';
                const newDialog = dialog.cloneNode(true);
                container.appendChild(newDialog);

                // Re-bind events on new dialog
                const newPhoneSelect = newDialog.querySelector('select');
                const newConnectBtn = newDialog.querySelectorAll('button')[0];
                const newCancelBtn = newDialog.querySelectorAll('button')[1];

                newCancelBtn.addEventListener('click', () => {
                  closeWindow(win);
                  const fileEl = document.getElementById(fileData.id);
                  if (fileEl) fileEl.style.display = '';
                });

                newConnectBtn.addEventListener('click', () => {
                  // Re-attempt connection — rebuild by reopening
                  closeWindow(win);
                  const fileEl = document.getElementById(fileData.id);
                  if (fileEl) fileEl.style.display = '';
                  // Re-open with same config
                  setTimeout(() => {
                    const fileElAgain = document.getElementById(fileData.id);
                    if (fileElAgain) fileElAgain.style.display = 'none';
                    openDialupWindow(fileData, { number: correctNumber }, onComplete);
                  }, 100);
                });
              });
            }, 600);
          }, 800);
          return;
        }
        setTimeout(() => {
          const line = document.createElement('div');
          line.textContent = modemLines[idx].text;
          terminal.appendChild(line);
          terminal.scrollTop = terminal.scrollHeight;
          idx++;
          addModemLine();
        }, idx === 0 ? modemLines[0].delay : modemLines[idx].delay - modemLines[idx - 1].delay);
      }
      addModemLine();
    }
  });
}

// ==================== WINDOW SIZING HELPER ====================

function sizeAndCenter(win, w, h) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;
  if (isMobile) {
    win.classList.add('maximized');
  } else {
    const ww = w || Math.min(500, vw - 40);
    const wh = h || Math.min(420, vh - 100);
    win.style.width = ww + 'px';
    win.style.height = wh + 'px';
    win.style.left = ((vw - ww) / 2) + 'px';
    win.style.top = ((vh - 40 - wh) / 2) + 'px';
  }
}

// ==================== PROGRAM REGISTRY ====================

const PROGRAMS = {
  database: {
    label: 'SQL Query Tool',
    drawIcon: drawDatabaseProgramIcon,
    openWindow: openDatabaseWindow,
    terminal: false
  },
  spreadsheet: {
    label: 'Spreadsheet',
    drawIcon: drawSpreadsheetProgramIcon,
    openWindow: openSpreadsheetWindow,
    terminal: false
  },
  logviewer: {
    label: 'Log Viewer',
    drawIcon: drawLogViewerProgramIcon,
    openWindow: openLogViewerWindow,
    terminal: false
  },
  printer: {
    label: 'Printer',
    drawIcon: drawPrinterProgramIcon,
    openWindow: openPrinterWindow,
    terminal: true
  },
  ftp: {
    label: 'FTP Upload',
    drawIcon: drawFtpProgramIcon,
    openWindow: openFtpWindow,
    terminal: true
  },
  archive: {
    label: 'WinZip',
    drawIcon: drawArchiveProgramIcon,
    openWindow: openArchiveWindow,
    terminal: false
  },
  paint: {
    label: 'Paint',
    drawIcon: drawPaintProgramIcon,
    openWindow: openPaintWindow,
    terminal: false
  },
  notepad: {
    label: 'Notepad',
    drawIcon: drawNotepadProgramIcon,
    openWindow: openNotepadWindow,
    terminal: false
  },
  email: {
    label: 'Outlook Express',
    drawIcon: drawEmailProgramIcon,
    openWindow: openEmailWindow,
    terminal: false // terminal determined dynamically by mode
  },
  dialup: {
    label: 'Dial-Up',
    drawIcon: drawDialupProgramIcon,
    openWindow: openDialupWindow,
    terminal: true
  }
};

// ==================== PIPELINE TEMPLATES (16) ====================

const PIPELINE_TEMPLATES = [
  // Reports & Documents
  {
    name: 'sales_q3.csv', steps: [
      { program: 'database', config: { column: 'Region', value: 'East' }, outputSuffix: '_extract', outputExt: '.dat' },
      { program: 'spreadsheet', config: { fn: 'pivot' }, outputSuffix: '_report', outputExt: '.xls' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'budget_1998.csv', steps: [
      { program: 'spreadsheet', config: { fn: 'sum' }, outputSuffix: '_totals', outputExt: '.xls' },
      { program: 'logviewer', config: { action: 'format' }, outputSuffix: '_formatted', outputExt: '.txt' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'orders_oct.csv', steps: [
      { program: 'database', config: { column: 'Status', value: 'Active' }, outputSuffix: '_active', outputExt: '.dat' },
      { program: 'spreadsheet', config: { fn: 'sum' }, outputSuffix: '_totals', outputExt: '.xls' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'earnings_q2.dat', steps: [
      { program: 'database', config: { column: 'Quarter', value: 'Q2' }, outputSuffix: '_q2', outputExt: '.dat' },
      { program: 'spreadsheet', config: { fn: 'average' }, outputSuffix: '_avg', outputExt: '.xls' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'staff_changes.csv', steps: [
      { program: 'database', config: { column: 'Department', value: 'Sales' }, outputSuffix: '_sales', outputExt: '.dat' },
      { program: 'logviewer', config: { action: 'format' }, outputSuffix: '_formatted', outputExt: '.txt' },
      { program: 'printer', config: {} }
    ]
  },
  // Server & IT
  {
    name: 'apache_1014.log', steps: [
      { program: 'logviewer', config: { action: 'strip-errors' }, outputSuffix: '_clean', outputExt: '.log' },
      { program: 'database', config: { column: 'Status', value: 'Error' }, outputSuffix: '_errors', outputExt: '.dat' },
      { program: 'ftp', config: { dir: '/data/reports/' } }
    ]
  },
  {
    name: 'userdata_backup.dat', steps: [
      { program: 'archive', config: { method: 'deflate64' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'ftp', config: { dir: '/home/backups/' } }
    ]
  },
  {
    name: 'audit_oct98.log', steps: [
      { program: 'logviewer', config: { action: 'extract' }, outputSuffix: '_data', outputExt: '.txt' },
      { program: 'spreadsheet', config: { fn: 'sort' }, outputSuffix: '_sorted', outputExt: '.xls' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'legacy_db.mdb', steps: [
      { program: 'database', config: { column: 'Status', value: 'Active' }, outputSuffix: '_active', outputExt: '.dat' },
      { program: 'archive', config: { method: 'deflate' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'ftp', config: { dir: '/tmp/staging/' } }
    ]
  },
  // Customer & External
  {
    name: 'contacts_vip.csv', steps: [
      { program: 'database', config: { column: 'Region', value: 'West' }, outputSuffix: '_west', outputExt: '.dat' },
      { program: 'spreadsheet', config: { fn: 'sort' }, outputSuffix: '_sorted', outputExt: '.xls' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'client_acme.mdb', steps: [
      { program: 'database', config: { column: 'Status', value: 'Active' }, outputSuffix: '_active', outputExt: '.dat' },
      { program: 'archive', config: { method: 'store' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'ftp', config: { dir: '/data/reports/' } }
    ]
  },
  {
    name: 'vendor_prices.csv', steps: [
      { program: 'spreadsheet', config: { fn: 'average' }, outputSuffix: '_avg', outputExt: '.xls' },
      { program: 'database', config: { column: 'Department', value: 'Purchasing' }, outputSuffix: '_dept', outputExt: '.dat' },
      { program: 'logviewer', config: { action: 'format' }, outputSuffix: '_formatted', outputExt: '.txt' }
    ]
  },
  // Finance & Compliance
  {
    name: 'transactions_1998.csv', steps: [
      { program: 'database', config: { column: 'Quarter', value: 'Q4' }, outputSuffix: '_q4', outputExt: '.dat' },
      { program: 'spreadsheet', config: { fn: 'sum' }, outputSuffix: '_totals', outputExt: '.xls' },
      { program: 'archive', config: { method: 'deflate' }, outputSuffix: '_packed', outputExt: '.zip' }
    ]
  },
  {
    name: 'expenses_dept.csv', steps: [
      { program: 'spreadsheet', config: { fn: 'sum' }, outputSuffix: '_totals', outputExt: '.xls' },
      { program: 'database', config: { column: 'Status', value: 'Pending' }, outputSuffix: '_pending', outputExt: '.dat' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'audit_records.mdb', steps: [
      { program: 'database', config: { column: 'Status', value: 'Active' }, outputSuffix: '_active', outputExt: '.dat' },
      { program: 'logviewer', config: { action: 'dedup' }, outputSuffix: '_dedup', outputExt: '.txt' },
      { program: 'archive', config: { method: 'deflate64' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'ftp', config: { dir: '/home/backups/' } }
    ]
  },
  // Ad-Hoc
  {
    name: 'new_products.csv', steps: [
      { program: 'logviewer', config: { action: 'extract' }, outputSuffix: '_data', outputExt: '.txt' },
      { program: 'ftp', config: { dir: '/var/www/public/' } }
    ]
  },

  // === Outlook Express pipelines ===
  {
    name: 'inbox_reports.eml', steps: [
      { program: 'email', config: { mode: 'download', attachment: 'quarterly_data' }, outputSuffix: '_data', outputExt: '.csv' },
      { program: 'spreadsheet', config: { fn: 'sum' }, outputSuffix: '_totals', outputExt: '.xls' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'client_docs.eml', steps: [
      { program: 'email', config: { mode: 'download', attachment: 'client_contract' }, outputSuffix: '_contract', outputExt: '.dat' },
      { program: 'archive', config: { method: 'deflate' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'ftp', config: { dir: '/home/backups/' } }
    ]
  },
  {
    name: 'sales_west.csv', steps: [
      { program: 'database', config: { column: 'Region', value: 'West' }, outputSuffix: '_west', outputExt: '.dat' },
      { program: 'spreadsheet', config: { fn: 'pivot' }, outputSuffix: '_report', outputExt: '.xls' },
      { program: 'email', config: { mode: 'send', recipient: 'client@acme.com' } }
    ]
  },
  {
    name: 'server_errors.log', steps: [
      { program: 'logviewer', config: { action: 'strip-errors' }, outputSuffix: '_clean', outputExt: '.log' },
      { program: 'email', config: { mode: 'send', recipient: 'boss@company.com' } }
    ]
  },

  // === Paint pipelines ===
  {
    name: 'diagram_v2.bmp', steps: [
      { program: 'paint', config: { correctTool: 'resize' }, outputSuffix: '_resized', outputExt: '.bmp' },
      { program: 'archive', config: { method: 'deflate' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'ftp', config: { dir: '/var/www/public/' } }
    ]
  },
  {
    name: 'scanned_page.bmp', steps: [
      { program: 'paint', config: { correctTool: 'rotate' }, outputSuffix: '_rotated', outputExt: '.bmp' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'photo_team.bmp', steps: [
      { program: 'paint', config: { correctTool: 'crop' }, outputSuffix: '_cropped', outputExt: '.bmp' },
      { program: 'archive', config: { method: 'deflate64' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'email', config: { mode: 'send', recipient: 'team@company.com' } }
    ]
  },

  // === Notepad pipelines ===
  {
    name: 'server.ini', steps: [
      { program: 'notepad', config: { find: 'localhost', replace: '192.168.1.50' }, outputSuffix: '_updated', outputExt: '.ini' },
      { program: 'archive', config: { method: 'deflate' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'ftp', config: { dir: '/tmp/staging/' } }
    ]
  },
  {
    name: 'webapp.conf', steps: [
      { program: 'notepad', config: { find: 'http://', replace: 'https://' }, outputSuffix: '_secure', outputExt: '.conf' },
      { program: 'printer', config: {} }
    ]
  },
  {
    name: 'deploy.bat', steps: [
      { program: 'notepad', config: { find: 'debug', replace: 'production' }, outputSuffix: '_prod', outputExt: '.bat' },
      { program: 'email', config: { mode: 'send', recipient: 'team@company.com' } }
    ]
  },
  {
    name: 'system_oct.log', steps: [
      { program: 'logviewer', config: { action: 'strip-errors' }, outputSuffix: '_clean', outputExt: '.log' },
      { program: 'notepad', config: { find: 'ERROR', replace: 'WARNING' }, outputSuffix: '_patched', outputExt: '.log' },
      { program: 'archive', config: { method: 'deflate64' }, outputSuffix: '_packed', outputExt: '.zip' }
    ]
  },

  // === Dial-Up pipelines ===
  {
    name: 'shareware_data.csv', steps: [
      { program: 'spreadsheet', config: { fn: 'sort' }, outputSuffix: '_sorted', outputExt: '.xls' },
      { program: 'archive', config: { method: 'deflate64' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'dialup', config: { number: '555-0333' } }
    ]
  },
  {
    name: 'customer_records.mdb', steps: [
      { program: 'database', config: { column: 'Status', value: 'Active' }, outputSuffix: '_active', outputExt: '.dat' },
      { program: 'archive', config: { method: 'deflate' }, outputSuffix: '_packed', outputExt: '.zip' },
      { program: 'dialup', config: { number: '555-0147' } }
    ]
  },
  {
    name: 'patch_notes.txt', steps: [
      { program: 'notepad', config: { find: 'DISABLED', replace: 'ENABLED' }, outputSuffix: '_enabled', outputExt: '.txt' },
      { program: 'dialup', config: { number: '555-0200' } }
    ]
  }
];

// ==================== WAVE CONFIGURATIONS ====================

// Procedural wave generation — all waves are random
const WAVE_HINTS = [
  'Drag files to the correct program',
  'Check the Work Queue for next steps',
  'Keep the pipelines moving!',
  'Full capacity — all systems go!',
  'More jobs incoming!',
  'Stay sharp — pipelines are piling up!',
  'No rest for the data wrangler!',
  'Process all jobs before the boss notices!'
];

function getWaveConfig(waveNumber) {
  const allPrograms = Object.keys(PROGRAMS);
  // Ramp up: start with fewer programs/jobs, scale toward full roster
  const programCount = Math.min(allPrograms.length, 3 + Math.floor(waveNumber / 2));
  const programs = randomSample(allPrograms, programCount);
  // Ensure at least one terminal program is available
  const terminals = programs.filter(p => PROGRAMS[p].terminal || p === 'email' || p === 'dialup' || p === 'printer');
  if (terminals.length === 0) {
    // Swap one non-terminal for printer
    const nonTermIdx = programs.findIndex(p => p !== 'spreadsheet' && p !== 'logviewer');
    if (nonTermIdx >= 0) programs[nonTermIdx] = 'printer';
    else programs.push('printer');
  }

  const jobCount = Math.min(6, 1 + Math.floor(waveNumber * 0.6) + Math.floor(Math.random() * 2));
  const maxSteps = Math.min(4, 2 + Math.floor(waveNumber / 3));
  const hint = randomChoice(WAVE_HINTS);

  return { wave: waveNumber, jobCount, maxSteps, programs, hint };
}

// ==================== GAME STATE ====================

let comboCount = 0;
let workQueueWindowEl = null;
let pipelineJobs = []; // Array of active job objects

// ==================== STEP HINT GENERATOR ====================

// Produces a short human-readable instruction for a pipeline step
function describeStep(step) {
  const prog = PROGRAMS[step.program];
  const label = prog.label;
  const cfg = step.config;

  if (step.program === 'database') {
    return '\u2192 ' + label + ': filter ' + cfg.column + '=' + cfg.value;
  }
  if (step.program === 'spreadsheet') {
    const fnNames = { sum: 'SUM', average: 'AVERAGE', sort: 'SORT', pivot: 'PIVOT' };
    return '\u2192 ' + label + ': apply ' + (fnNames[cfg.fn] || cfg.fn);
  }
  if (step.program === 'logviewer') {
    const actionNames = { 'strip-errors': 'Strip Errors', extract: 'Extract Data', format: 'Format Report', dedup: 'Remove Dupes' };
    return '\u2192 ' + label + ': ' + (actionNames[cfg.action] || cfg.action);
  }
  if (step.program === 'printer') {
    return '\u2192 ' + label + ': print the file';
  }
  if (step.program === 'ftp') {
    return '\u2192 ' + label + ': upload to ' + cfg.dir;
  }
  if (step.program === 'archive') {
    const methodNames = { store: 'Store', deflate: 'Deflate', deflate64: 'Deflate64' };
    return '\u2192 ' + label + ': compress (' + (methodNames[cfg.method] || cfg.method) + ')';
  }
  if (step.program === 'paint') {
    const toolNames = { rotate: 'Rotate 90°', flip: 'Flip H', crop: 'Crop', resize: 'Resize 50%' };
    return '\u2192 ' + label + ': apply ' + (toolNames[cfg.correctTool] || cfg.correctTool);
  }
  if (step.program === 'notepad') {
    return '\u2192 ' + label + ': replace \'' + cfg.find + '\' → \'' + cfg.replace + '\'';
  }
  if (step.program === 'email') {
    if (cfg.mode === 'download') {
      return '\u2192 ' + label + ': download attachment';
    }
    return '\u2192 ' + label + ': send to ' + cfg.recipient;
  }
  if (step.program === 'dialup') {
    return '\u2192 Dial-Up: connect to ' + cfg.number;
  }
  return '\u2192 ' + label;
}

// ==================== WORK QUEUE WINDOW ====================

function createWorkQueueWindow() {
  const container = document.createElement('div');
  container.style.cssText = 'font-size:11px;padding:0;';

  const table = document.createElement('table');
  table.className = 'work-queue-table';
  table.innerHTML = '<thead><tr><th>WO#</th><th>File</th><th>Next Step</th><th>Done</th></tr></thead>';
  const tbody = document.createElement('tbody');
  tbody.id = 'work-queue-body';
  table.appendChild(tbody);
  container.appendChild(table);

  const win = createWindow({ title: 'Work Queue', content: container });
  const contentEl = win.querySelector('.window-content');
  contentEl.style.padding = '0';

  // Position top-right
  const vw = window.innerWidth;
  const isMobile = vw < 768;
  if (isMobile) {
    win.style.width = '90vw';
    win.style.left = '5vw';
    win.style.top = '10px';
    win.style.maxHeight = '180px';
  } else {
    win.style.width = '420px';
    win.style.left = (vw - 440) + 'px';
    win.style.top = '20px';
    win.style.maxHeight = '260px';
  }

  workQueueWindowEl = win;
  updateWorkQueue();
}

function updateWorkQueue() {
  const tbody = document.getElementById('work-queue-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  pipelineJobs.forEach((job, idx) => {
    const tr = document.createElement('tr');
    const woNum = 'WO-' + String(idx + 1).padStart(3, '0');

    const currentStep = job.currentStep;
    const totalSteps = job.pipeline.length;
    const isComplete = currentStep >= totalSteps;

    if (isComplete) {
      tr.style.textDecoration = 'line-through';
      tr.style.opacity = '0.4';
    }

    // Build descriptive hint for the next step
    const nextStepLabel = isComplete ? 'Done' : describeStep(job.pipeline[currentStep]);

    tr.innerHTML =
      '<td>' + woNum + '</td>' +
      '<td>' + job.name + '</td>' +
      '<td class="wq-step-hint">' + nextStepLabel + '</td>' +
      '<td>' + currentStep + '/' + totalSteps + '</td>';

    // Click to highlight both the file and the target program folder
    if (!isComplete) {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        const fileEl = document.getElementById(job.id);
        if (fileEl) {
          fileEl.style.outline = '3px solid #ffff00';
          fileEl.style.outlineOffset = '4px';
          setTimeout(() => {
            fileEl.style.outline = '';
            fileEl.style.outlineOffset = '';
          }, 1500);
        }
        // Also highlight the target program folder
        const targetProgramLabel = PROGRAMS[job.pipeline[currentStep].program].label;
        const folderEl = document.querySelector('.folder[data-folder-name="' + targetProgramLabel + '"]');
        if (folderEl) {
          folderEl.style.outline = '3px solid #00ff00';
          folderEl.style.outlineOffset = '4px';
          setTimeout(() => {
            folderEl.style.outline = '';
            folderEl.style.outlineOffset = '';
          }, 1500);
        }
      });
    }

    tbody.appendChild(tr);
  });
}

// ==================== FILE ICON RESOLVER ====================

function getIconForProgram(programId) {
  if (programId === 'database') return drawDatabaseFileIcon;
  if (programId === 'spreadsheet') return drawSpreadsheetIcon;
  if (programId === 'logviewer') return drawLogFileIcon;
  if (programId === 'archive') return drawArchiveIcon;
  if (programId === 'printer') return drawPrintedFileIcon;
  if (programId === 'ftp') return drawDocumentIcon;
  if (programId === 'paint') return drawPaintFileIcon;
  if (programId === 'notepad') return drawNotepadFileIcon;
  if (programId === 'email') return drawEmailFileIcon;
  if (programId === 'dialup') return drawDocumentIcon;
  return drawDocumentIcon;
}

function getInitialIconForFile(filename) {
  if (filename.endsWith('.csv')) return drawSpreadsheetIcon;
  if (filename.endsWith('.log')) return drawLogFileIcon;
  if (filename.endsWith('.dat')) return drawDatabaseFileIcon;
  if (filename.endsWith('.mdb')) return drawDatabaseFileIcon;
  if (filename.endsWith('.bmp')) return drawPaintFileIcon;
  if (filename.endsWith('.ini') || filename.endsWith('.conf') || filename.endsWith('.bat')) return drawNotepadFileIcon;
  if (filename.endsWith('.eml')) return drawEmailFileIcon;
  if (filename.endsWith('.txt')) return drawDocumentIcon;
  return drawDocumentIcon;
}

// ==================== DROP HANDLER ====================

function checkPipelineDrop(fileId, folderName) {
  const job = pipelineJobs.find(j => j.id === fileId);
  if (!job) return;

  const currentStep = job.currentStep;
  if (currentStep >= job.pipeline.length) return;

  const step = job.pipeline[currentStep];
  const expectedProgram = step.program;
  const expectedLabel = PROGRAMS[expectedProgram].label;

  const fileEl = document.getElementById(fileId);
  if (!fileEl) return;

  const rect = fileEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Check if dropped on the correct program folder
  if (folderName !== expectedLabel) {
    // Wrong program!
    comboCount = 0;
    gameState.score = Math.max(0, gameState.score - 5);
    updateScore();
    screenShake();
    triggerCRTFlicker();

    // Show error text
    const targetEl = document.querySelector('.folder[data-folder-name="' + folderName + '"]');
    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      const desktop = document.getElementById('desktop');
      const dBounds = desktop.getBoundingClientRect();
      const errText = document.createElement('div');
      errText.className = 'wrong-drop-text';
      errText.textContent = 'Wrong program!';
      errText.style.left = (tRect.left - dBounds.left + tRect.width / 2) + 'px';
      errText.style.top = (tRect.top - dBounds.top - 20) + 'px';
      desktop.appendChild(errText);
      setTimeout(() => errText.remove(), 800);
    }

    fileEl.classList.add('wrong');
    setTimeout(() => fileEl.classList.remove('wrong'), 300);
    return;
  }

  // Correct program! Hide file and open program window
  fileEl.style.display = 'none';

  const programDef = PROGRAMS[expectedProgram];
  programDef.openWindow(job, step.config, () => {
    // On complete callback
    comboCount++;
    let score = 10 * gameState.wave;
    if (comboCount >= 3) {
      score += 5 * Math.floor(comboCount / 3);
    }
    gameState.score += score;
    updateScore();

    createParticleBurst(centerX, centerY);

    job.currentStep++;
    // Email in send mode acts as terminal
    const isEmailSend = step.program === 'email' && step.config.mode === 'send';
    const isTerminal = programDef.terminal || isEmailSend || job.currentStep >= job.pipeline.length;

    if (isTerminal) {
      // File consumed — remove from desktop and activeFiles
      fileEl.remove();
      gameState.activeFiles = gameState.activeFiles.filter(f => f.id !== fileId);

      // Pipeline completion bonus
      gameState.score += 15 * gameState.wave;
      updateScore();
    } else {
      // Transform file on desktop: update name, icon, label
      const nextStep = job.pipeline[job.currentStep];
      const prevStep = job.pipeline[job.currentStep - 1];
      const baseName = job.baseName + (prevStep.outputSuffix || '');
      job.baseName = baseName;
      job.name = baseName + (prevStep.outputExt || '.dat');

      // Update the DOM element
      const canvas = fileEl.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const drawFn = getIconForProgram(prevStep.program);
        drawFn(ctx);
      }
      const label = fileEl.querySelector('.file-label');
      if (label) label.textContent = job.name;

      fileEl.style.display = '';
    }

    gameState.totalFilesSorted = (gameState.totalFilesSorted || 0) + 1;
    updateWorkQueue();

    // Check if all jobs are done
    const allDone = pipelineJobs.every(j => j.currentStep >= j.pipeline.length);
    if (allDone) {
      comboCount = 0;
      onWaveComplete();
    }
  });

  updateWorkQueue();
}

// ==================== SELECT PIPELINES FOR WAVE ====================

function selectPipelinesForWave(config) {
  // Filter templates to those that only use available programs and fit step count
  const available = new Set(config.programs);
  const valid = PIPELINE_TEMPLATES.filter(t => {
    if (t.steps.length > config.maxSteps) return false;
    return t.steps.every(s => available.has(s.program));
  });

  if (valid.length === 0) {
    // Fallback: use any template but truncate steps
    return randomSample(PIPELINE_TEMPLATES, config.jobCount).map(t => ({
      ...t,
      steps: t.steps.slice(0, config.maxSteps).filter(s => available.has(s.program))
    })).filter(t => t.steps.length > 0);
  }

  return randomSample(valid, Math.min(config.jobCount, valid.length));
}

// ==================== TASK REGISTRATION ====================

registerTask('data-pipeline', {
  getWaveConfig(waveNumber) {
    const config = getWaveConfig(waveNumber);
    return { ...config, criteria: 'pipeline' };
  },

  getCriteriaText() {
    return 'Process files through the data pipeline';
  },

  spawnItems(config) {
    clearDesktop();
    comboCount = 0;
    pipelineJobs = [];
    workQueueWindowEl = null;

    setOnDropCallback(checkPipelineDrop);

    // Create program folders (drop targets)
    const folderElements = [];
    config.programs.forEach(programId => {
      const prog = PROGRAMS[programId];
      if (!prog) return;

      // Create a custom folder with the program icon
      const folderEl = document.createElement('div');
      folderEl.className = 'folder';
      folderEl.dataset.folderName = prog.label;

      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      canvas.style.imageRendering = 'pixelated';
      prog.drawIcon(canvas.getContext('2d'));
      folderEl.appendChild(canvas);

      const label = document.createElement('div');
      label.className = 'folder-label';
      label.textContent = prog.label;
      folderEl.appendChild(label);

      // Add drag handlers from ui.js pattern
      folderEl.addEventListener('mousedown', function(e) {
        // Folders don't drag in this task — they're fixed targets
      });

      document.getElementById('desktop').appendChild(folderEl);
      folderElements.push(folderEl);
      gameState.folders.push(prog.label);
    });

    setTimeout(() => positionFolders(folderElements), 0);

    // Select pipelines for this wave
    const selectedPipelines = selectPipelinesForWave(config);

    // Create file positions
    const filePositions = generateFilePositions(selectedPipelines.length);

    // Spawn files
    selectedPipelines.forEach((template, i) => {
      const baseName = template.name.replace(/\.[^.]+$/, '');
      const job = {
        id: generateId(),
        jobId: 'WO-' + String(i + 1).padStart(3, '0'),
        name: template.name,
        baseName: baseName,
        currentStep: 0,
        pipeline: template.steps
      };

      pipelineJobs.push(job);
      gameState.activeFiles.push({ id: job.id, name: job.name });

      const drawFn = getInitialIconForFile(template.name);
      renderFile(job, filePositions[i], {
        createIconFn: () => createFileIconCanvas(drawFn),
        onPreview: () => {} // No preview in pipeline mode
      }, i);
    });

    // Create Work Queue window
    setTimeout(() => createWorkQueueWindow(), 100);

    saveState();
  }
});
