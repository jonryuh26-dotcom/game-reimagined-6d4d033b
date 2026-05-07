import { memo, useState, useMemo, useEffect } from 'react';
import { GameState, MapId, PetRarity, GameEvent } from './types';
import { loadAttrState, syncWithLevel, commitAttrState, ATTR_LABELS, AttrKey, AttrState } from './attributes';
import { clearProfile, loadProfile, getClass, deriveStats, ATTR_IDS } from './classes';
import { loadAvatar, saveAvatar, AVATAR_PALETTE, AvatarKind } from './avatar';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import {
  MAPS, RARITY_COLORS,
  PET_CHEST_COST_RUBY, PET_CHEST_COST_GOLD,
  PLANFY_NEW_GOLD_COST, PLANFY_NEW_RUBY_COST,
  REVIVE_CRYSTAL_COST, RARE_CHEST_COST, EPIC_CHEST_COST, LEGENDARY_CHEST_COST,
  DARK_MAGE_TELEPORT_COST, BOSS_MAP_INTERVAL, PROGRESSION_MAPS,
} from './mapData';

interface GameUIProps {
  state: GameState;
  onTogglePetMenu: () => void;
  onToggleShop: () => void;
  onToggleTeleport: () => void;
  onToggleQuest: () => void;
  onToggleBossMenu: () => void;
  onToggleBag: () => void;
  onToggleDarkMage: () => void;
  onToggleReport: () => void;
  onToggleMenu: () => void;
  onTeleport: (mapId: MapId) => void;
  onBuyPetChest: () => void;
  onBuyChestType: (type: 'rare_chest' | 'epic_chest' | 'legendary_chest') => void;
  onBuyPlanfyEgg: () => void;
  onAssignPet: (petId: string, mapId: MapId) => void;
  onClaimQuest: (questId: string) => void;
  onDismissAFK: () => void;
  onRevivePet: (petId: string) => void;
  onUseTeleportScroll: (mapId: MapId) => void;
  onDarkMageSendPet: (petId: string, mapId: MapId) => void;
  onSelectDarkMagePet: (petId: string | null) => void;
  onSetPetFilter: (filter: PetRarity | 'all') => void;
  onClearEvents: () => void;
  onOpenEgg: (kind: 'egg_common' | 'egg_rare' | 'egg_magic' | 'egg_epic' | 'egg_legendary' | 'egg_mythic') => void;
  onTradeFragments: (kind: 'hp_potion' | 'mp_potion') => void;
  nextDemonSpawnAt: number;
  onRefreshStats?: () => void;
}

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
function formatOfflineTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

const rarityBg: Record<string, string> = {
  common: 'bg-green-500/10 border-green-500/60',
  rare: 'bg-blue-500/10 border-blue-500/60',
  epic: 'bg-purple-500/10 border-purple-500/60',
  legendary: 'bg-orange-500/10 border-orange-500/60',
};
const rarityLabel: Record<string, string> = { common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário' };

// Dark fantasy gold-bordered panel
const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, hsl(220 50% 8% / 0.96), hsl(220 60% 4% / 0.96))',
  border: '2px solid hsl(40 70% 55%)',
  boxShadow: '0 0 24px hsl(40 70% 40% / 0.4), inset 0 0 16px hsl(40 60% 20% / 0.4)',
};
const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, hsl(220 30% 14%), hsl(220 40% 6%))',
  border: '1px solid hsl(40 60% 45%)',
  boxShadow: 'inset 0 0 8px hsl(40 50% 25% / 0.3)',
};
const goldText = 'hsl(40 90% 70%)';

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 rounded-md transition-all active:scale-95"
      style={{
        background: active ? 'linear-gradient(180deg, hsl(40 70% 30%), hsl(40 80% 18%))' : 'transparent',
        border: active ? '1px solid hsl(40 90% 70%)' : '1px solid hsl(40 50% 30% / 0.4)',
        boxShadow: active ? '0 0 10px hsl(40 80% 50% / 0.6)' : 'none',
      }}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[8px] font-bold mt-0.5 tracking-wider" style={{ color: active ? 'hsl(40 95% 85%)' : 'hsl(40 50% 60%)' }}>
        {label}
      </span>
    </button>
  );
}

function GameUI({
  state, onTogglePetMenu, onToggleShop, onToggleTeleport, onToggleQuest,
  onToggleBossMenu, onToggleBag, onToggleDarkMage, onToggleReport, onToggleMenu,
  onTeleport, onBuyPetChest, onBuyChestType, onBuyPlanfyEgg, onAssignPet, onClaimQuest, onDismissAFK, onRevivePet,
  onUseTeleportScroll, onDarkMageSendPet, onSelectDarkMagePet, onSetPetFilter, onClearEvents, nextDemonSpawnAt, onRefreshStats,
}: GameUIProps) {
  const { resources, currentMap, pets, level, xpPercent, quests, bag, alerts, petQuestRarityFilter, player } = state;
  const mapConfig = MAPS[currentMap];
  const filteredPets = petQuestRarityFilter === 'all' ? pets : pets.filter(p => p.rarity === petQuestRarityFilter);
  const scrollItem = bag.find(i => i.id === 'teleport_scroll');
  const scrollCount = scrollItem?.count ?? 0;
  const blackCrystal = bag.find(i => i.id === 'black_crystal');
  const blackCrystalCount = blackCrystal?.count ?? 0;
  const bossTimerMs = Math.max(0, state.bossMapTimer - Date.now());
  const demonTimerMs = Math.max(0, nextDemonSpawnAt - Date.now());
  const darkMage = state.walkingNPCs.find(n => n.isDarkMage);

  // Player profile (class) + attributes
  const profile = useMemo(() => loadProfile(), []);
  const cls = profile ? getClass(profile.classId) : null;
  const [attrs, setAttrs] = useState<AttrState>(() => syncWithLevel(loadAttrState(level), level));
  useEffect(() => { setAttrs(a => syncWithLevel(a, level)); }, [level]);
  const inCombat = state.mobs.some(m => m.alive && m.mapId === state.currentMap && Math.hypot(m.x - state.player.x, m.y - state.player.y) < 220);

  const baseAttrs = useMemo(() => ({ ...attrs.values }), [profile?.classId]);
  const [savedSnapshot, setSavedSnapshot] = useState<typeof attrs.values | null>(null);
  const initialAttrs = savedSnapshot ?? baseAttrs;
  const dirty = useMemo(() => (Object.keys(attrs.values) as AttrKey[]).some(k => attrs.values[k] !== initialAttrs[k]), [attrs.values, initialAttrs]);
  // Trava enquanto não houver pontos novos para distribuir após salvar
  const locked = savedSnapshot !== null;
  // Liberar quando o nível conceder novos pontos
  useEffect(() => { if (attrs.unspent > 0) setSavedSnapshot(null); }, [attrs.lastLevel]);

  const adjustAttr = (k: AttrKey, d: number) => {
    if (locked) return;
    setAttrs(a => {
      if (d > 0 && a.unspent <= 0) return a;
      if (d < 0 && a.values[k] <= initialAttrs[k]) return a;
      return { ...a, values: { ...a.values, [k]: a.values[k] + d }, unspent: a.unspent - d };
    });
  };

  const onSaveAttrs = () => {
    commitAttrState(attrs);
    onRefreshStats?.();
    setSavedSnapshot({ ...attrs.values });
  };

  const derived = profile ? deriveStats(profile.classId, attrs.values) : null;
  const radarData = (ATTR_IDS).map(k => ({ attr: ATTR_LABELS[k].short, value: attrs.values[k] }));

  const handleSwitchClass = () => {
    if (inCombat) { alert('Não é possível trocar de classe em combate.'); return; }
    if (!confirm('Trocar de classe? Seu personagem atual será descartado.')) return;
    clearProfile();
    localStorage.removeItem('ryuzen-attrs-meta-v2');
    location.reload();
  };

  type Tab = 'status' | 'pets' | 'shop' | 'bag' | 'quest' | 'map' | 'boss' | 'dark' | 'report';
  const [tab, setTab] = useState<Tab>('status');
  const [avatar, setAvatarState] = useState(() => loadAvatar());
  const updateAvatar = (patch: Partial<typeof avatar>) => {
    const next = { ...avatar, ...patch };
    setAvatarState(next);
    saveAvatar(next);
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'alive' | 'dead' | 'busy' | 'free'>('all');
  const [mapFilter, setMapFilter] = useState<MapId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'none' | 'hp' | 'energy' | 'speed' | 'efficiency'>('none');

  const visiblePets = useMemo(() => {
    let list = filteredPets;
    if (statusFilter === 'alive') list = list.filter(p => p.state !== 'dead');
    else if (statusFilter === 'dead') list = list.filter(p => p.state === 'dead');
    else if (statusFilter === 'busy') list = list.filter(p => p.assignedMap !== null && p.state !== 'dead');
    else if (statusFilter === 'free') list = list.filter(p => p.assignedMap === null && p.state !== 'dead');
    if (mapFilter !== 'all') list = list.filter(p => p.assignedMap === mapFilter);
    if (sortBy !== 'none') {
      list = [...list].sort((a, b) => {
        const ka = sortBy === 'hp' ? a.hp : sortBy === 'energy' ? a.energy : sortBy === 'speed' ? a.speed : a.efficiency;
        const kb = sortBy === 'hp' ? b.hp : sortBy === 'energy' ? b.energy : sortBy === 'speed' ? b.speed : b.efficiency;
        return kb - ka;
      });
    }
    return list;
  }, [filteredPets, statusFilter, mapFilter, sortBy]);

  const aliveCount = pets.filter(p => p.state !== 'dead').length;
  const deadCount = pets.filter(p => p.state === 'dead').length;
  const busyCount = pets.filter(p => p.assignedMap !== null && p.state !== 'dead').length;

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'status', icon: '👤', label: 'Status' },
    { id: 'pets', icon: '🐾', label: 'Pets' },
    { id: 'shop', icon: '🏪', label: 'Loja' },
    { id: 'bag', icon: '🎒', label: 'Bag' },
    { id: 'quest', icon: '📜', label: 'Quest' },
    { id: 'map', icon: '🗺️', label: 'Mapa' },
    { id: 'boss', icon: '🏆', label: 'Boss' },
    { id: 'report', icon: '📋', label: 'Log' },
    ...(darkMage ? [{ id: 'dark' as Tab, icon: '🧙‍♂️', label: 'Mago' }] : []),
  ];

  return (
    <>
      {/* AFK Return */}
      {state.afkResult?.show && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 animate-fade-in"
          onTouchStart={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          <div className="rounded-2xl p-5 max-w-xs w-full text-center" style={panelStyle}>
            <div className="text-lg font-bold mb-2" style={{ color: goldText }}>🌙 Bem-vindo de volta!</div>
            <div className="text-gray-300 text-xs mb-4">Seus pets farmaram enquanto você estava fora</div>
            <div className="bg-black/50 rounded-lg p-3 mb-3 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">⏱️ Tempo:</span><span className="text-white font-mono">{formatOfflineTime(state.afkResult.timeOffline)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-yellow-400">🪙 Ouro:</span><span className="text-yellow-300 font-bold">+{state.afkResult.goldEarned}</span></div>
              <div className="flex justify-between text-sm"><span className="text-red-400">💎 Rubis:</span><span className="text-red-300 font-bold">+{state.afkResult.rubyEarned}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">👹 Penalidade:</span><span className="text-red-400">-{state.afkResult.demonPenalty}%</span></div>
            </div>
            <button className="w-full bg-amber-600 text-white rounded-lg py-2.5 text-sm font-bold active:scale-95" onClick={onDismissAFK}>Coletar</button>
          </div>
        </div>
      )}

      {/* TOP HUD — Avatar + HP/MP + resources */}
      <div className="fixed top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none z-20">
        {/* Left: avatar + bars */}
        <div className="pointer-events-auto" style={{ ...panelStyle, borderRadius: 12, padding: '6px 8px' }}>
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div
              className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'radial-gradient(circle at 30% 25%, hsl(40 80% 50%), hsl(220 50% 8%))',
                border: '2px solid hsl(40 90% 70%)',
                boxShadow: '0 0 10px hsl(40 80% 50% / 0.6)',
              }}
            >
              <span className="text-2xl">🧙</span>
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 rounded-full text-[8px] font-bold"
                style={{ background: 'hsl(220 50% 6%)', border: '1px solid hsl(40 90% 70%)', color: goldText }}
              >
                {level}
              </div>
            </div>
            {/* HP/MP/XP */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              {/* HP */}
              <div className="flex items-center gap-1">
                <span className="text-[8px] w-4 font-bold" style={{ color: 'hsl(0 80% 65%)' }}>HP</span>
                <div
                  className="flex-1 h-3 rounded-full overflow-hidden relative"
                  style={{ background: 'hsl(220 60% 4%)', border: '1px solid hsl(0 60% 35%)' }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(player.hp / player.maxHp) * 100}%`,
                      background: 'linear-gradient(90deg, hsl(0 80% 35%), hsl(10 90% 55%))',
                      boxShadow: '0 0 6px hsl(0 80% 50%)',
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white" style={{ textShadow: '0 0 3px #000' }}>
                    {Math.ceil(player.hp)}/{player.maxHp}
                  </span>
                </div>
              </div>
              {/* MP */}
              <div className="flex items-center gap-1">
                <span className="text-[8px] w-4 font-bold" style={{ color: 'hsl(210 90% 70%)' }}>MP</span>
                <div
                  className="flex-1 h-3 rounded-full overflow-hidden relative"
                  style={{ background: 'hsl(220 60% 4%)', border: '1px solid hsl(210 60% 35%)' }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(player.mp / player.maxMp) * 100}%`,
                      background: 'linear-gradient(90deg, hsl(220 80% 35%), hsl(190 90% 55%))',
                      boxShadow: '0 0 6px hsl(210 80% 50%)',
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white" style={{ textShadow: '0 0 3px #000' }}>
                    {Math.ceil(player.mp)}/{player.maxMp}
                  </span>
                </div>
              </div>
              {/* XP */}
              <div className="flex items-center gap-1">
                <span className="text-[8px] w-4 font-bold" style={{ color: goldText }}>XP</span>
                <div className="flex-1 h-1.5 bg-black/60 rounded-full overflow-hidden border border-amber-900/60">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, hsl(40 80% 40%), hsl(45 95% 65%))', boxShadow: '0 0 4px hsl(40 90% 60%)' }}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Resources */}
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-amber-900/40">
            <div className="flex items-center gap-1"><span className="text-[12px]">🪙</span><span className="text-[10px] font-mono font-bold" style={{ color: 'hsl(45 95% 65%)' }}>{resources.gold}</span></div>
            <div className="flex items-center gap-1"><span className="text-[12px]">🔴</span><span className="text-[10px] font-mono font-bold" style={{ color: 'hsl(0 90% 65%)' }}>{resources.ruby}</span></div>
            <div className="flex items-center gap-1"><span className="text-[12px]">💎</span><span className="text-[10px] font-mono font-bold" style={{ color: 'hsl(190 90% 70%)' }}>{resources.crystal}</span></div>
          </div>
          {/* Map name */}
          <div className="text-[9px] font-bold mt-1 tracking-wider" style={{ color: mapConfig.color }}>
            📍 {mapConfig.name}
          </div>
        </div>

        {/* Right: timers + status */}
        <div className="pointer-events-auto flex flex-col gap-1 items-end">
          <div className="px-2 py-1 rounded-md flex items-center gap-1" style={{ ...cardStyle, borderColor: 'hsl(280 60% 50%)' }}>
            <span className="text-[10px]">🏆</span>
            <span className="text-[8px] font-mono" style={{ color: 'hsl(280 70% 80%)' }}>
              {state.bosses.length > 0 ? 'BOSS!' : formatTime(bossTimerMs)}
            </span>
          </div>
          <div className="px-2 py-1 rounded-md flex items-center gap-1" style={{ ...cardStyle, borderColor: 'hsl(0 60% 45%)' }}>
            <span className="text-[10px]">👹</span>
            <span className="text-[8px] font-mono" style={{ color: 'hsl(0 80% 75%)' }}>
              {state.demons.length > 0 ? `${state.demons.length} ativos` : formatTime(demonTimerMs)}
            </span>
          </div>
          {state.chestOpened && (
            <div className="px-2 py-1 rounded-md flex items-center gap-1" style={cardStyle}>
              <div className={`w-2 h-2 rounded-full ${state.cycleState === 'collecting' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-white text-[8px]">{state.cycleState === 'collecting' ? 'Coletando' : 'Dormindo'}</span>
              <span className="text-[8px] font-mono" style={{ color: goldText }}>{formatTime(state.cycleTimer)}</span>
            </div>
          )}
          {pets.filter(p => p.assignedMap).length > 0 && (
            <div className="px-2 py-0.5 rounded-md" style={cardStyle}>
              <span className="text-[8px]" style={{ color: 'hsl(140 80% 65%)' }}>🐾 {pets.filter(p => p.assignedMap).length}</span>
            </div>
          )}
          {scrollCount > 0 && (
            <div className="px-2 py-0.5 rounded-md" style={{ ...cardStyle, borderColor: 'hsl(240 50% 55%)' }}>
              <span className="text-[8px]" style={{ color: 'hsl(240 80% 80%)' }}>📜 {scrollCount}</span>
            </div>
          )}
          {blackCrystalCount > 0 && (
            <div className="px-2 py-0.5 rounded-md" style={{ ...cardStyle, borderColor: 'hsl(280 60% 45%)' }}>
              <span className="text-[8px]" style={{ color: 'hsl(280 70% 80%)' }}>🖤 {blackCrystalCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Event Alerts */}
      {alerts.length > 0 && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 flex flex-col gap-1 z-20 pointer-events-none">
          {alerts.slice(0, 3).map(alert => (
            <div key={alert.id}
              className="rounded-lg px-3 py-1.5 animate-fade-in"
              style={{
                background: 'linear-gradient(180deg, hsl(220 50% 8% / 0.95), hsl(220 60% 4% / 0.95))',
                border: `2px solid ${alert.color}`,
                boxShadow: `0 0 14px ${alert.color}80`,
              }}>
              <span className="text-white text-[10px] font-bold">{alert.icon} {alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      {!state.chestOpened && !state.showMenu && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg z-20 animate-fade-in" style={cardStyle}>
          <span className="text-white text-[10px]">Encontre o baú e toque para abrir!</span>
        </div>
      )}

      {/* ========== DASHBOARD ========== */}
      {state.showMenu && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center p-2 animate-fade-in"
          style={{ background: 'radial-gradient(circle at center, hsl(220 60% 4% / 0.85), hsl(220 80% 2% / 0.95))' }}
          onTouchStart={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
        >
          <div className="w-full max-w-md flex flex-col rounded-2xl overflow-hidden" style={panelStyle}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'hsl(40 60% 35%)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚜️</span>
                <span className="text-sm font-bold tracking-widest" style={{ color: goldText, textShadow: '0 0 6px hsl(40 80% 40%)' }}>
                  GRIMÓRIO
                </span>
              </div>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95"
                style={{ background: 'hsl(220 60% 6%)', border: '1px solid hsl(40 70% 55%)', color: goldText }}
                onClick={onToggleMenu}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 px-2 py-2 border-b" style={{ borderColor: 'hsl(40 50% 25%)' }}>
              {tabs.map(t => <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />)}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-3">

              {/* STATUS TAB */}
              {tab === 'status' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={cardStyle}>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'radial-gradient(circle at 30% 25%, hsl(40 80% 50%), hsl(220 50% 8%))',
                        border: '2px solid hsl(40 90% 70%)',
                        boxShadow: '0 0 14px hsl(40 80% 50% / 0.6)',
                      }}
                    >
                      <span className="text-3xl">🧙</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold" style={{ color: goldText }}>Herói Lvl {level}</div>
                      <div className="text-[9px]" style={{ color: 'hsl(40 50% 60%)' }}>Mestre dos Pets · {mapConfig.name}</div>
                      <div className="mt-1 h-1.5 bg-black/60 rounded-full overflow-hidden border border-amber-900/60">
                        <div className="h-full" style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, hsl(40 80% 40%), hsl(45 95% 65%))' }} />
                      </div>
                      <div className="text-[8px] mt-0.5" style={{ color: 'hsl(40 50% 60%)' }}>XP {Math.floor(xpPercent)}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="HP" value={`${Math.ceil(player.hp)} / ${player.maxHp}`} color="hsl(0 80% 60%)" icon="❤️" />
                    <StatCard label="MP" value={`${Math.ceil(player.mp)} / ${player.maxMp}`} color="hsl(210 90% 65%)" icon="💧" />
                    <StatCard label="Ouro" value={String(resources.gold)} color="hsl(45 95% 65%)" icon="🪙" />
                    <StatCard label="Rubi" value={String(resources.ruby)} color="hsl(0 90% 65%)" icon="🔴" />
                    <StatCard label="Cristal" value={String(resources.crystal)} color="hsl(190 90% 70%)" icon="💎" />
                    <StatCard label="Pets" value={`${aliveCount} / ${pets.length}`} color="hsl(140 80% 65%)" icon="🐾" />
                  </div>

                  <div className="p-3 rounded-xl" style={cardStyle}>
                    <div className="text-[10px] font-bold mb-2 tracking-wider" style={{ color: goldText }}>📊 RESUMO</div>
                    <div className="grid grid-cols-2 gap-y-1 text-[10px]">
                      <span className="text-gray-400">Pets ocupados:</span><span className="text-white text-right">{busyCount}</span>
                      <span className="text-gray-400">Pets mortos:</span><span className="text-red-400 text-right">{deadCount}</span>
                      <span className="text-gray-400">Demônios mortos:</span><span className="text-white text-right">{state.events.filter(e => e.type === 'demon_killed').length}</span>
                      <span className="text-gray-400">Próximo Boss:</span><span className="text-purple-300 text-right font-mono">{formatTime(bossTimerMs)}</span>
                    </div>
                  </div>

                  {/* CLASS / SWITCH */}
                  {cls && (
                    <div className="p-3 rounded-xl flex items-center gap-3" style={cardStyle}>
                      <div className="text-2xl">{cls.emoji}</div>
                      <div className="flex-1">
                        <div className="text-[9px] tracking-[0.3em]" style={{ color: goldText }}>{cls.title.toUpperCase()}</div>
                        <div className="text-[12px] text-white font-bold">{cls.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSwitchClass}
                        disabled={inCombat}
                        className="text-[9px] px-2.5 py-1.5 rounded-md border disabled:opacity-40"
                        style={{ borderColor: 'hsl(40 70% 55%)', color: goldText, background: 'hsl(220 50% 6%)' }}
                      >
                        {inCombat ? '⚔ em combate' : 'Trocar Classe'}
                      </button>
                    </div>
                  )}

                  {/* AVATAR — escolha sprite + cor da roupa */}
                  <div className="p-3 rounded-xl" style={cardStyle}>
                    <div className="text-[10px] font-bold mb-2 tracking-wider" style={{ color: goldText }}>🎭 AVATAR</div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(['mage','dark'] as AvatarKind[]).map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => updateAvatar({ kind: k })}
                          className="rounded-lg p-2 flex flex-col items-center gap-1 active:scale-95 transition"
                          style={{
                            background: avatar.kind === k ? 'linear-gradient(180deg,hsl(40 70% 30%),hsl(40 80% 18%))' : 'hsl(220 40% 8%)',
                            border: `1px solid ${avatar.kind === k ? 'hsl(40 90% 70%)' : 'hsl(220 40% 25%)'}`,
                          }}
                        >
                          <span className="text-2xl">{k === 'mage' ? '🧙‍♂️' : '🥷'}</span>
                          <span className="text-[10px] text-white font-bold">{k === 'mage' ? 'Mago' : 'Sombra'}</span>
                        </button>
                      ))}
                    </div>
                    <div className="text-[9px] mb-1.5 text-gray-400">Cor da roupa</div>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_PALETTE.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          title={p.label}
                          onClick={() => updateAvatar({ color: p.color })}
                          className="h-9 rounded-md active:scale-90 transition"
                          style={{
                            background: p.color,
                            border: avatar.color === p.color ? '2px solid hsl(40 95% 70%)' : '2px solid hsl(220 30% 20%)',
                            boxShadow: avatar.color === p.color ? `0 0 8px ${p.color}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ATTRIBUTES + Radar Chart */}
                  <div className="p-3 rounded-xl" style={cardStyle}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold tracking-wider" style={{ color: goldText }}>⚜ ATRIBUTOS</div>
                      <div className="text-[10px]">
                        <span className="text-gray-400">Pontos: </span>
                        <span className="font-bold" style={{ color: goldText }}>{attrs.unspent}</span>
                      </div>
                    </div>

                    {/* Radar chart */}
                    <div style={{ width: '100%', height: 160 }}>
                      <ResponsiveContainer>
                        <RadarChart data={radarData} outerRadius="75%">
                          <PolarGrid stroke="hsl(40 40% 30%)" />
                          <PolarAngleAxis dataKey="attr" tick={{ fill: goldText, fontSize: 9 }} />
                          <Radar dataKey="value" stroke={goldText} fill={goldText} fillOpacity={0.35} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Derived stats summary */}
                    {derived && (
                      <div className="grid grid-cols-3 gap-1 mb-2 text-[9px]">
                        <div className="text-center px-1 py-1 rounded" style={{ background: 'hsl(220 50% 6%)' }}>
                          <div className="text-gray-400">HP</div><div className="text-white font-bold">{Math.round(derived.hp)}</div>
                        </div>
                        <div className="text-center px-1 py-1 rounded" style={{ background: 'hsl(220 50% 6%)' }}>
                          <div className="text-gray-400">MP</div><div className="text-white font-bold">{Math.round(derived.mp)}</div>
                        </div>
                        <div className="text-center px-1 py-1 rounded" style={{ background: 'hsl(220 50% 6%)' }}>
                          <div className="text-gray-400">ATK</div><div className="text-white font-bold">{Math.round(derived.atk)}</div>
                        </div>
                        <div className="text-center px-1 py-1 rounded" style={{ background: 'hsl(220 50% 6%)' }}>
                          <div className="text-gray-400">DEF</div><div className="text-white font-bold">{Math.round(derived.def)}</div>
                        </div>
                        <div className="text-center px-1 py-1 rounded" style={{ background: 'hsl(220 50% 6%)' }}>
                          <div className="text-gray-400">SPD</div><div className="text-white font-bold">{derived.spd.toFixed(1)}</div>
                        </div>
                        <div className="text-center px-1 py-1 rounded" style={{ background: 'hsl(220 50% 6%)' }}>
                          <div className="text-gray-400">CRIT</div><div className="text-white font-bold">{derived.crit.toFixed(1)}%</div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-1.5">
                      {ATTR_IDS.map(k => (
                        <div key={k} className="flex items-center justify-between rounded-lg px-2 py-1.5"
                          style={{ background: 'hsl(220 50% 6%)', border: '1px solid hsl(40 40% 25%)' }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{ATTR_LABELS[k].icon}</span>
                            <div>
                              <div className="text-[10px] text-white font-bold">{ATTR_LABELS[k].label}</div>
                              <div className="text-[8px] text-gray-400">{ATTR_LABELS[k].desc}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => adjustAttr(k, -1)} disabled={locked || attrs.values[k] <= initialAttrs[k]}
                              className="w-6 h-6 rounded border text-xs disabled:opacity-30"
                              style={{ borderColor: 'hsl(40 40% 30%)', color: '#aaa' }}>−</button>
                            <div className="w-7 text-center text-[11px] font-bold text-white">{attrs.values[k]}</div>
                            <button onClick={() => adjustAttr(k, 1)} disabled={locked || attrs.unspent <= 0}
                              className="w-6 h-6 rounded border text-xs disabled:opacity-30"
                              style={{ borderColor: 'hsl(40 70% 55%)', color: goldText, background: 'hsl(40 60% 15%)' }}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onSaveAttrs}
                      disabled={!dirty || locked}
                      className="mt-3 w-full py-2 rounded-md text-[11px] font-bold tracking-wider disabled:opacity-90"
                      style={ locked
                        ? { background: 'linear-gradient(180deg, hsl(0 70% 35%), hsl(0 80% 22%))', border: '1px solid hsl(0 90% 70%)', color: '#fff' }
                        : { background: 'linear-gradient(180deg, hsl(40 70% 35%), hsl(40 80% 22%))', border: '1px solid hsl(40 90% 70%)', color: '#1a0f00' }
                      }
                    >
                      {locked ? '🔒 STATUS SALVO' : '💾 SALVAR STATUS'}
                    </button>
                  </div>
                </div>
              )}

              {/* PETS TAB */}
              {tab === 'pets' && (
                <div className="animate-fade-in">
                  <div className="flex gap-2 mb-2 text-[8px]">
                    <span className="text-green-400">✓ {aliveCount}</span>
                    <span className="text-red-400">💀 {deadCount}</span>
                    <span style={{ color: goldText }}>📍 {busyCount}</span>
                  </div>
                  <div className="flex gap-1 mb-1.5 flex-wrap">
                    {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(r => (
                      <button key={r} onClick={() => onSetPetFilter(r)}
                        className={`text-[8px] px-2 py-1 rounded-full border transition-colors ${
                          petQuestRarityFilter === r ? 'border-amber-400 text-white' : 'border-gray-700 text-gray-400'
                        }`}
                        style={{ background: petQuestRarityFilter === r ? 'hsl(40 70% 25%)' : 'hsl(220 50% 6%)' }}>
                        {r === 'all' ? 'Todos' : rarityLabel[r]} ({r === 'all' ? pets.length : pets.filter(p => p.rarity === r).length})
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 mb-1.5 flex-wrap">
                    {([['all', 'Todos'], ['alive', '✓'], ['dead', '💀'], ['busy', '⛏️'], ['free', '💤']] as const).map(([k, l]) => (
                      <button key={k} onClick={() => setStatusFilter(k)}
                        className={`text-[8px] px-2 py-1 rounded-full border ${statusFilter === k ? 'border-emerald-400 text-white' : 'border-gray-700 text-gray-400'}`}
                        style={{ background: statusFilter === k ? 'hsl(150 60% 25%)' : 'hsl(220 50% 6%)' }}>{l}</button>
                    ))}
                  </div>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    <span className="text-[8px] text-gray-500 self-center">Ordenar:</span>
                    {([['none', '–'], ['hp', '❤️'], ['energy', '⚡'], ['speed', '💨'], ['efficiency', '⛏️']] as const).map(([k, l]) => (
                      <button key={k} onClick={() => setSortBy(k)}
                        className={`text-[8px] px-2 py-1 rounded-full border ${sortBy === k ? 'border-purple-400 text-white' : 'border-gray-700 text-gray-400'}`}
                        style={{ background: sortBy === k ? 'hsl(280 60% 25%)' : 'hsl(220 50% 6%)' }}>{l}</button>
                    ))}
                  </div>
                  {visiblePets.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🥚</div>
                      <div className="text-gray-400 text-xs">{pets.length === 0 ? 'Nenhum pet. Compre na Loja!' : 'Nenhum pet com esses filtros.'}</div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {visiblePets.map(pet => (
                      <div key={pet.id} className={`rounded-xl border-2 p-2.5 ${rarityBg[pet.rarity]}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: pet.color, border: `2px solid ${pet.accentColor}` }}>
                            <span className="text-xs">{pet.isHealer ? '💖' : '🐾'}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-white text-[11px] font-bold">{pet.name}</div>
                            <div className="text-[8px]" style={{ color: RARITY_COLORS[pet.rarity] }}>
                              {rarityLabel[pet.rarity]} · {pet.isHealer ? '💖 Healer' : pet.variation === 'fast' ? '⚡' : pet.variation === 'slow' ? '🐢' : pet.variation === 'light_sleeper' ? '👁️' : '😴'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="text-[9px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: pet.state === 'farming' ? '#065f46' : pet.state === 'trapped' ? '#7f1d1d' : pet.state === 'dead' ? '#450a0a' : pet.state === 'sleeping' ? '#374151' : '#1e293b', color: '#fff' }}>
                              {pet.state === 'farming' ? '⛏️' : pet.state === 'trapped' ? '🔗' : pet.state === 'dead' ? '💀' : pet.state === 'sleeping' ? '😴' : '💤'}
                            </div>
                            <div className="text-[7px] text-red-400">❤️ {pet.hp}/{pet.maxHp}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1 mb-1.5">
                          {[['VEL', pet.speed], ['ENE', pet.energy], ['EFI', `${pet.efficiency}x`], ['SONO', `${Math.round(pet.sleepTime / 1000)}s`]].map(([label, val]) => (
                            <div key={label as string} className="text-center">
                              <div className="text-[7px] text-gray-400">{label}</div>
                              <div className="text-[9px] text-white font-bold">{val}</div>
                            </div>
                          ))}
                        </div>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-1.5">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${(pet.hp / pet.maxHp) * 100}%`,
                            backgroundColor: pet.hp > pet.maxHp * 0.5 ? '#22c55e' : pet.hp > pet.maxHp * 0.25 ? '#eab308' : '#ef4444',
                          }} />
                        </div>
                        {pet.state === 'dead' && (
                          <button className="w-full text-[9px] py-1.5 rounded bg-purple-600 text-white active:scale-95 font-bold"
                            onClick={() => onRevivePet(pet.id)}>
                            Reviver (💎 {REVIVE_CRYSTAL_COST})
                          </button>
                        )}
                        {pet.state === 'idle' && (
                          <div className="flex gap-1 flex-wrap">
                            {(Object.keys(MAPS) as MapId[]).map(m => (
                              <button key={m} className="flex-1 min-w-[60px] text-[7px] py-1 rounded bg-gray-700 text-white active:bg-gray-600"
                                onClick={() => onAssignPet(pet.id, m)}>
                                {MAPS[m].name.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        )}
                        {pet.assignedMap && (
                          <div className="text-[8px] text-gray-400 mt-1">📍 {MAPS[pet.assignedMap].name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SHOP TAB — agora é loja de TROCA de fragmentos */}
              {tab === 'shop' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="rounded-xl p-3 text-center" style={{ ...cardStyle, borderColor: 'hsl(280 60% 50%)' }}>
                    <div className="text-2xl mb-1">🔮</div>
                    <div className="text-white font-bold text-xs">Loja de Troca</div>
                    <div className="text-[9px] text-gray-400">Troque fragmentos de ovo por poções</div>
                    <div className="text-[10px] mt-1" style={{ color: goldText }}>
                      Você tem {(bag.find(i => i.id === 'fragments')?.count ?? 0)} 🔮
                    </div>
                  </div>

                  {([
                    { id: 'hp_potion' as const, name: 'Poção de Vida', icon: '❤️', color: 'hsl(0 80% 55%)' },
                    { id: 'mp_potion' as const, name: 'Poção de Mana', icon: '💧', color: 'hsl(210 90% 60%)' },
                  ]).map(p => {
                    const frags = bag.find(i => i.id === 'fragments')?.count ?? 0;
                    const can = frags >= 10;
                    return (
                      <div key={p.id} className="rounded-xl p-3 flex items-center gap-3" style={{ ...cardStyle, borderColor: p.color }}>
                        <div className="text-2xl">{p.icon}</div>
                        <div className="flex-1">
                          <div className="text-white font-bold text-[11px]">{p.name}</div>
                          <div className="text-[9px] text-gray-400">10 🔮 → 1 {p.icon}</div>
                        </div>
                        <button
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${can ? 'bg-emerald-600 text-white active:scale-95' : 'bg-gray-700 text-gray-500'}`}
                          onClick={() => onTradeFragments(p.id)}
                          disabled={!can}
                        >Trocar</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BAG */}
              {tab === 'bag' && (
                <div className="animate-fade-in">
                  {bag.every(i => i.count === 0) && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📦</div>
                      <div className="text-gray-400 text-xs">Inventário vazio</div>
                    </div>
                  )}
                  {bag.filter(i => i.count > 0).map(item => (
                    <div key={item.id} className="rounded-lg p-3 mb-2" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-2xl">{item.icon}</div>
                        <div className="flex-1">
                          <div className="text-white text-[11px] font-bold">{item.name}</div>
                          <div className="text-[9px]" style={{ color: goldText }}>x{item.count}</div>
                        </div>
                      </div>
                      {item.id === 'teleport_scroll' && (
                        <div>
                          <div className="text-gray-400 text-[8px] mb-1">Escolha o destino:</div>
                          <div className="grid grid-cols-2 gap-1">
                            {(Object.keys(MAPS) as MapId[]).map(m => (
                              <button key={m}
                                className={`text-[8px] py-1 rounded ${currentMap === m ? 'bg-gray-700 text-gray-500' : 'bg-indigo-700 text-white active:scale-95'}`}
                                disabled={currentMap === m}
                                onClick={() => onUseTeleportScroll(m)}>
                                {MAPS[m].name.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* QUEST */}
              {tab === 'quest' && (
                <div className="animate-fade-in">
                  <div className="text-red-300 text-[9px] mb-2">⚠️ Bruxos hostis spawnam demônios se ignorados!</div>
                  <div className="flex flex-col gap-2">
                    {quests.map(quest => (
                      <div key={quest.id} className="rounded-lg p-3" style={{ ...cardStyle, borderColor: quest.completed ? 'hsl(40 90% 60%)' : 'hsl(40 50% 30%)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-[11px] font-bold">{quest.title}</span>
                          {quest.claimed && <span className="text-green-400 text-[9px]">✓</span>}
                        </div>
                        <div className="text-gray-400 text-[9px] mb-2">{quest.description}</div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-2">
                            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%`, background: 'hsl(40 90% 60%)' }} />
                            </div>
                            <div className="text-[8px] text-gray-400 mt-0.5">{quest.progress}/{quest.target}</div>
                          </div>
                          <div className="text-right text-[9px]">
                            {quest.rewardGold > 0 && <span className="text-yellow-300">🪙{quest.rewardGold} </span>}
                            {quest.rewardRuby > 0 && <span className="text-red-300">🔴{quest.rewardRuby} </span>}
                            {quest.rewardCrystal > 0 && <span className="text-cyan-300">💎{quest.rewardCrystal}</span>}
                          </div>
                        </div>
                        {quest.completed && !quest.claimed && (
                          <button className="w-full mt-2 bg-amber-600 text-white rounded py-1.5 text-[10px] font-bold active:scale-95"
                            onClick={() => onClaimQuest(quest.id)}>Coletar</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MAP / TELEPORT — apenas 5 zonas progressivas */}
              {tab === 'map' && (
                <div className="animate-fade-in">
                  <div className="text-emerald-400 text-[10px] mb-3">⛩ Caminho de Ryūzen — 5 zonas progressivas</div>
                  <div className="flex flex-col gap-2">
                    {PROGRESSION_MAPS.map(({ id: mapId, minLevel }, idx) => {
                      const locked = level < minLevel;
                      const isCurrent = currentMap === mapId;
                      return (
                        <button key={mapId}
                          className="p-3 rounded-lg text-left flex items-center justify-between transition-all"
                          style={{
                            ...cardStyle,
                            borderColor: isCurrent ? 'hsl(40 90% 60%)' : locked ? 'hsl(0 30% 30%)' : 'hsl(40 30% 30%)',
                            opacity: isCurrent || locked ? 0.6 : 1,
                          }}
                          onClick={() => !locked && onTeleport(mapId)} disabled={isCurrent || locked}>
                          <div>
                            <div className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: MAPS[mapId].color }}>
                              <span className="font-oriental text-xs">{idx + 1}.</span> {MAPS[mapId].name}
                              {locked && <span>🔒</span>}
                            </div>
                            <div className="text-gray-400 text-[8px] mt-0.5">
                              Nível mín. <span className={locked ? 'text-red-400' : 'text-emerald-300'}>{minLevel}</span> · 💀 {MAPS[mapId].demonCount}+
                            </div>
                            <div className="text-[7px] text-yellow-300">🪙×{MAPS[mapId].goldBonus} · 🔴×{MAPS[mapId].rubyBonus}</div>
                          </div>
                          {!isCurrent && !locked && (
                            <span className="text-[9px] px-2 py-1 rounded font-bold bg-emerald-600 text-white">IR</span>
                          )}
                          {locked && (
                            <span className="text-[9px] px-2 py-1 rounded font-bold bg-red-900 text-red-200">Lvl {minLevel}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BOSS */}
              {tab === 'boss' && (
                <div className="animate-fade-in">
                  <div className="rounded-lg p-3 mb-3" style={{ ...cardStyle, borderColor: 'hsl(280 60% 50%)' }}>
                    <div className="text-[10px] text-purple-200 mb-1">Próximo Boss em:</div>
                    <div className="text-white font-mono text-2xl">{formatTime(bossTimerMs)}</div>
                    <div className="text-[8px] text-gray-400 mt-1">Intervalo: {(BOSS_MAP_INTERVAL / 60000).toFixed(0)} min</div>
                  </div>
                  <div className="text-purple-300 text-[10px] font-bold mb-2">Bosses Ativos:</div>
                  {state.bosses.length === 0 && <div className="text-gray-500 text-[10px] text-center py-4">Nenhum boss ativo</div>}
                  {state.bosses.map(boss => (
                    <div key={boss.id} className="rounded-lg p-2 mb-2" style={{ ...cardStyle, borderColor: 'hsl(280 60% 45%)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-[11px] font-bold">🐉 Boss</span>
                        <span className="text-[9px]" style={{ color: MAPS[boss.mapId].color }}>{MAPS[boss.mapId].name}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }} />
                      </div>
                      <div className="text-[8px] text-gray-400 mt-1">HP: {Math.ceil(boss.hp)}/{boss.maxHp}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* DARK MAGE */}
              {tab === 'dark' && darkMage && (
                <div className="animate-fade-in">
                  <div className="rounded-lg p-3 mb-3" style={{ ...cardStyle, borderColor: 'hsl(240 50% 45%)' }}>
                    <div className="text-indigo-200 text-[10px] mb-1">"Posso teleportar qualquer pet para qualquer mapa..."</div>
                    <div className="text-indigo-300 text-[9px]">Custo: 🪙{DARK_MAGE_TELEPORT_COST.toLocaleString()}</div>
                  </div>
                  {!state.selectedDarkMagePet ? (
                    <>
                      <div className="text-white text-[10px] font-bold mb-2">Escolha um pet:</div>
                      <div className="flex flex-col gap-1">
                        {pets.filter(p => p.state !== 'dead').map(p => (
                          <button key={p.id}
                            onClick={() => onSelectDarkMagePet(p.id)}
                            className={`text-left p-2 rounded border ${rarityBg[p.rarity]} active:scale-95`}>
                            <span className="text-white text-[10px] font-bold">{p.name}</span>
                            <span className="text-gray-400 text-[8px]"> · {p.assignedMap ? MAPS[p.assignedMap].name : 'Idle'}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-white text-[10px] font-bold mb-2">Para qual mapa?</div>
                      <div className="flex flex-col gap-1 mb-3">
                        {(Object.keys(MAPS) as MapId[]).map(m => (
                          <button key={m} disabled={resources.gold < DARK_MAGE_TELEPORT_COST}
                            onClick={() => onDarkMageSendPet(state.selectedDarkMagePet!, m)}
                            className={`p-2 rounded text-left ${resources.gold >= DARK_MAGE_TELEPORT_COST ? 'bg-indigo-700 text-white active:scale-95' : 'bg-gray-800 text-gray-500'}`}>
                            <span className="text-[10px] font-bold" style={{ color: MAPS[m].color }}>{MAPS[m].name}</span>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => onSelectDarkMagePet(null)} className="w-full py-1.5 text-[9px] bg-gray-700 text-white rounded">Voltar</button>
                    </>
                  )}
                </div>
              )}

              {/* REPORT */}
              {tab === 'report' && (
                <div className="animate-fade-in flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-emerald-400 text-[10px] font-bold">📜 Histórico ({state.events.length})</span>
                    <button onClick={onClearEvents} className="text-[9px] px-2 py-1 rounded bg-red-700 text-white active:scale-95">Limpar</button>
                  </div>
                  <div className="flex-1 overflow-auto space-y-1 pr-1">
                    {state.events.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-3xl mb-2">📭</div>
                        <div className="text-gray-500 text-[10px]">Nenhum evento ainda.</div>
                      </div>
                    )}
                    {state.events.map((ev: GameEvent) => (
                      <div key={ev.id} className="rounded px-2 py-1.5 border-l-2 flex items-start gap-2"
                        style={{ borderLeftColor: ev.color, background: 'hsl(220 50% 6% / 0.7)' }}>
                        <span className="text-[14px] leading-none mt-0.5">{ev.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-[10px] leading-tight">{ev.message}</div>
                          <div className="text-gray-500 text-[7px] mt-0.5">
                            {new Date(ev.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className="p-2 rounded-lg flex items-center gap-2" style={cardStyle}>
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] uppercase tracking-wider" style={{ color: 'hsl(40 50% 60%)' }}>{label}</div>
        <div className="text-[11px] font-bold font-mono truncate" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

export default memo(GameUI);
