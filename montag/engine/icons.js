// Icon drawing functions (pixel art for file types and folders)

import { ICON_SIZE, PIXEL_SIZE, FILE_SIZE, FOLDER_SIZE } from './state.js';

// Helper to draw a single pixel
export function drawPixel(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// Helper to draw a rectangle
export function drawRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Image icon - tiny landscape
export function drawImageIcon(ctx) {
  // Border
  drawRect(ctx, 0, 0, 32, 32, '#ffffff');
  drawRect(ctx, 1, 1, 30, 30, '#000000');
  drawRect(ctx, 2, 2, 28, 28, '#87ceeb');

  // Mountains
  ctx.fillStyle = '#8b4513';
  ctx.beginPath();
  ctx.moveTo(8, 20);
  ctx.lineTo(14, 10);
  ctx.lineTo(20, 20);
  ctx.fill();

  // Sun
  drawRect(ctx, 24, 6, 4, 4, '#ffff00');

  // Ground
  drawRect(ctx, 2, 20, 28, 10, '#228b22');
}

// Document icon - page with lines
export function drawDocumentIcon(ctx) {
  // Page
  drawRect(ctx, 6, 4, 20, 24, '#ffffff');
  drawRect(ctx, 7, 5, 18, 22, '#f0f0f0');

  // Lines
  for (let i = 0; i < 6; i++) {
    drawRect(ctx, 9, 9 + i * 3, 14, 1, '#000000');
  }

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 4, 20, 24);
}

// Spreadsheet icon - grid
export function drawSpreadsheetIcon(ctx) {
  // Background
  drawRect(ctx, 4, 4, 24, 24, '#ffffff');

  // Grid lines
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(4, 4 + i * 6);
    ctx.lineTo(28, 4 + i * 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4 + i * 6, 4);
    ctx.lineTo(4 + i * 6, 28);
    ctx.stroke();
  }

  // Header row
  drawRect(ctx, 4, 4, 24, 6, '#4169e1');
}

// Music icon - note
export function drawMusicIcon(ctx) {
  // Background circle
  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  ctx.fill();

  // Note stem
  drawRect(ctx, 20, 8, 2, 12, '#000000');

  // Note head
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(18, 20, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Note flag
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(22, 8);
  ctx.lineTo(22, 12);
  ctx.lineTo(26, 10);
  ctx.fill();
}

// Video icon - film strip
export function drawVideoIcon(ctx) {
  // Frame
  drawRect(ctx, 4, 8, 24, 16, '#000000');
  drawRect(ctx, 6, 10, 20, 12, '#4169e1');

  // Play button
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(14, 13);
  ctx.lineTo(14, 19);
  ctx.lineTo(20, 16);
  ctx.fill();

  // Film perforations
  for (let i = 0; i < 3; i++) {
    drawRect(ctx, 4, 10 + i * 4, 2, 2, '#ff0000');
    drawRect(ctx, 26, 10 + i * 4, 2, 2, '#ff0000');
  }
}

// Presentation icon - slide with chart
export function drawPresentationIcon(ctx) {
  // Slide
  drawRect(ctx, 6, 4, 20, 20, '#ffffff');
  drawRect(ctx, 7, 5, 18, 18, '#f0f0f0');

  // Chart bars
  drawRect(ctx, 10, 18, 3, 4, '#ff6347');
  drawRect(ctx, 14, 15, 3, 7, '#4169e1');
  drawRect(ctx, 18, 12, 3, 10, '#32cd32');

  // Title line
  drawRect(ctx, 9, 8, 14, 2, '#000000');

  // Border
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(6, 4, 20, 20);
}

// Executable icon - gear/cog
export function drawExecutableIcon(ctx) {
  // Background
  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();

  // Gear teeth
  ctx.fillStyle = '#808080';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = 16 + Math.cos(angle) * 12;
    const y = 16 + Math.sin(angle) * 12;
    drawRect(ctx, x - 2, y - 2, 4, 4, '#808080');
  }

  // Center circle
  ctx.fillStyle = '#4169e1';
  ctx.beginPath();
  ctx.arc(16, 16, 6, 0, Math.PI * 2);
  ctx.fill();

  // Center hole
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(16, 16, 3, 0, Math.PI * 2);
  ctx.fill();
}

// Archive icon - box with bands
export function drawArchiveIcon(ctx) {
  // Box
  drawRect(ctx, 6, 8, 20, 18, '#8b4513');
  drawRect(ctx, 7, 9, 18, 16, '#a0522d');

  // Bands
  drawRect(ctx, 6, 14, 20, 2, '#ffd700');
  drawRect(ctx, 14, 8, 2, 18, '#ffd700');

  // Lid
  drawRect(ctx, 6, 8, 20, 3, '#654321');

  // Border
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(6, 8, 20, 18);
}

// Email icon - envelope
export function drawEmailIcon(ctx) {
  // Envelope body
  drawRect(ctx, 4, 10, 24, 16, '#ffffff');

  // Flap
  ctx.fillStyle = '#4169e1';
  ctx.beginPath();
  ctx.moveTo(4, 10);
  ctx.lineTo(16, 18);
  ctx.lineTo(28, 10);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 10, 24, 16);
  ctx.beginPath();
  ctx.moveTo(4, 10);
  ctx.lineTo(16, 18);
  ctx.lineTo(28, 10);
  ctx.stroke();
}

// PDF icon - red-tinted page
export function drawPDFIcon(ctx) {
  // Page
  drawRect(ctx, 6, 4, 20, 24, '#ffffff');
  drawRect(ctx, 7, 5, 18, 22, '#fff0f0');

  // PDF text
  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 8px monospace';
  ctx.fillText('PDF', 11, 16);

  // Border
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 4, 20, 24);
}

// Folder icon (closed)
export function drawFolderIcon(ctx) {
  // Folder body
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(4, 14, 40, 26);

  // Folder tab
  ctx.fillRect(4, 10, 18, 4);

  // Shadow
  ctx.fillStyle = '#daa520';
  ctx.fillRect(8, 18, 32, 18);

  // Border
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 14, 40, 26);
  ctx.strokeRect(4, 10, 18, 4);
}

// Folder icon (open - mouth open)
export function drawFolderIconOpen(ctx) {
  // Folder body
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(4, 14, 40, 26);

  // Folder tab (raised)
  ctx.fillRect(4, 8, 18, 6);

  // Dark inside (visible opening)
  ctx.fillStyle = '#3d2817';
  ctx.fillRect(8, 18, 32, 12);

  // Shadow
  ctx.fillStyle = '#daa520';
  ctx.fillRect(8, 30, 32, 6);

  // Border
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 14, 40, 26);
  ctx.strokeRect(4, 8, 18, 6);
}

// System tray icons
export function drawVolumeIcon(ctx) {
  // Speaker
  ctx.fillStyle = '#000000';
  ctx.fillRect(3, 6, 4, 4);
  ctx.fillRect(7, 5, 2, 6);

  // Sound waves
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(10, 8, 2, -Math.PI/4, Math.PI/4, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(11, 8, 4, -Math.PI/4, Math.PI/4, false);
  ctx.stroke();
}

export function drawNetworkIcon(ctx) {
  // Two overlapping monitors
  // Front monitor
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#4169e1';
  ctx.fillRect(7, 5, 7, 6);
  ctx.strokeRect(7, 5, 7, 6);
  ctx.fillStyle = '#000000';
  ctx.fillRect(9, 11, 3, 2);

  // Back monitor
  ctx.fillStyle = '#1084d0';
  ctx.fillRect(2, 3, 7, 6);
  ctx.strokeRect(2, 3, 7, 6);
  ctx.fillStyle = '#000000';
  ctx.fillRect(4, 9, 3, 2);
}

export function drawShieldIcon(ctx) {
  // Shield shape
  ctx.fillStyle = '#4169e1';
  ctx.beginPath();
  ctx.moveTo(8, 3);
  ctx.lineTo(12, 5);
  ctx.lineTo(12, 10);
  ctx.lineTo(8, 13);
  ctx.lineTo(4, 10);
  ctx.lineTo(4, 5);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = '#000080';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Checkmark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(7.5, 10);
  ctx.lineTo(10, 6);
  ctx.stroke();
}

// Network icon with active green dots
export function drawNetworkIconActive(ctx) {
  drawNetworkIcon(ctx);
  // Green activity rectangles at corners
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(2, 3, 2, 2);
  ctx.fillRect(12, 5, 2, 2);
  ctx.fillRect(2, 9, 2, 2);
  ctx.fillRect(12, 11, 2, 2);
}

// Shield icon with green active fill
export function drawShieldIconActive(ctx) {
  ctx.fillStyle = '#32cd32';
  ctx.beginPath();
  ctx.moveTo(8, 3);
  ctx.lineTo(12, 5);
  ctx.lineTo(12, 10);
  ctx.lineTo(8, 13);
  ctx.lineTo(4, 10);
  ctx.lineTo(4, 5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#006400';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Checkmark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(7.5, 10);
  ctx.lineTo(10, 6);
  ctx.stroke();
}

// Volume icon muted (red X over speaker)
export function drawVolumeIconMuted(ctx) {
  // Speaker body
  ctx.fillStyle = '#808080';
  ctx.fillRect(3, 6, 4, 4);
  ctx.fillRect(7, 5, 2, 6);

  // Red X
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 4);
  ctx.lineTo(15, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15, 4);
  ctx.lineTo(10, 12);
  ctx.stroke();
}

// My Computer icon
export function drawMyComputerIcon(ctx) {
  // Monitor screen
  ctx.fillStyle = '#4169e1';
  ctx.fillRect(4, 6, 24, 16);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 6, 24, 16);

  // Monitor frame
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(2, 4, 28, 20);
  ctx.fillStyle = '#4169e1';
  ctx.fillRect(6, 8, 20, 12);

  // Stand
  ctx.fillStyle = '#808080';
  ctx.fillRect(12, 24, 8, 2);
  ctx.fillRect(10, 26, 12, 4);

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(2, 4, 28, 20);
}

// Recycle Bin icon
export function drawRecycleBinIcon(ctx) {
  // Bin body
  ctx.fillStyle = '#808080';
  ctx.fillRect(8, 14, 16, 14);

  // Bin lid
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(6, 12, 20, 2);
  ctx.fillRect(10, 10, 12, 2);

  // Recycle symbol
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Simple circular arrows
  ctx.arc(16, 20, 4, 0, Math.PI * 1.5);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  // Arrow tip
  ctx.beginPath();
  ctx.moveTo(12, 20);
  ctx.lineTo(12, 18);
  ctx.lineTo(10, 20);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 14, 16, 14);
}

// Create icon canvas with a custom draw function
export function createFileIconCanvas(drawIconFn) {
  const canvas = document.createElement('canvas');
  canvas.width = FILE_SIZE;
  canvas.height = FILE_SIZE;
  const ctx = canvas.getContext('2d');

  if (drawIconFn) {
    drawIconFn(ctx);
  }

  return canvas;
}

// Create folder icon canvas
export function createFolderIconCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = FOLDER_SIZE;
  canvas.height = FOLDER_SIZE;
  const ctx = canvas.getContext('2d');
  drawFolderIcon(ctx);
  return canvas;
}
