// Procedural mob renderer for Dragon M.
// Replaces the static saibaman spritesheet with a richer, animated canvas-drawn
// creature that supports multiple variants and per-state animations
// (idle / walk / attack / hit / death) without needing baked sprite sheets.
//
// Each variant has a distinct silhouette + palette, designed to read clearly
// on the world map at small scale.

export type MobVisualKind = 'normal' | 'elite' | 'corrupted' | 'alpha' | 'dragon_emerald' | 'dragon_crimson' | 'wolf' | 'boar' | 'fairy' | 'char_orange' | 'char_blue' | 'char_obsidian';
export type MobAnimState = 'idle' | 'walk' | 'attack' | 'skill' | 'hit' | 'death';
export type MobFacing = 'down' | 'up' | 'left' | 'right';

interface Palette {
  body: string;        // primary body fill
  bodyDark: string;    // shaded side
  outline: string;     // outline / silhouette
  belly: string;       // belly / chest panel
  eye: string;         // eye sclera (glow)
  pupil: string;
  spike: string;       // horns / spikes
  aura: string;        // outer glow color
  scale: number;       // base scale multiplier
  hornStyle: 'small' | 'twin' | 'crown' | 'crest';
  hasWings?: boolean;  // mini-dragon wings
  wingColor?: string;
}

const PALETTES: Record<MobVisualKind, Palette> = {
  normal:    { body: '#4ade80', bodyDark: '#16a34a', outline: '#052e16', belly: '#bbf7d0', eye: '#fde047', pupil: '#0c0a09', spike: '#22c55e', aura: 'rgba(74,222,128,0.0)', scale: 1.0,  hornStyle: 'small' },
  elite:     { body: '#34d399', bodyDark: '#047857', outline: '#022c22', belly: '#a7f3d0', eye: '#fafafa', pupil: '#022c22', spike: '#10b981', aura: 'rgba(16,185,129,0.45)', scale: 1.15, hornStyle: 'twin' },
  corrupted: { body: '#a855f7', bodyDark: '#6b21a8', outline: '#1e0033', belly: '#e9d5ff', eye: '#fbcfe8', pupil: '#1e0033', spike: '#7c3aed', aura: 'rgba(168,85,247,0.55)', scale: 1.25, hornStyle: 'crown' },
  alpha:     { body: '#ef4444', bodyDark: '#7f1d1d', outline: '#180000', belly: '#fecaca', eye: '#fbbf24', pupil: '#180000', spike: '#dc2626', aura: 'rgba(239,68,68,0.7)',  scale: 1.55, hornStyle: 'crest' },
  dragon_emerald: { body: '#10b981', bodyDark: '#065f46', outline: '#022c22', belly: '#fef3c7', eye: '#fde047', pupil: '#0a0a0a', spike: '#fbbf24', aura: 'rgba(16,185,129,0.55)', scale: 1.3, hornStyle: 'twin', hasWings: true, wingColor: '#059669' },
  dragon_crimson: { body: '#f43f5e', bodyDark: '#881337', outline: '#1a0008', belly: '#fde68a', eye: '#fbbf24', pupil: '#1a0008', spike: '#f59e0b', aura: 'rgba(244,63,94,0.7)',  scale: 1.4, hornStyle: 'crest', hasWings: true, wingColor: '#9f1239' },
  wolf:    { body: '#475569', bodyDark: '#1e293b', outline: '#020617', belly: '#cbd5e1', eye: '#fbbf24', pupil: '#020617', spike: '#64748b', aura: 'rgba(71,85,105,0.4)', scale: 1.05, hornStyle: 'twin' },
  boar:    { body: '#92400e', bodyDark: '#451a03', outline: '#1c0a00', belly: '#fde68a', eye: '#facc15', pupil: '#1c0a00', spike: '#f5f5f4', aura: 'rgba(146,64,14,0.4)', scale: 1.20, hornStyle: 'small' },
  fairy:   { body: '#e879f9', bodyDark: '#a21caf', outline: '#3b0764', belly: '#fae8ff', eye: '#fef3c7', pupil: '#3b0764', spike: '#f0abfc', aura: 'rgba(232,121,249,0.6)', scale: 0.9, hornStyle: 'crown', hasWings: true, wingColor: '#f5d0fe' },
  char_orange:   { body: '#f97316', bodyDark: '#9a3412', outline: '#1c0a00', belly: '#fef3c7', eye: '#fde047', pupil: '#0a0a0a', spike: '#fbbf24', aura: 'rgba(249,115,22,0.65)', scale: 1.35, hornStyle: 'twin',  hasWings: true, wingColor: '#c2410c' },
  char_blue:     { body: '#0ea5e9', bodyDark: '#075985', outline: '#082f49', belly: '#e0f2fe', eye: '#fef9c3', pupil: '#082f49', spike: '#7dd3fc', aura: 'rgba(14,165,233,0.65)', scale: 1.45, hornStyle: 'twin',  hasWings: true, wingColor: '#0369a1' },
  char_obsidian: { body: '#1f2937', bodyDark: '#030712', outline: '#000000', belly: '#7f1d1d', eye: '#ef4444', pupil: '#000000', spike: '#dc2626', aura: 'rgba(220,38,38,0.7)',  scale: 1.6,  hornStyle: 'crest', hasWings: true, wingColor: '#111827' },
};

/** Public draw entry. Replaces drawSaibaman. */
export function drawMob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: MobAnimState,
  variant: MobVisualKind,
  animFrame: number,
  facing: MobFacing,
  hpRatio: number,
) {
  const p = PALETTES[variant];
  const t = animFrame; // engine increments each tick
  const time = performance.now();

  // ---- per-state transforms ----
  let bob = 0;        // vertical bob
  let lunge = 0;      // forward lunge for attacks
  let squash = 1;     // y-scale squash
  let stretch = 1;    // x-scale stretch
  let alpha = 1;
  let tilt = 0;       // body roll
  let flash = 0;      // 0..1 white-flash on hit
  let eyeOpen = 1;    // 0..1 (death closes eyes)

  switch (state) {
    case 'idle': {
      bob = Math.sin(time * 0.004) * 1.2;
      tilt = Math.sin(time * 0.0025) * 0.04;
      break;
    }
    case 'walk': {
      const ph = (t * 0.35) % (Math.PI * 2);
      bob = Math.sin(ph * 2) * 1.6;
      tilt = Math.sin(ph) * 0.12;
      squash = 1 - Math.abs(Math.sin(ph * 2)) * 0.04;
      break;
    }
    case 'attack': {
      const ph = (t % 24) / 24;
      lunge = Math.sin(ph * Math.PI) * 6;
      stretch = 1 + Math.sin(ph * Math.PI) * 0.12;
      squash = 1 - Math.sin(ph * Math.PI) * 0.06;
      tilt = Math.sin(ph * Math.PI) * 0.2;
      break;
    }
    case 'skill': {
      const ph = (time * 0.01) % (Math.PI * 2);
      bob = -2 + Math.sin(ph) * 1;
      tilt = Math.sin(ph * 0.5) * 0.06;
      break;
    }
    case 'hit': {
      const ph = (t % 12) / 12;
      flash = 1 - ph;
      tilt = Math.sin(ph * Math.PI * 4) * 0.15;
      break;
    }
    case 'death': {
      const ph = Math.min(1, (t % 30) / 30);
      alpha = 1 - ph;
      tilt = ph * 1.2;
      bob = ph * 6;
      eyeOpen = 1 - ph;
      squash = 1 - ph * 0.4;
      break;
    }
  }

  // Facing → horizontal flip
  const flipX = facing === 'left';

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + bob);
  ctx.rotate(tilt);
  ctx.scale(p.scale * stretch * (flipX ? -1 : 1), p.scale * squash);

  // Aura halo (elites)
  if (variant !== 'normal') {
    const r = 22 + Math.sin(time * 0.005) * 3;
    const g = ctx.createRadialGradient(0, -8, 2, 0, -8, r);
    g.addColorStop(0, p.aura);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, -8, r, 0, Math.PI * 2); ctx.fill();
  }

  // Ground shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Translate forward for lunge
  ctx.translate(lunge, 0);

  // ----- body -----
  // wings (mini-dragons) — drawn behind body
  if (p.hasWings) drawWings(ctx, p, time);
  drawBody(ctx, p, state);

  // ----- belly panel -----
  drawBelly(ctx, p);

  // ----- arms -----
  drawArms(ctx, p, state, t, time);

  // ----- head -----
  drawHead(ctx, p, state, t, time, eyeOpen);

  // ----- horns / crest -----
  drawHorns(ctx, p);

  // ----- weapon for attack frames -----
  if (state === 'attack' || (state === 'idle' && variant === 'alpha')) {
    drawWeapon(ctx, p, state, t);
  }

  // White flash overlay (hit)
  if (flash > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.6})`;
    ctx.fillRect(-22, -34, 44, 44);
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
}

// --- pieces ---

function drawBody(ctx: CanvasRenderingContext2D, p: Palette, _state: MobAnimState) {
  // shaded body
  ctx.beginPath();
  ctx.moveTo(-13, -2);
  ctx.bezierCurveTo(-15, -16, -8, -22, 0, -22);
  ctx.bezierCurveTo(8, -22, 15, -16, 13, -2);
  ctx.bezierCurveTo(13, 6, 8, 8, 0, 8);
  ctx.bezierCurveTo(-8, 8, -13, 6, -13, -2);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-12, -20, 12, 8);
  grad.addColorStop(0, p.body);
  grad.addColorStop(1, p.bodyDark);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = p.outline;
  ctx.stroke();
}

function drawBelly(ctx: CanvasRenderingContext2D, p: Palette) {
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = p.belly;
  ctx.fill();
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

function drawArms(ctx: CanvasRenderingContext2D, p: Palette, state: MobAnimState, _t: number, time: number) {
  const swing = state === 'walk' ? Math.sin(time * 0.012) * 4 : state === 'attack' ? 6 : 0;
  // left arm
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.quadraticCurveTo(-18, 0 + swing, -16, 6 + swing);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = p.bodyDark;
  ctx.stroke();
  // right arm
  ctx.beginPath();
  ctx.moveTo(12, -6);
  ctx.quadraticCurveTo(18, 0 - swing, 16, 6 - swing);
  ctx.strokeStyle = p.bodyDark;
  ctx.stroke();
  // claws
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath(); ctx.arc(-16, 6 + swing, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(16, 6 - swing, 1.6, 0, Math.PI * 2); ctx.fill();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  state: MobAnimState,
  _t: number,
  time: number,
  eyeOpen: number,
) {
  // head dome
  ctx.beginPath();
  ctx.ellipse(0, -22, 11, 9, 0, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(-10, -28, 10, -16);
  grad.addColorStop(0, p.body);
  grad.addColorStop(1, p.bodyDark);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = p.outline;
  ctx.stroke();

  // mouth
  ctx.beginPath();
  if (state === 'attack') {
    ctx.moveTo(-3, -19);
    ctx.lineTo(0, -16);
    ctx.lineTo(3, -19);
  } else {
    ctx.moveTo(-3, -19);
    ctx.quadraticCurveTo(0, -18, 3, -19);
  }
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 1;
  ctx.stroke();

  // teeth on attack
  if (state === 'attack') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-2, -19); ctx.lineTo(0, -17); ctx.lineTo(-1, -19); ctx.fill();
    ctx.beginPath(); ctx.moveTo(2, -19); ctx.lineTo(0, -17); ctx.lineTo(1, -19); ctx.fill();
  }

  // eyes — glowing slits
  const blink = Math.max(0, eyeOpen) * (0.7 + 0.3 * Math.sin(time * 0.005));
  if (blink > 0.05) {
    ctx.fillStyle = p.eye;
    ctx.shadowColor = p.eye;
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.ellipse(-4, -23, 1.6, 1.8 * blink, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -23, 1.6, 1.8 * blink, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.pupil;
    ctx.beginPath(); ctx.ellipse(-4, -23, 0.7, 1.0 * blink, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -23, 0.7, 1.0 * blink, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawHorns(ctx: CanvasRenderingContext2D, p: Palette) {
  ctx.fillStyle = p.spike;
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.8;
  switch (p.hornStyle) {
    case 'small': {
      ctx.beginPath();
      ctx.moveTo(-7, -29); ctx.lineTo(-5, -32); ctx.lineTo(-3, -29); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, -29); ctx.lineTo(5, -32); ctx.lineTo(7, -29); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case 'twin': {
      ctx.beginPath();
      ctx.moveTo(-8, -28); ctx.quadraticCurveTo(-9, -34, -5, -34); ctx.lineTo(-4, -29); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -28); ctx.quadraticCurveTo(9, -34, 5, -34); ctx.lineTo(4, -29); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case 'crown': {
      for (let i = -2; i <= 2; i++) {
        const cx = i * 3.2;
        const h = 4 + (i === 0 ? 3 : 1);
        ctx.beginPath();
        ctx.moveTo(cx - 1.4, -29);
        ctx.lineTo(cx, -29 - h);
        ctx.lineTo(cx + 1.4, -29);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      break;
    }
    case 'crest': {
      // back fin / crown of fire
      for (let i = -3; i <= 3; i++) {
        const cx = i * 2.6;
        const h = 6 - Math.abs(i) * 0.6;
        const grad = ctx.createLinearGradient(cx, -29, cx, -29 - h);
        grad.addColorStop(0, p.spike);
        grad.addColorStop(1, '#fde68a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - 1.2, -29);
        ctx.lineTo(cx, -29 - h - 2);
        ctx.lineTo(cx + 1.2, -29);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = p.spike;
      break;
    }
  }
}

function drawWeapon(ctx: CanvasRenderingContext2D, p: Palette, state: MobAnimState, _t: number) {
  // Right hand weapon — small dagger
  ctx.save();
  ctx.translate(16, 6);
  if (state === 'attack') ctx.rotate(-0.6);
  ctx.fillStyle = '#cbd5e1';
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(3, -10); ctx.lineTo(1, -10); ctx.lineTo(-1, 0);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(-1.5, 0, 3, 3);
  ctx.restore();
}

function drawWings(ctx: CanvasRenderingContext2D, p: Palette, time: number) {
  const flap = Math.sin(time * 0.018) * 0.5;
  const col = p.wingColor ?? p.bodyDark;
  ctx.save();
  ctx.fillStyle = col;
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.8;
  // left wing
  ctx.save();
  ctx.translate(-10, -14);
  ctx.rotate(-0.5 + flap);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-14, -8, -18, -2);
  ctx.quadraticCurveTo(-12, 2, 0, 4);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  // right wing
  ctx.save();
  ctx.translate(10, -14);
  ctx.rotate(0.5 - flap);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -8, 18, -2);
  ctx.quadraticCurveTo(12, 2, 0, 4);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
