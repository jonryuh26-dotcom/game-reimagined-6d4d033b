import { useRef, useState, useCallback } from 'react';

interface Props {
  onMove: (dx: number, dy: number) => void;
}

export default function Joystick({ onMove }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const activeId = useRef<number | null>(null);
  const RADIUS = 48;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setPos({ x: 0, y: 0 });
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > RADIUS) { dx = (dx / len) * RADIUS; dy = (dy / len) * RADIUS; }
    setPos({ x: dx, y: dy });
    onMove(dx / RADIUS, dy / RADIUS);
  }, [onMove]);

  const handleEnd = useCallback(() => {
    setPos(null);
    onMove(0, 0);
    activeId.current = null;
  }, [onMove]);

  return (
    <div
      ref={baseRef}
      className="fixed bottom-24 left-4 w-32 h-32 rounded-full bg-black/60 border-2 border-amber-700/70 backdrop-blur-sm pointer-events-auto z-40 select-none touch-none"
      onTouchStart={(e) => {
        e.stopPropagation();
        const t = e.changedTouches[0];
        activeId.current = t.identifier;
        handleStart(t.clientX, t.clientY);
        handleMove(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === activeId.current) {
            handleMove(e.touches[i].clientX, e.touches[i].clientY);
            return;
          }
        }
      }}
      onTouchEnd={(e) => { e.stopPropagation(); handleEnd(); }}
      onTouchCancel={(e) => { e.stopPropagation(); handleEnd(); }}
      onMouseDown={(e) => { e.stopPropagation(); handleStart(e.clientX, e.clientY); handleMove(e.clientX, e.clientY); }}
      onMouseMove={(e) => { if (e.buttons) { e.stopPropagation(); handleMove(e.clientX, e.clientY); } }}
      onMouseUp={(e) => { e.stopPropagation(); handleEnd(); }}
      onMouseLeave={() => handleEnd()}
    >
      <div
        className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border-2 border-amber-200 shadow-lg pointer-events-none"
        style={{
          left: '50%', top: '50%',
          transform: `translate(-50%, -50%) translate(${pos?.x ?? 0}px, ${pos?.y ?? 0}px)`,
        }}
      />
    </div>
  );
}
