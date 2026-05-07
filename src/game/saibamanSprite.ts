import sheetSrc from '@/assets/saibaman-sheet.png';

// New sheet generated from uploaded reference: 6 cols x 2 rows, frame 237x284 with 4px pad.
// Row 1: 0 frente, 1 direita, 2 costas, 3 esquerda, 4 frente-direita, 5 frente-esquerda
// Row 2: poses de combate (rosto bravo, garras, pulo, ataque, costado, lateral)
const FRAME_W = 220;
const FRAME_H = 300;
const PAD = 6;
const CELL_W = FRAME_W + PAD * 2;
const CELL_H = FRAME_H + PAD * 2;

function cell(col: number, row: number) {
  return { sx: col * CELL_W + PAD, sy: row * CELL_H + PAD };
}

export type SaibamanState = 'idle' | 'walk' | 'attack' | 'hit' | 'death' | 'skill';
export type SaibamanDir = 'down' | 'right' | 'up' | 'left';
export type SaibamanVariant = 'normal' | 'elite' | 'corrupted' | 'alpha';

const DIR_COL: Record<SaibamanDir, number> = { down: 0, right: 1, up: 2, left: 3 };
// Diagonal poses used as "walk step" alternates so the saibaman doesn't look static
const DIR_STEP_COL: Record<SaibamanDir, number> = { down: 4, right: 4, up: 5, left: 5 };

// Frame counts per animation (logical)
const FRAMES: Record<SaibamanState, number> = {
  idle: 4,
  walk: 6,
  attack: 6,
  hit: 3,
  death: 6,
  skill: 6,
};

// Animation tick speed (ticks per logical frame)
const SPEED: Record<SaibamanState, number> = {
  idle: 14,
  walk: 6,
  attack: 4,
  hit: 5,
  death: 9,
  skill: 5,
};

let img: HTMLImageElement | null = null;
let loaded = false;
export function loadSaibamanSheet() {
  if (img) return img;
  img = new Image();
  img.onload = () => {
    loaded = true;
  };
  img.src = sheetSrc;
  return img;
}

const VARIANT_TINT: Record<SaibamanVariant, string | null> = {
  normal: null,
  elite: '#22c55e',
  corrupted: '#a855f7',
  alpha: '#ef4444',
};
const VARIANT_SCALE: Record<SaibamanVariant, number> = {
  normal: 1,
  elite: 1.1,
  corrupted: 1.18,
  alpha: 1.45,
};

/**
 * Resolve the source rect + draw transforms (bob, flip, scale, tint) for a given
 * state/direction/animFrame. Animation frames are derived from the available 12 poses
 * by combining directional cells with combat cells and a vertical bob — so each
 * "frame" looks distinct without ever drawing the full character as a static image.
 */
function pickFrame(state: SaibamanState, dir: SaibamanDir, animFrame: number) {
  const total = FRAMES[state];
  const frame = Math.floor(animFrame / SPEED[state]) % total;
  const dCol = DIR_COL[dir];
  const sCol = DIR_STEP_COL[dir];

  let col = dCol;
  let row = 0;
  let bob = 0;
  let scale = 1;
  let alpha = 1;
  let flashRed = false;

  switch (state) {
    case 'idle': {
      // gentle breathing — alternate base/diagonal pose with tiny bob
      col = frame % 2 === 0 ? dCol : sCol;
      bob = frame === 1 || frame === 3 ? -1 : 0;
      break;
    }
    case 'walk': {
      // 6-frame walk cycle: base, step, base, base, step(flip), base
      const cycle = [dCol, sCol, dCol, dCol, sCol, dCol];
      col = cycle[frame];
      bob = frame % 2 === 0 ? 0 : -2;
      break;
    }
    case 'attack': {
      // pick combat poses (row 2). Cols 0..5
      const cycle = [dCol, sCol, 0, 3, 1, dCol];
      col = cycle[frame];
      row = frame >= 2 && frame <= 4 ? 1 : 0;
      scale = frame === 3 ? 1.05 : 1;
      break;
    }
    case 'skill': {
      const cycle = [2, 4, 3, 5, 4, dCol];
      col = cycle[frame];
      row = frame < 5 ? 1 : 0;
      scale = 1 + Math.sin((frame / 5) * Math.PI) * 0.08;
      break;
    }
    case 'hit': {
      col = dCol;
      bob = frame === 1 ? 1 : 0;
      flashRed = frame !== 2;
      break;
    }
    case 'death': {
      col = dCol;
      row = frame >= 2 ? 1 : 0;
      scale = 1 - frame * 0.05;
      alpha = Math.max(0, 1 - frame / (total - 1));
      bob = frame; // sink down
      break;
    }
  }

  const c = cell(col, row);
  return { sx: c.sx, sy: c.sy, bob, scale, alpha, flashRed };
}

export function drawSaibaman(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: SaibamanState,
  variant: SaibamanVariant,
  animFrame: number,
  dir: SaibamanDir = 'down',
  flip = false,
) {
  const sheet = loadSaibamanSheet();
  if (!loaded) {
    ctx.fillStyle = VARIANT_TINT[variant] ?? '#4ade80';
    ctx.fillRect(x - 8, y - 18, 16, 22);
    return;
  }
  const f = pickFrame(state, dir, animFrame);
  const vScale = VARIANT_SCALE[variant];
  const baseW = 40; // on-canvas display size; pixel art is downscaled cleanly
  const dw = baseW * vScale * f.scale;
  const dh = (baseW * (FRAME_H / FRAME_W)) * vScale * f.scale;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = f.alpha;

  const tint = VARIANT_TINT[variant];
  if (tint) {
    ctx.shadowColor = tint;
    ctx.shadowBlur = 14;
  }

  // Pivot is centered on feet
  const drawX = x - dw / 2;
  const drawY = y - dh + f.bob;

  if (flip) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, f.sx, f.sy, FRAME_W, FRAME_H, -dw / 2, drawY, dw, dh);
  } else {
    ctx.drawImage(sheet, f.sx, f.sy, FRAME_W, FRAME_H, drawX, drawY, dw, dh);
  }

  if (f.flashRed) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(239,68,68,0.45)';
    ctx.fillRect(drawX - 4, drawY - 4, dw + 8, dh + 8);
  }
  ctx.restore();

  // ground aura for elite variants
  if (tint && variant !== 'normal') {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.ellipse(x, y, dw * 0.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
