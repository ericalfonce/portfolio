import { getProjectArtConfig } from './utils.js';

const MAX_DEVICE_PIXEL_RATIO = 2;

function drawGlitch(ctx, w, h, color) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * h;
    const barH = Math.random() * 4 + 1;
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.random() * 0.5 + 0.1;
    ctx.fillRect(0, y, w, barH);
  }
  ctx.globalAlpha = 1;
}

function drawMatrix(ctx, w, h, color) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  const fontSize = 12;
  const cols = Math.floor(w / fontSize);
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = color;
  for (let i = 0; i < cols; i++) {
    const len = Math.floor(Math.random() * (h / fontSize));
    for (let j = 0; j < len; j++) {
      ctx.globalAlpha = j === len - 1 ? 1 : 0.15;
      ctx.fillText(Math.round(Math.random()), i * fontSize, j * fontSize);
    }
  }
  ctx.globalAlpha = 1;
}

function drawWireframe(ctx, w, h, color) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4;
  const step = 24;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawDefault(ctx, w, h, color) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(1, color);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

const PATTERNS = { glitch: drawGlitch, matrix: drawMatrix, wireframe: drawWireframe, default: drawDefault };

export function renderProjectArt(canvas, tags) {
  const { pattern, color } = getProjectArtConfig(tags);
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 160;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  (PATTERNS[pattern] || drawDefault)(ctx, w, h, color);
}
