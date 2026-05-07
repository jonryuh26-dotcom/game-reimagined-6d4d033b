// Avatar customization persistence
export type AvatarKind = 'mage' | 'dark';

export interface AvatarProfile {
  kind: AvatarKind;
  /** Robe / clothing color in hex */
  color: string;
}

const KEY = 'ryuzen-avatar-v1';

export const AVATAR_PALETTE: { id: string; color: string; label: string }[] = [
  { id: 'azure',   color: '#3b82f6', label: 'Azul Arcano' },
  { id: 'crimson', color: '#dc2626', label: 'Carmesim' },
  { id: 'verdant', color: '#16a34a', label: 'Verde Druida' },
  { id: 'royal',   color: '#7c3aed', label: 'Roxo Real' },
  { id: 'sun',     color: '#f59e0b', label: 'Sol Dourado' },
  { id: 'frost',   color: '#22d3ee', label: 'Gelo Eterno' },
  { id: 'rose',    color: '#ec4899', label: 'Rosa Encantada' },
  { id: 'void',    color: '#0f172a', label: 'Vazio' },
];

const DEFAULT: AvatarProfile = { kind: 'mage', color: '#3b82f6' };

let cache: AvatarProfile | null = null;
const listeners = new Set<(p: AvatarProfile) => void>();

export function loadAvatar(): AvatarProfile {
  if (cache) return cache;
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    cache = DEFAULT;
  }
  return cache!;
}

export function saveAvatar(a: AvatarProfile) {
  cache = a;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY, JSON.stringify(a));
  }
  listeners.forEach(l => l(a));
}

export function subscribeAvatar(fn: (a: AvatarProfile) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Lighten/darken helper for shading
function shade(hex: string, amt: number): string {
  const m = hex.replace('#', '');
  const num = parseInt(m, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 'up' | 'down' | 'left' | 'right',
  moving: boolean,
  animFrame: number,
  time: number,
) {
  const p = loadAvatar();
  const main = p.color;
  const dark = shade(main, -55);
  const light = shade(main, 35);
  const skin = '#f5d0a9';
  const shadow = 'rgba(0,0,0,0.35)';

  ctx.save();
  // Shadow
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(x, y + 11, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = moving ? Math.sin(animFrame * 0.35) * 2 : 0;
  const bob = moving ? Math.abs(Math.sin(animFrame * 0.35)) * -1.5 : Math.sin(time * 0.003) * 0.6;

  if (p.kind === 'mage') {
    // ---- MAGE ----
    // Boots
    ctx.fillStyle = '#3b2410';
    ctx.fillRect(x - 5, y + 6, 4, 4);
    ctx.fillRect(x + 1, y + 6 + legSwing, 4, 4);
    // Robe (trapezoid)
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 6 + bob);
    ctx.lineTo(x + 9, y + 6 + bob);
    ctx.lineTo(x + 7, y - 6 + bob);
    ctx.lineTo(x - 7, y - 6 + bob);
    ctx.closePath();
    ctx.fill();
    // Robe trim
    ctx.fillStyle = light;
    ctx.fillRect(x - 9, y + 4 + bob, 18, 2);
    // Belt
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x - 7, y - 1 + bob, 14, 2);
    // Gem
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(x - 1, y - 1 + bob, 2, 2);
    // Chest / arms
    ctx.fillStyle = dark;
    ctx.fillRect(x - 8, y - 8 + bob, 4, 6);
    ctx.fillRect(x + 4, y - 8 + bob, 4, 6);
    // Head
    ctx.fillStyle = skin;
    ctx.fillRect(x - 4, y - 16 + bob, 8, 8);
    // Beard
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(x - 4, y - 10 + bob, 8, 3);
    ctx.fillRect(x - 3, y - 8 + bob, 6, 2);
    // Eyes
    ctx.fillStyle = '#1e293b';
    if (dir === 'down') { ctx.fillRect(x - 3, y - 13 + bob, 2, 2); ctx.fillRect(x + 1, y - 13 + bob, 2, 2); }
    else if (dir === 'left') { ctx.fillRect(x - 4, y - 13 + bob, 2, 2); }
    else if (dir === 'right') { ctx.fillRect(x + 2, y - 13 + bob, 2, 2); }
    else { ctx.fillStyle = skin; ctx.fillRect(x - 4, y - 16 + bob, 8, 4); }
    // Pointy hat
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 16 + bob);
    ctx.lineTo(x + 7, y - 16 + bob);
    ctx.lineTo(x + 1, y - 30 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = light;
    ctx.fillRect(x - 7, y - 17 + bob, 14, 2);
    // Hat star
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x - 1, y - 24 + bob, 2, 2);
    // Staff
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(x + 8, y - 18 + bob, 2, 26);
    ctx.fillStyle = '#a855f7';
    const orbPulse = 0.6 + Math.sin(time * 0.006) * 0.3;
    ctx.globalAlpha = orbPulse;
    ctx.beginPath();
    ctx.arc(x + 9, y - 22 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x + 8, y - 23 + bob, 2, 2);
  } else {
    // ---- DARK ASSASSIN ----
    // Boots
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x - 5, y + 6, 4, 4);
    ctx.fillRect(x + 1, y + 6 + legSwing, 4, 4);
    // Cloak/body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 8 + bob);
    ctx.lineTo(x + 10, y + 8 + bob);
    ctx.lineTo(x + 7, y - 8 + bob);
    ctx.lineTo(x - 7, y - 8 + bob);
    ctx.closePath();
    ctx.fill();
    // Inner tunic (color)
    ctx.fillStyle = main;
    ctx.fillRect(x - 5, y - 6 + bob, 10, 10);
    ctx.fillStyle = dark;
    ctx.fillRect(x - 5, y + 2 + bob, 10, 2);
    // Belts
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x - 7, y + 0 + bob, 14, 2);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(x - 3, y + 0 + bob, 2, 2);
    // Arms (pauldrons)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 9, y - 7 + bob, 4, 5);
    ctx.fillRect(x + 5, y - 7 + bob, 4, 5);
    // Hood
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 6 + bob);
    ctx.lineTo(x + 8, y - 6 + bob);
    ctx.lineTo(x + 7, y - 18 + bob);
    ctx.lineTo(x, y - 22 + bob);
    ctx.lineTo(x - 7, y - 18 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = main;
    ctx.fillRect(x - 7, y - 7 + bob, 14, 2);
    // Face shadow + glowing eyes
    ctx.fillStyle = '#1a0a14';
    ctx.fillRect(x - 4, y - 15 + bob, 8, 6);
    const eyeGlow = 0.7 + Math.sin(time * 0.008) * 0.3;
    ctx.globalAlpha = eyeGlow;
    ctx.fillStyle = main === '#0f172a' ? '#ef4444' : main;
    if (dir === 'right') ctx.fillRect(x + 1, y - 13 + bob, 3, 2);
    else if (dir === 'left') ctx.fillRect(x - 4, y - 13 + bob, 3, 2);
    else { ctx.fillRect(x - 3, y - 13 + bob, 2, 2); ctx.fillRect(x + 1, y - 13 + bob, 2, 2); }
    ctx.shadowColor = main;
    ctx.shadowBlur = 6;
    ctx.fillRect(x - 3, y - 13 + bob, 6, 1);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    // Dagger
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(x + 9, y - 2 + bob, 2, 8);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x + 8, y + 5 + bob, 4, 2);
    // Aura wisps
    ctx.globalAlpha = 0.3 + Math.sin(time * 0.005) * 0.1;
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.ellipse(x, y + 11, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
