// prayerImage.js - Pure JavaScript canvas image generator
// Uses @napi-rs/canvas — no Python, no libraqm, no extra deps

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs   = require('fs');
let mode = "light"
let bg;

if (mode == "dark") {
  bg = "bg-dark.png"
} else {
  bg = "bg.png"
}


// ── Register font ─────────────────────────────────────────────────────────────
function registerFonts() {
  const candidates = [
    path.join(__dirname, '/Assests/Tajawal-Bold.ttf'),
    'C:/Windows/Fonts/arabtype.ttf',
    'C:/Windows/Fonts/tahoma.ttf',
  ];
  for (const f of candidates) {
    if (fs.existsSync(f)) {
      GlobalFonts.registerFromPath(f, 'ArabicFont');
      console.log(`✅ Font: ${path.basename(f)}`);
      return;
    }
  }
  console.warn('⚠️  No Arabic font found — place Tajawal-Bold.ttf next to index.js');
}

// ── Shared draw helper ────────────────────────────────────────────────────────
function drawTime(ctx, time, x, y) {
  ctx.save();
  ctx.font         = 'bold 52px ArabicFont, Arial';
  ctx.fillStyle    = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(time, x, y);
  ctx.restore();
}

// ── One function per prayer — tweak x, y freely ──────────────────────────────

function drawFajr(ctx, time) {
  const x = 1255;  // ← change me
  const y = 797;   // ← change me
  drawTime(ctx, time, x, y);
}

function drawDhuhr(ctx, time) {
  const x = 1010;  // ← change me
  const y = 797;   // ← change me
  drawTime(ctx, time, x, y);
}

function drawAsr(ctx, time) {
  const x = 760;   // ← change me
  const y = 797;   // ← change me
  drawTime(ctx, time, x, y);
}

function drawMaghrib(ctx, time) {
  const x = 510;   // ← change me
  const y = 797;   // ← change me
  drawTime(ctx, time, x, y);
}

function drawIsha(ctx, time) {
  const x = 275;   // ← change me
  const y = 797;   // ← change me
  drawTime(ctx, time, x, y);
}

function drawHijriDate(ctx, text) {
  const x = 758;   // ← change me
  const y = 275;   // ← change me
  ctx.save();
  ctx.font         = 'bold 22px ArabicFont, Arial';
  ctx.fillStyle    = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction    = 'rtl';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ── Main generator ────────────────────────────────────────────────────────────
async function generatePrayerImage({ fajr, dhuhr, asr, maghrib, isha, hijriText }) {
  registerFonts();

  const bgImg  = await loadImage(path.join(__dirname, `/Assests/${bg}`));
  const canvas = createCanvas(1536, 1024);
  const ctx    = canvas.getContext('2d');

  // Draw background
  ctx.drawImage(bgImg, 0, 0, 1536, 1024);

  // Draw each prayer time individually
  drawFajr   (ctx, fajr);
  drawDhuhr  (ctx, dhuhr);
  drawAsr    (ctx, asr);
  drawMaghrib(ctx, maghrib);
  drawIsha   (ctx, isha);

  // Draw Hijri date
  drawHijriDate(ctx, hijriText);

  return canvas.toBuffer('image/png');
}

module.exports = { generatePrayerImage };