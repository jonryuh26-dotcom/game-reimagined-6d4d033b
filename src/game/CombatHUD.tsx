import { useState } from 'react';
import { GameState, SkillId } from './types';
import { SKILL_DEFS } from './mapData';

interface Props {
  state: GameState;
  onUseSkill: (s: SkillId) => void;
  onToggleAuto: () => void;
  onUsePotion: (k: 'hp_potion' | 'mp_potion') => void;
  onOpenMenu: () => void;
  onSetAutoHeal: (v: number) => void;
  onSetAutoMana: (v: number) => void;
  onToggleAutoPotion: () => void;
}

export default function CombatHUD({
  state, onUseSkill, onToggleAuto, onUsePotion, onOpenMenu,
  onSetAutoHeal, onSetAutoMana, onToggleAutoPotion,
}: Props) {
  const { player, skills, autoMode, bag, autoHealThreshold, autoManaThreshold, autoPotionEnabled } = state;
  const [showAutoCfg, setShowAutoCfg] = useState(false);
  const target = state.mobs.find(m => m.id === state.selectedMobId && m.alive);
  const now = Date.now();
  const hpPot = bag.find(i => i.id === 'hp_potion');
  const mpPot = bag.find(i => i.id === 'mp_potion');

  return (
    <>
      {/* Target HP — top center */}
      {target && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-fade-in">
          <div
            className="px-3 py-1.5 flex items-center gap-2 min-w-[180px] rounded-md"
            style={{
              background: 'linear-gradient(180deg, rgba(20,10,5,0.95), rgba(5,2,0,0.95))',
              border: '1px solid hsl(40 70% 55%)',
              boxShadow: '0 0 16px hsl(40 70% 45% / 0.4), inset 0 0 8px hsl(40 60% 30% / 0.4)',
            }}
          >
            <span className="text-lg">👹</span>
            <div className="flex-1">
              <div className="text-[10px] font-bold tracking-wider" style={{ color: 'hsl(40 90% 70%)', textShadow: '0 0 4px hsl(40 80% 40%)' }}>
                {target.name}
              </div>
              <div className="h-2 mt-1 bg-black/70 rounded-full overflow-hidden border border-amber-900/60">
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${(target.hp / target.maxHp) * 100}%`,
                    background: 'linear-gradient(90deg, hsl(0 80% 35%), hsl(10 90% 55%))',
                    boxShadow: '0 0 6px hsl(0 80% 50%)',
                  }}
                />
              </div>
              <div className="text-[8px] font-mono mt-0.5" style={{ color: 'hsl(40 60% 75%)' }}>
                {Math.ceil(target.hp)} / {target.maxHp}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleAuto(); }}
        className="fixed bottom-32 right-3 w-14 h-14 rounded-full active:scale-95 z-40 pointer-events-auto flex flex-col items-center justify-center transition-all"
        style={{
          background: autoMode
            ? 'radial-gradient(circle at 30% 25%, hsl(45 95% 70%), hsl(35 90% 45%))'
            : 'radial-gradient(circle at 30% 25%, hsl(220 30% 18%), hsl(220 40% 6%))',
          border: `2px solid ${autoMode ? 'hsl(45 95% 75%)' : 'hsl(40 60% 50%)'}`,
          boxShadow: autoMode
            ? '0 0 20px hsl(45 95% 60% / 0.8), inset 0 0 10px hsl(45 95% 80% / 0.4)'
            : '0 0 10px hsl(40 50% 30% / 0.5), inset 0 0 6px hsl(40 50% 30% / 0.3)',
        }}
      >
        <span className="text-xl">⚔️</span>
        <span
          className="text-[8px] font-bold tracking-widest"
          style={{ color: autoMode ? 'hsl(30 80% 15%)' : 'hsl(40 80% 65%)' }}
        >
          AUTO
        </span>
      </button>

      {/* Auto config (gear) — toggles a small panel with HP/MP threshold sliders */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowAutoCfg(v => !v); }}
        className="fixed bottom-48 right-3 w-10 h-10 rounded-full active:scale-95 z-40 pointer-events-auto flex items-center justify-center transition-all"
        style={{
          background: 'radial-gradient(circle at 30% 25%, hsl(220 30% 18%), hsl(220 40% 6%))',
          border: `2px solid ${showAutoCfg ? 'hsl(45 95% 70%)' : 'hsl(40 60% 50%)'}`,
          boxShadow: showAutoCfg
            ? '0 0 12px hsl(45 95% 60% / 0.7)'
            : '0 0 6px hsl(40 50% 30% / 0.4)',
        }}
        title="Configurar Auto Heal / Auto Mana"
      >
        <span className="text-base">⚙️</span>
      </button>

      {showAutoCfg && (
        <div
          className="fixed bottom-32 right-16 z-50 pointer-events-auto w-60 rounded-xl p-3"
          style={{
            background: 'linear-gradient(180deg, hsl(220 50% 8% / 0.96), hsl(220 60% 4% / 0.96))',
            border: '2px solid hsl(40 70% 55%)',
            boxShadow: '0 0 24px hsl(40 70% 40% / 0.5), inset 0 0 12px hsl(40 60% 25% / 0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-widest" style={{ color: 'hsl(40 90% 75%)' }}>
              AUTO POTION
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleAutoPotion(); }}
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{
                background: autoPotionEnabled ? 'hsl(120 60% 35%)' : 'hsl(0 50% 35%)',
                color: '#fff',
                border: '1px solid hsl(40 60% 50%)',
              }}
            >
              {autoPotionEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <ThresholdRow
            label="Auto Heal"
            icon="❤️"
            color="hsl(0 80% 55%)"
            value={autoHealThreshold}
            potCount={hpPot?.count ?? 0}
            onChange={onSetAutoHeal}
          />

          <div className="h-2" />

          <ThresholdRow
            label="Auto Mana"
            icon="💧"
            color="hsl(210 90% 60%)"
            value={autoManaThreshold}
            potCount={mpPot?.count ?? 0}
            onChange={onSetAutoMana}
          />

          <p className="text-[9px] mt-2 leading-tight" style={{ color: 'hsl(40 50% 65%)' }}>
            Quando AUTO estiver ligado, poções são usadas automaticamente
            ao cair abaixo da %.
          </p>
        </div>
      )}

      {/* Bottom action bar — MENU + skills + potions */}
      <div className="fixed bottom-3 left-2 right-2 z-40 pointer-events-none flex items-end justify-between gap-2">
        {/* MENU button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenMenu(); }}
          className="pointer-events-auto w-14 h-14 rounded-xl flex flex-col items-center justify-center active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(180deg, hsl(220 40% 14%), hsl(220 50% 6%))',
            border: '2px solid hsl(40 70% 55%)',
            boxShadow: '0 0 12px hsl(40 70% 45% / 0.5), inset 0 0 8px hsl(40 60% 25% / 0.5)',
          }}
        >
          <div className="flex flex-col gap-[2px]">
            <span className="block w-5 h-[2px]" style={{ background: 'hsl(40 90% 70%)' }} />
            <span className="block w-5 h-[2px]" style={{ background: 'hsl(40 90% 70%)' }} />
            <span className="block w-5 h-[2px]" style={{ background: 'hsl(40 90% 70%)' }} />
          </div>
          <span className="text-[8px] font-bold tracking-widest mt-1" style={{ color: 'hsl(40 90% 70%)' }}>MENU</span>
        </button>

        {/* Skills da classe (até 4) */}
        <div className="pointer-events-auto flex items-end gap-2">
          {skills.slice(0, 4).map(sk => {
            const def = SKILL_DEFS[sk.id];
            if (!def) return null;
            const onCd = now < sk.cooldownUntil;
            const cdLeft = Math.max(0, sk.cooldownUntil - now);
            const cdPct = onCd ? (cdLeft / def.cooldown) * 100 : 0;
            const noMana = player.mp < def.manaCost;
            const disabled = !!onCd || noMana;
            return (
              <button
                key={sk.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); onUseSkill(sk.id); }}
                disabled={disabled}
                className="relative w-14 h-14 rounded-full active:scale-95 overflow-hidden flex flex-col items-center justify-center transition-all"
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${def.color}, hsl(220 50% 6%))`,
                  border: `2px solid ${disabled ? 'hsl(40 30% 35%)' : 'hsl(40 80% 60%)'}`,
                  opacity: disabled ? 0.55 : 1,
                  boxShadow: disabled ? 'none' : `0 0 14px ${def.color}, inset 0 0 8px ${def.color}80`,
                }}
                title={def.name}
              >
                <span className="text-2xl drop-shadow-lg">{def.icon}</span>
                <span className="absolute bottom-0.5 right-1 text-[7px] font-mono" style={{ color: 'hsl(200 90% 75%)' }}>
                  {def.manaCost}
                </span>
                {onCd && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{(cdLeft / 1000).toFixed(1)}s</span>
                  </div>
                )}
                {onCd && (
                  <div
                    className="absolute top-0 left-0 h-1"
                    style={{ width: `${100 - cdPct}%`, background: 'hsl(40 90% 60%)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Potions */}
        <div className="pointer-events-auto flex flex-col gap-2">
          {[
            { id: 'hp_potion' as const, icon: '❤️', count: hpPot?.count ?? 0, color: 'hsl(0 80% 55%)' },
            { id: 'mp_potion' as const, icon: '💧', count: mpPot?.count ?? 0, color: 'hsl(210 90% 60%)' },
          ].map(p => (
            <button
              key={p.id}
              type="button"
              disabled={p.count <= 0}
              onClick={(e) => { e.stopPropagation(); onUsePotion(p.id); }}
              className="relative w-12 h-12 rounded-lg flex items-center justify-center active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(180deg, hsl(220 40% 14%), hsl(220 50% 6%))',
                border: `2px solid ${p.count > 0 ? p.color : 'hsl(40 30% 35%)'}`,
                boxShadow: p.count > 0 ? `0 0 8px ${p.color}80` : 'none',
                opacity: p.count > 0 ? 1 : 0.5,
              }}
            >
              <span className="text-xl">{p.icon}</span>
              <span
                className="absolute -bottom-1 -right-1 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center px-1"
                style={{
                  background: 'hsl(220 50% 6%)',
                  border: '1px solid hsl(40 70% 55%)',
                  color: 'hsl(40 90% 75%)',
                }}
              >
                {p.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function ThresholdRow({
  label, icon, color, value, potCount, onChange,
}: { label: string; icon: string; color: string; value: number; potCount: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: 'hsl(40 90% 75%)' }}>
            {label}
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color }}>
          {value}% • x{potCount}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 5))}
          className="w-6 h-6 rounded text-xs font-bold"
          style={{
            background: 'hsl(220 40% 14%)',
            color: 'hsl(40 90% 75%)',
            border: '1px solid hsl(40 60% 45%)',
          }}
        >−</button>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(90deg, ${color} 0%, ${color} ${value}%, hsl(220 30% 15%) ${value}%, hsl(220 30% 15%) 100%)`,
            accentColor: color,
          }}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(100, value + 5))}
          className="w-6 h-6 rounded text-xs font-bold"
          style={{
            background: 'hsl(220 40% 14%)',
            color: 'hsl(40 90% 75%)',
            border: '1px solid hsl(40 60% 45%)',
          }}
        >+</button>
      </div>
    </div>
  );
}
