import { MapId } from './types';
import { mapDims } from './mapData';

// Grade de colisão amostrada da imagem do mapa.
// true = caminhável, false = bloqueado (preto / quase preto).
const MASK_RES = 4; // 1 célula a cada 4px

interface MaskInfo {
  data: Uint8Array;
  cols: number;
  rows: number;
  w: number;
  h: number;
}

const masks: Partial<Record<MapId, MaskInfo>> = {};

export function buildMaskFromImage(mapId: MapId, img: HTMLImageElement) {
  if (masks[mapId]) return;
  try {
    const dims = mapDims(mapId);
    const cols = Math.ceil(dims.w / MASK_RES);
    const rows = Math.ceil(dims.h / MASK_RES);
    const canvas = document.createElement('canvas');
    canvas.width = cols; canvas.height = rows;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, cols, rows);
    const data = ctx.getImageData(0, 0, cols, rows).data;
    const mask = new Uint8Array(cols * rows);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      const isBlack = a < 30 || (r < 20 && g < 20 && b < 20);
      mask[p] = isBlack ? 0 : 1;
    }
    masks[mapId] = { data: mask, cols, rows, w: dims.w, h: dims.h };
  } catch (e) {
    console.warn('mask build failed', mapId, e);
  }
}

export function maskWalkable(mapId: MapId, x: number, y: number): boolean | null {
  const m = masks[mapId];
  if (!m) return null;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
  const cx = Math.floor(x / MASK_RES);
  const cy = Math.floor(y / MASK_RES);
  return m.data[cy * m.cols + cx] === 1;
}

export function hasMask(mapId: MapId): boolean {
  return !!masks[mapId];
}
