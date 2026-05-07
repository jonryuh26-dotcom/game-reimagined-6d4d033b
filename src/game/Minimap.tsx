import { useEffect, useRef } from 'react';
import { GameState } from './types';
import { MAPS, mapDims } from './mapData';

interface Props { state: GameState; }

export default function Minimap({ state }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const SIZE = 96;

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    c.width = SIZE; c.height = SIZE;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // background
    const grad = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 4, SIZE / 2, SIZE / 2, SIZE / 2);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2); ctx.clip();

    const dims = mapDims(state.currentMap);
    const sx = SIZE / dims.w;
    const sy = SIZE / dims.h;

    // Mobs (red)
    state.mobs.forEach(m => {
      if (!m.alive || m.mapId !== state.currentMap) return;
      ctx.fillStyle = m.id === state.selectedMobId ? '#fbbf24' : '#ef4444';
      ctx.fillRect(m.x * sx - 1.5, m.y * sy - 1.5, 3, 3);
    });

    // Chests (yellow)
    state.chests.forEach(ch => {
      if (ch.opened) return;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ch.x * sx - 1.5, ch.y * sy - 1.5, 3, 3);
    });

    // Stairs / passagens subterrâneas (GPS) — ícone pulsante azul
    const stairs = MAPS[state.currentMap].stairs ?? [];
    const t = Date.now() * 0.005;
    stairs.forEach(st => {
      const px = st.x * sx;
      const py = st.y * sy;
      const pulse = 4 + Math.sin(t) * 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2); ctx.fill();
    });

    // Player (green)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(state.player.x * sx, state.player.y * sy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#bbf7d0'; ctx.lineWidth = 1; ctx.stroke();

    // Seta apontando para a escada mais próxima (GPS)
    if (stairs.length > 0) {
      let nearest = stairs[0];
      let nd = Infinity;
      stairs.forEach(s => {
        const d = (s.x - state.player.x) ** 2 + (s.y - state.player.y) ** 2;
        if (d < nd) { nd = d; nearest = s; }
      });
      const ang = Math.atan2(nearest.y - state.player.y, nearest.x - state.player.x);
      const cx = SIZE / 2, cy = SIZE / 2;
      const r = SIZE / 2 - 8;
      const ax = cx + Math.cos(ang) * r;
      const ay = cy + Math.sin(ang) * r;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-4, 4); ctx.lineTo(-4, -4); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // ring
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2); ctx.stroke();
  }, [state.player.x, state.player.y, state.mobs, state.chests, state.currentMap, state.selectedMobId]);

  return (
    <div className="flex flex-col items-end gap-1 pointer-events-auto">
      <div className="bg-black/70 px-2 py-0.5 rounded border border-amber-900/60 text-amber-300 text-[9px] font-bold">
        {MAPS[state.currentMap].name}
      </div>
      <canvas ref={ref} className="rounded-full border-2 border-amber-700 shadow-lg" style={{ width: SIZE, height: SIZE }} />
    </div>
  );
}
