import { useRef, useCallback, useEffect, useState } from 'react';
import { GameState, Position, MapId, Coin, Pet, PetRarity, PetVariation, Demon, Quest, Boss, WalkingNPC, InventoryItem, EventAlert, GameEvent, GameEventType, Mob, MobKind, Projectile, FloatingDamage, SkillId, GroundItem } from './types';
import {
  MAPS, MAP_WIDTH, MAP_HEIGHT, mapDims, PLAYER_SPEED, CREATURE_SPEED,
  COIN_RESPAWN_TIME, PET_FARM_DURATION, DEMON_SPAWN_INTERVAL,
  DEMON_TRAP_DURATION, DEMON_TRAP_CHANCE, TELEPORT_COST_GOLD, TELEPORT_COST_RUBY,
  PET_CHEST_COST_RUBY, PET_CHEST_COST_GOLD, XP_PER_LEVEL,
  PET_CONFIGS, GACHA_WEIGHTS, INITIAL_QUESTS, MAX_AFK_HOURS, AFK_DEMON_PENALTY,
  SNOW_INTERVAL, SNOW_DURATION, QUEST_RESET_TIME, BOSS_MAP_INTERVAL,
  PET_MAX_HP, BOSS_HP, REVIVE_CRYSTAL_COST,
  HEAL_INTERVAL, PLANFY_NEW_GOLD_COST, PLANFY_NEW_RUBY_COST,
  NPC_NAMES, NPC_COLORS,
  CHEST_RARITY_WEIGHTS, RARE_CHEST_COST, EPIC_CHEST_COST, LEGENDARY_CHEST_COST,
  DARK_MAGE_TELEPORT_COST, DARK_MAGE_SPAWN_INTERVAL, DARK_MAGE_DESPAWN,
  HOSTILE_NPC_PUNISH_INTERVAL, HOSTILE_NPC_DEMONS_PER_PUNISH,
  ALERT_PRE_BOSS_MS, ALERT_PRE_SNOW_MS, TELEPORT_SCROLL_DROP_CHANCE,
  PET_HP_VARIATION_MIN, PET_HP_VARIATION_MAX,
  DIFFICULTY_PETS_PER_TIER, DIFFICULTY_SPAWN_BONUS_PER_TIER, DIFFICULTY_SPEED_BONUS_PER_TIER,
  DEMON_HP_FIXED, DEMON_ELITE_HP_FIXED, DEMON_DMG_MIN, DEMON_DMG_MAX,
  DEMON_ELITE_DMG_MIN, DEMON_ELITE_DMG_MAX, DEMON_ELITE_REQUIRES_RARITY,
  PET_HIGH_ENERGY_THRESHOLD, PET_HIGH_ENERGY_DMG_REDUCTION, BLACK_CRYSTAL_DROP_CHANCE,
  PLAYER_MAX_HP, PLAYER_MAX_MP, PLAYER_HP_REGEN, PLAYER_MP_REGEN,
  PLAYER_BASIC_DMG_MIN, PLAYER_BASIC_DMG_MAX, PLAYER_ATTACK_RANGE, PLAYER_ATTACK_COOLDOWN,
  MOB_CONFIGS, MOB_RESPAWN_MS, MAP_MOB_KINDS, MAP_LEVEL_RANGE,
  PLAYER_BASE_SPEED, xpForLevel, xpDiffMultiplier,
} from './mapData';
import { CLASS_SKILLS, getClassSkills, SKILL_BY_ID } from './skills';
import { loadProfile, getClass, getProfileAttrs, deriveStats } from './classes';

const SKILL_DEFS = SKILL_BY_ID;

import { maskWalkable, hasMask } from './collisionMask';

// Mapas sem colisão (terreno aberto): vila e subterrâneos
const NO_COLLISION_MAPS = new Set<MapId>(['village', 'underground_1', 'underground_2', 'underground_3']);

function isWalkable(x: number, y: number, mapId: MapId): boolean {
  const dims = mapDims(mapId);
  if (x < 0 || y < 0 || x >= dims.w || y >= dims.h) return false;
  if (NO_COLLISION_MAPS.has(mapId)) return true;
  if (hasMask(mapId)) {
    const m = maskWalkable(mapId, x, y);
    if (m !== null) return m;
  }
  return true;
}

function dist(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export interface CollectEffect {
  x: number; y: number; startTime: number; text?: string;
}

function createCoins(mapId: MapId): Coin[] {
  return MAPS[mapId].coins.map((p, i) => ({
    id: i, x: p.x, y: p.y, collected: false, respawnAt: null, sparkle: Math.random(), isRuby: Math.random() < 0.15,
  }));
}

function createWalkingNPCs(_mapId: MapId): WalkingNPC[] {
  // NPCs com quest que andam pelo mapa foram removidos.
  return [];
}

const INITIAL_BAG: InventoryItem[] = [
  { id: 'teleport_scroll', name: 'Scroll de Teleporte', icon: '📜', count: 0 },
  { id: 'black_crystal', name: 'Cristal Negro', icon: '🖤', count: 0 },
  { id: 'chest_key', name: 'Chave de Baú', icon: '🔑', count: 0 },
  { id: 'hp_potion', name: 'Poção de Vida', icon: '❤️', count: 8 },
  { id: 'mp_potion', name: 'Poção de Mana', icon: '💧', count: 5 },
  { id: 'fragments', name: 'Fragmentos de Ovo', icon: '🔮', count: 0 },
  { id: 'bonus_aoe_skill', name: 'Skill: Nova Cristalina', icon: '💠', count: 0 },
  { id: 'egg_common', name: 'Ovo Comum', icon: '🥚', count: 0 },
  { id: 'egg_rare', name: 'Ovo Raro', icon: '🥚', count: 0 },
  { id: 'egg_magic', name: 'Ovo Mágico', icon: '🥚', count: 0 },
  { id: 'egg_epic', name: 'Ovo Épico', icon: '🥚', count: 0 },
  { id: 'egg_legendary', name: 'Ovo Lendário', icon: '🥚', count: 0 },
  { id: 'egg_mythic', name: 'Ovo Mítico', icon: '🥚', count: 0 },
];

function variantFromKind(kind: MobKind): 'normal' | 'elite' | 'corrupted' | 'alpha' | 'dragon_emerald' | 'dragon_crimson' | 'wolf' | 'boar' | 'fairy' | 'char_orange' | 'char_blue' | 'char_obsidian' {
  if (kind === 'dragonling_emerald') return 'dragon_emerald';
  if (kind === 'dragonling_crimson') return 'dragon_crimson';
  if (kind === 'saibaman_alpha') return 'alpha';
  if (kind === 'saibaman_corrupted') return 'corrupted';
  if (kind === 'saibaman_elite') return 'elite';
  if (kind === 'shadow_wolf') return 'wolf';
  if (kind === 'wild_boar') return 'boar';
  if (kind === 'spectral_fairy') return 'fairy';
  if (kind === 'charling_orange') return 'char_orange';
  if (kind === 'charling_blue') return 'char_blue';
  if (kind === 'charling_obsidian') return 'char_obsidian';
  return 'normal';
}

function createMobsForMap(mapId: MapId): Mob[] {
  const map = MAPS[mapId];
  const kinds: MobKind[] = MAP_MOB_KINDS[mapId] ?? ['saibaman'];
  const range = MAP_LEVEL_RANGE[mapId];
  const [lvMin, lvMax] = range ?? [1, 10];
  const mobs: Mob[] = [];
  // densidade reduzida: 1 mob por spawn em vez de 2
  map.demonSpawns.forEach((sp, i) => {
    const kind = kinds[i % kinds.length];
    const cfg = MOB_CONFIGS[kind];
    const lv = Math.max(1, Math.floor(lvMin + Math.random() * (lvMax - lvMin + 1)));
    const lvMul = 1 + (lv - 1) * 0.08;
    const hp = Math.round(cfg.hp * lvMul);
    const x = sp.x + (Math.random() - 0.5) * 80;
    const y = sp.y + (Math.random() - 0.5) * 80;
    mobs.push({
      id: `mob_${mapId}_${i}`, kind, name: cfg.name, level: lv,
      x, y, spawnX: x, spawnY: y, mapId,
      hp, maxHp: hp, damage: Math.round(cfg.damage * lvMul),
      speed: cfg.speed, aggroRange: cfg.aggroRange, attackRange: cfg.attackRange,
      lastAttack: 0, lastSkill: 0, xpReward: Math.round(cfg.xp * lvMul), goldReward: Math.round(cfg.gold * lvMul),
      color: cfg.color, animFrame: 0, direction: 'down',
      respawnAt: null, alive: true,
      variant: variantFromKind(kind),
      state: 'idle', stateUntil: 0, skill: null,
    });
  });
  return mobs;
}

function createInitialState(mapId: MapId, viewW: number, viewH: number): GameState {
  const map = MAPS[mapId];
  const lastOnline = parseInt(localStorage.getItem('idleRpg_lastOnline') || '0');
  const savedState = localStorage.getItem('idleRpg_state');
  let resources = { gold: 0, ruby: 10, crystal: 0 };
  let pets: Pet[] = [];
  let level = 1;
  let xp = 0;
  let quests = [...INITIAL_QUESTS];
  let afkResult = null;

  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      resources = parsed.resources || resources;
      if (!resources.crystal) resources.crystal = 0;
      pets = (parsed.pets || []).map((p: Pet) => ({ ...p, hp: p.hp ?? PET_MAX_HP, maxHp: PET_MAX_HP, isHealer: p.isHealer ?? false, healTarget: null, attackingBoss: false }));
      level = parsed.level || 1;
      xp = parsed.xp || 0;
      quests = parsed.quests || quests;

      if (lastOnline > 0) {
        const offlineMs = Math.min(Date.now() - lastOnline, MAX_AFK_HOURS * 3600000);
        if (offlineMs > 60000) {
          let goldEarned = 0, rubyEarned = 0;
          const activePets = pets.filter(p => p.assignedMap !== null && p.state !== 'dead');
          activePets.forEach(pet => {
            const farmCycles = Math.floor(offlineMs / (PET_FARM_DURATION + pet.sleepTime));
            goldEarned += Math.floor(farmCycles * pet.efficiency * 10);
            rubyEarned += Math.floor(farmCycles * pet.efficiency * 0.5);
          });
          goldEarned = Math.floor(goldEarned * (1 - AFK_DEMON_PENALTY));
          rubyEarned = Math.floor(rubyEarned * (1 - AFK_DEMON_PENALTY));
          if (goldEarned > 0 || rubyEarned > 0) {
            resources.gold += goldEarned;
            resources.ruby += rubyEarned;
            afkResult = { goldEarned, rubyEarned, timeOffline: offlineMs, demonPenalty: Math.round(AFK_DEMON_PENALTY * 100), show: true };
          }
        }
      }
    } catch {}
  }

  const xpPercent = (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  // Aplica stats derivados dos atributos da classe escolhida
  const profile = loadProfile();
  const profileAttrs = getProfileAttrs(profile);
  const derived = profile && profileAttrs ? deriveStats(profile.classId, profileAttrs) : null;
  const baseHp = derived ? Math.round(derived.hp) : PLAYER_MAX_HP;
  const baseMp = derived ? Math.round(derived.mp) : PLAYER_MAX_MP;
  const ownsBonus = (() => { try { return localStorage.getItem('idleRpg_ownsBonusSkill') === '1'; } catch { return false; } })();
  const initialSkills = profile
    ? [
        ...getClassSkills(profile.classId, level).map((s) => ({ id: s.id, cooldownUntil: 0 })),
        ...(ownsBonus ? [{ id: 'bonus_nova', cooldownUntil: 0 }] : []),
      ]
    : [];

  return {
    player: {
      x: map.playerStart.x, y: map.playerStart.y, direction: 'down', moving: false, animFrame: 0,
      hp: baseHp, maxHp: baseHp, mp: baseMp, maxMp: baseMp, lastBasicAttack: 0,
    },
    creature: { x: (map.chests[0]?.x || 500) + 20, y: map.chests[0]?.y || 800, targetCoin: null, state: 'idle', direction: 'down', animFrame: 0, zzzFrame: 0 },
    pets, coins: createCoins(mapId),
    chests: map.chests.map((p, i) => ({ id: i, x: p.x, y: p.y, opened: false, respawnAt: null })),
    resources, totalCoins: 0, chestOpened: false, currentMap: mapId,
    demons: [], bosses: [], quests,
    walkingNPCs: createWalkingNPCs(mapId),
    level, xp, xpPercent, afkResult, lastOnline: Date.now(),
    camera: { x: map.playerStart.x - viewW / 2, y: map.playerStart.y - viewH / 2 },
    showPetMenu: false, showShop: false, showTeleport: false, showQuest: false,
    showBossMenu: false, showBag: false, showDarkMage: false, showMenu: false,
    cycleState: 'collecting', cycleTimer: 60000, cycleStartTime: 0,
    isSnowing: false, snowTimer: Date.now() + SNOW_INTERVAL,
    questResetTimer: Date.now() + QUEST_RESET_TIME,
    bossMapTimer: Date.now() + BOSS_MAP_INTERVAL, bossMapAvailable: false,
    bag: INITIAL_BAG,
    alerts: [],
    petQuestRarityFilter: 'all',
    selectedDarkMagePet: null,
    showReport: false,
    events: [],
    mobs: createMobsForMap(mapId),
    projectiles: [],
    floatingDamages: [],
    skills: initialSkills,
    selectedMobId: null,
    autoMode: false,
    groundItems: [],
    autoHealThreshold: 50,
    autoManaThreshold: 30,
    autoPotionEnabled: true,
  };
}

export function useGameEngine(viewW: number, viewH: number) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState('village', viewW, viewH));
  const stateRef = useRef(gameState);
  const collectEffectsRef = useRef<CollectEffect[]>([]);
  const targetRef = useRef<Position | null>(null);
  const lastDemonSpawn = useRef(Date.now());
  const lastHealTime = useRef(Date.now());
  const lastDarkMageSpawn = useRef(Date.now());
  const pendingEventsRef = useRef<GameEvent[]>([]);
  const joystickRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const pendingHitsRef = useRef<{ mobId: string; dmg: number; skill: SkillId }[]>([]);
  const pendingFxRef = useRef<{ kind: 'aoe'; x: number; y: number; color: string; radius: number; bornAt: number }[]>([]);
  const pendingProjRef = useRef<Projectile[]>([]);
  const pendingDropsRef = useRef<GroundItem[]>([]);

  // Mob killed: gold goes straight to resources/bag; ruby still drops on ground.
  const pendingGoldRef = useRef(0);
  const dropFromMob = (mob: Mob, mapId: MapId) => {
    const now = Date.now();
    // Gold direto para resources (acumulado para aplicar dentro do tick)
    if (mob.goldReward > 0) {
      pendingGoldRef.current += mob.goldReward;
      collectEffectsRef.current.push({ x: mob.x, y: mob.y - 8, startTime: performance.now(), text: `+${mob.goldReward}🪙` });
    }
    // Ruby drop chance (raro) — continua caindo no chão para o pet coletar
    if (Math.random() < 0.05) {
      pendingDropsRef.current.push({
        id: `gi_r_${now}_${Math.random().toString(36).slice(2, 6)}`,
        x: mob.x + (Math.random() - 0.5) * 18,
        y: mob.y + (Math.random() - 0.5) * 18,
        mapId, kind: 'ruby', amount: 1,
        bornAt: now, expiresAt: now + 60000,
      });
    }
    // chance: 18% normal, 30% elite, 45% corrupted, 70% alpha — poção
    const chance = mob.variant === 'alpha' ? 0.7 : mob.variant === 'corrupted' ? 0.45 : mob.variant === 'elite' ? 0.30 : 0.18;
    if (Math.random() < chance) {
      const isHp = Math.random() < 0.6;
      pendingDropsRef.current.push({
        id: `gi_${now}_${Math.random().toString(36).slice(2,6)}`,
        x: mob.x + (Math.random() - 0.5) * 16,
        y: mob.y + (Math.random() - 0.5) * 16,
        mapId, kind: isHp ? 'hp_potion' : 'mp_potion',
        bornAt: now, expiresAt: now + 60000,
      });
    }
    // Chave de baú: 20% drop
    if (Math.random() < 0.20) {
      pendingDropsRef.current.push({
        id: `gi_key_${now}_${Math.random().toString(36).slice(2,6)}`,
        x: mob.x + (Math.random() - 0.5) * 16,
        y: mob.y + (Math.random() - 0.5) * 16,
        mapId, kind: 'chest_key',
        bornAt: now, expiresAt: now + 90000,
      });
    }
    // Egg drop: chance escala com nível do mob
    const baseEgg = mob.variant === 'alpha' ? 0.10 : mob.variant === 'corrupted' ? 0.06 : mob.variant === 'elite' ? 0.04 : 0.015;
    const lvBonus = Math.min(0.20, mob.level * 0.004);
    if (Math.random() < baseEgg + lvBonus) {
      const r = Math.random();
      const tier =
        r < 0.50 ? { id: 'egg_common',    label: 'Comum',     color: '#e5e7eb' } :
        r < 0.78 ? { id: 'egg_rare',      label: 'Raro',      color: '#22c55e' } :
        r < 0.92 ? { id: 'egg_magic',     label: 'Mágico',    color: '#3b82f6' } :
        r < 0.98 ? { id: 'egg_epic',      label: 'Épico',     color: '#a855f7' } :
        r < 0.997 ? { id: 'egg_legendary', label: 'Lendário', color: '#ef4444' } :
                    { id: 'egg_mythic',    label: 'Mítico',    color: '#fbbf24' };
      pendingDropsRef.current.push({
        id: `gi_egg_${now}_${Math.random().toString(36).slice(2,6)}`,
        x: mob.x + (Math.random() - 0.5) * 16,
        y: mob.y + (Math.random() - 0.5) * 16,
        mapId, kind: tier.id as GroundItem['kind'],
        bornAt: now, expiresAt: now + 90000,
      });
      queueEvent('item_drop', `🥚 Você dropou um ovo ${tier.label}!`, '🥚', '#a855f7');
    }
  };

  const queueEvent = (type: GameEventType, message: string, icon: string, color: string) => {
    pendingEventsRef.current.push({
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type, message, icon, color, timestamp: Date.now(),
    });
  };

  stateRef.current = gameState;

  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      localStorage.setItem('idleRpg_lastOnline', Date.now().toString());
      localStorage.setItem('idleRpg_state', JSON.stringify({
        resources: s.resources, pets: s.pets.map(p => ({ ...p, state: p.state === 'trapped' ? 'idle' : p.state })),
        level: s.level, xp: s.xp, quests: s.quests,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const setTarget = useCallback((pos: Position) => { targetRef.current = pos; }, []);

  const teleportToMap = useCallback((mapId: MapId) => {
    setGameState(prev => {
      if (prev.resources.gold < TELEPORT_COST_GOLD || prev.resources.ruby < TELEPORT_COST_RUBY) return prev;
      const map = MAPS[mapId];
      queueEvent('teleport', `Teleporte para ${map.name}`, '🗺️', '#fbbf24');
      return {
        ...prev, currentMap: mapId,
        resources: { ...prev.resources, gold: prev.resources.gold - TELEPORT_COST_GOLD, ruby: prev.resources.ruby - TELEPORT_COST_RUBY },
        player: { ...prev.player, x: map.playerStart.x, y: map.playerStart.y, moving: false },
        coins: createCoins(mapId),
        chests: map.chests.map((p, i) => ({ id: i, x: p.x, y: p.y, opened: false, respawnAt: null })),
        walkingNPCs: createWalkingNPCs(mapId),
        camera: { x: map.playerStart.x - viewW / 2, y: map.playerStart.y - viewH / 2 },
        showTeleport: false,
        mobs: createMobsForMap(mapId),
        projectiles: [], floatingDamages: [], selectedMobId: null,
      };
    });
    targetRef.current = null;
  }, [viewW, viewH]);

  const interactWithChest = useCallback((chestIdx = 0) => {
    const s = stateRef.current;
    const chest = s.chests[chestIdx];
    if (!chest || chest.opened) return;
    if (dist(s.player, chest) > 50) return;

    // Requer chave
    const keySlot = s.bag.find(i => i.id === 'chest_key');
    if (!keySlot || keySlot.count <= 0) {
      queueEvent('item_drop', '🔒 Você precisa de uma chave 🔑 para abrir o baú', '🔒', '#ef4444');
      return;
    }

    const mapCfg = MAPS[s.currentMap];
    const rewards = generateChestRewards(mapCfg.goldBonus, mapCfg.rubyBonus);
    const dropBlackCrystal = Math.random() < BLACK_CRYSTAL_DROP_CHANCE;
    queueEvent('chest_opened', `Baú aberto: +${rewards.gold} ouro, +${rewards.ruby} rubi${dropBlackCrystal ? ', +Cristal Negro 🖤' : ''}`, '🎁', '#fbbf24');
    if (dropBlackCrystal) queueEvent('item_drop', 'Cristal Negro coletado!', '🖤', '#a855f7');
    setGameState(prev => ({
      ...prev,
      chestOpened: true,
      chests: prev.chests.map((c, i) => i === chestIdx ? { ...c, opened: true, respawnAt: Date.now() + MAPS[prev.currentMap].chestRespawnTime } : c),
      cycleStartTime: prev.chestOpened ? prev.cycleStartTime : Date.now(),
      cycleTimer: prev.chestOpened ? prev.cycleTimer : 60000,
      resources: { ...prev.resources, gold: prev.resources.gold + rewards.gold, ruby: prev.resources.ruby + rewards.ruby, crystal: prev.resources.crystal + rewards.crystal },
      bag: prev.bag.map(i => {
        if (i.id === 'chest_key') return { ...i, count: i.count - 1 };
        if (dropBlackCrystal && i.id === 'black_crystal') return { ...i, count: i.count + 1 };
        return i;
      }),
      quests: prev.quests.map(q => q.type === 'open_chest' ? { ...q, progress: q.progress + 1, completed: q.progress + 1 >= q.target } : q),
    }));
    const txt = dropBlackCrystal
      ? `+${rewards.gold}🪙 +${rewards.ruby}💎 +🖤`
      : `+${rewards.gold}🪙 +${rewards.ruby}💎`;
    collectEffectsRef.current.push({ x: chest.x, y: chest.y, startTime: performance.now(), text: txt });
  }, []);

  const logEvent = useCallback((type: GameEventType, message: string, icon: string, color: string) => {
    queueEvent(type, message, icon, color);
  }, []);

  const clearEvents = useCallback(() => {
    pendingEventsRef.current = [];
    setGameState(prev => ({ ...prev, events: [] }));
  }, []);

  // Flush pending events to state every 1s
  useEffect(() => {
    const id = setInterval(() => {
      if (pendingEventsRef.current.length === 0) return;
      const drained = pendingEventsRef.current;
      pendingEventsRef.current = [];
      setGameState(prev => ({ ...prev, events: [...drained.reverse(), ...prev.events].slice(0, 200) }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleUI = useCallback((panel: 'showPetMenu' | 'showShop' | 'showTeleport' | 'showQuest' | 'showBossMenu' | 'showBag' | 'showDarkMage' | 'showReport' | 'showMenu') => {
    setGameState(prev => ({
      ...prev,
      showPetMenu: panel === 'showPetMenu' ? !prev.showPetMenu : false,
      showShop: panel === 'showShop' ? !prev.showShop : false,
      showTeleport: panel === 'showTeleport' ? !prev.showTeleport : false,
      showQuest: panel === 'showQuest' ? !prev.showQuest : false,
      showBossMenu: panel === 'showBossMenu' ? !prev.showBossMenu : false,
      showBag: panel === 'showBag' ? !prev.showBag : false,
      showDarkMage: panel === 'showDarkMage' ? !prev.showDarkMage : false,
      showReport: panel === 'showReport' ? !prev.showReport : false,
      showMenu: panel === 'showMenu' ? !prev.showMenu : prev.showMenu,
    }));
  }, []);

  const usePotion = useCallback((kind: 'hp_potion' | 'mp_potion') => {
    setGameState(prev => {
      const item = prev.bag.find(i => i.id === kind);
      if (!item || item.count <= 0) return prev;
      const player = { ...prev.player };
      if (kind === 'hp_potion') {
        if (player.hp >= player.maxHp) return prev;
        player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.5));
      } else {
        if (player.mp >= player.maxMp) return prev;
        player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * 0.5));
      }
      return {
        ...prev,
        player,
        bag: prev.bag.map(i => i.id === kind ? { ...i, count: i.count - 1 } : i),
      };
    });
  }, []);

  // Abre um ovo: comum SEMPRE falha (recebe fragmentos). Outros: chance crescente.
  const openEgg = useCallback((kind: 'egg_common' | 'egg_rare' | 'egg_magic' | 'egg_epic' | 'egg_legendary' | 'egg_mythic') => {
    setGameState(prev => {
      const slot = prev.bag.find(i => i.id === kind);
      if (!slot || slot.count <= 0) return prev;

      const successChance: Record<string, number> = {
        egg_common: 0, egg_rare: 0.10, egg_magic: 0.18, egg_epic: 0.30, egg_legendary: 0.50, egg_mythic: 0.75,
      };
      const fragmentReward: Record<string, number> = {
        egg_common: 1, egg_rare: 3, egg_magic: 5, egg_epic: 8, egg_legendary: 14, egg_mythic: 25,
      };
      const rarityWeights: Record<string, Partial<Record<PetRarity, number>>> = {
        egg_common:    { common: 100 },
        egg_rare:      { common: 60, rare: 40 },
        egg_magic:     { common: 35, rare: 50, epic: 15 },
        egg_epic:      { rare: 35, epic: 50, legendary: 15 },
        egg_legendary: { epic: 40, legendary: 60 },
        egg_mythic:    { epic: 20, legendary: 80 },
      };

      const success = Math.random() < successChance[kind];
      const newBag = prev.bag.map(i => i.id === kind ? { ...i, count: i.count - 1 } : i);
      if (!success) {
        const frags = fragmentReward[kind];
        const fragSlot = newBag.find(i => i.id === 'fragments');
        if (fragSlot) fragSlot.count += frags;
        queueEvent('item_drop', `Ovo falhou! Recebeu ${frags} fragmentos 🔮`, '🔮', '#a855f7');
        return { ...prev, bag: newBag };
      }
      const newPet = rollGachaPet(prev.player, rarityWeights[kind] as Record<PetRarity, number>);
      queueEvent('pet_acquired', `🥚→🐾 ${newPet.name} (${newPet.rarity})`, '🐾', '#a78bfa');
      return { ...prev, bag: newBag, pets: [...prev.pets, newPet] };
    });
  }, []);

  // Troca fragmentos por poções (10 frags = 1 poção)
  const tradeFragments = useCallback((kind: 'hp_potion' | 'mp_potion') => {
    setGameState(prev => {
      const fragSlot = prev.bag.find(i => i.id === 'fragments');
      if (!fragSlot || fragSlot.count < 10) return prev;
      const newBag = prev.bag.map(i =>
        i.id === 'fragments' ? { ...i, count: i.count - 10 } :
        i.id === kind ? { ...i, count: i.count + 1 } : i
      );
      queueEvent('item_drop', `Trocou 10 fragmentos por ${kind === 'hp_potion' ? 'poção de vida' : 'poção de mana'}`, '🔮', '#22c55e');
      return { ...prev, bag: newBag };
    });
  }, []);

  // Compra a skill bônus (Nova Cristalina) por cristais — fica permanente em qualquer classe
  const buyBonusSkill = useCallback(() => {
    setGameState(prev => {
      if (prev.skills.some(s => s.id === 'bonus_nova')) return prev;
      const cost = 5;
      if (prev.resources.crystal < cost) return prev;
      try { localStorage.setItem('idleRpg_ownsBonusSkill', '1'); } catch {}
      queueEvent('item_drop', '💠 Nova Cristalina adquirida!', '💠', '#22d3ee');
      return {
        ...prev,
        resources: { ...prev.resources, crystal: prev.resources.crystal - cost },
        skills: [...prev.skills, { id: 'bonus_nova', cooldownUntil: 0 }],
      };
    });
  }, []);

  const setPetFilter = useCallback((filter: PetRarity | 'all') => {
    setGameState(prev => ({ ...prev, petQuestRarityFilter: filter }));
  }, []);

  const buyPetChest = useCallback(() => {
    setGameState(prev => {
      if (prev.resources.ruby < PET_CHEST_COST_RUBY || prev.resources.gold < PET_CHEST_COST_GOLD) return prev;
      const newPet = rollGachaPet(prev.player);
      queueEvent('pet_acquired', `Novo pet: ${newPet.name} (${newPet.rarity})`, '🐾', '#a78bfa');
      return {
        ...prev, pets: [...prev.pets, newPet],
        resources: { ...prev.resources, gold: prev.resources.gold - PET_CHEST_COST_GOLD, ruby: prev.resources.ruby - PET_CHEST_COST_RUBY },
      };
    });
  }, []);

  const buyChestType = useCallback((type: 'rare_chest' | 'epic_chest' | 'legendary_chest') => {
    setGameState(prev => {
      const cost = type === 'rare_chest' ? RARE_CHEST_COST : type === 'epic_chest' ? EPIC_CHEST_COST : LEGENDARY_CHEST_COST;
      if (prev.resources.gold < cost) return prev;
      const newPet = rollGachaPet(prev.player, CHEST_RARITY_WEIGHTS[type]);
      queueEvent('pet_acquired', `Baú ${type.replace('_chest','')} → ${newPet.name} (${newPet.rarity})`, '🎁', '#a78bfa');
      return {
        ...prev, pets: [...prev.pets, newPet],
        resources: { ...prev.resources, gold: prev.resources.gold - cost },
      };
    });
  }, []);

  const buyPlanfyEgg = useCallback(() => {
    setGameState(prev => {
      if (prev.resources.ruby < PLANFY_NEW_RUBY_COST || prev.resources.gold < PLANFY_NEW_GOLD_COST) return prev;
      const rarities: PetRarity[] = ['common', 'rare', 'epic', 'legendary'];
      const weights = [40, 35, 20, 5];
      let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
      let rarity: PetRarity = 'common';
      for (let i = 0; i < rarities.length; i++) { roll -= weights[i]; if (roll <= 0) { rarity = rarities[i]; break; } }
      const hpVar = PET_HP_VARIATION_MIN + Math.floor(Math.random() * (PET_HP_VARIATION_MAX - PET_HP_VARIATION_MIN + 1));
      const planfy: Pet = {
        id: `planfy_${Date.now()}`,
        name: `Planfy Healer ${rarity === 'common' ? '' : rarity === 'rare' ? '✦' : rarity === 'epic' ? '✦✦' : '✦✦✦'}`.trim(),
        rarity, variation: 'light_sleeper',
        color: '#f472b6', accentColor: '#a855f7',
        speed: 4 + (rarity === 'legendary' ? 2 : rarity === 'epic' ? 1 : 0),
        energy: 100,
        efficiency: rarity === 'legendary' ? 4 : rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1,
        sleepTime: 30000,
        state: 'idle', assignedMap: null, x: prev.player.x + 20, y: prev.player.y,
        direction: 'down', animFrame: 0, zzzFrame: 0, targetCoin: null,
        farmStartTime: null, cycleStartTime: 0, stateTimer: 0, trappedUntil: null,
        hp: hpVar, maxHp: hpVar, isHealer: true, healTarget: null, attackingBoss: false,
      };
      return {
        ...prev, pets: [...prev.pets, planfy],
        resources: { ...prev.resources, gold: prev.resources.gold - PLANFY_NEW_GOLD_COST, ruby: prev.resources.ruby - PLANFY_NEW_RUBY_COST },
      };
    });
  }, []);

  const useTeleportScroll = useCallback((mapId: MapId) => {
    setGameState(prev => {
      const scroll = prev.bag.find(i => i.id === 'teleport_scroll');
      if (!scroll || scroll.count <= 0) return prev;
      const map = MAPS[mapId];
      return {
        ...prev, currentMap: mapId,
        bag: prev.bag.map(i => i.id === 'teleport_scroll' ? { ...i, count: i.count - 1 } : i),
        player: { ...prev.player, x: map.playerStart.x, y: map.playerStart.y, moving: false },
        coins: createCoins(mapId),
        chests: map.chests.map((p, i) => ({ id: i, x: p.x, y: p.y, opened: false, respawnAt: null })),
        walkingNPCs: createWalkingNPCs(mapId),
        camera: { x: map.playerStart.x - viewW / 2, y: map.playerStart.y - viewH / 2 },
        showBag: false, showTeleport: false,
        mobs: createMobsForMap(mapId), projectiles: [], floatingDamages: [], selectedMobId: null,
      };
    });
    targetRef.current = null;
  }, [viewW, viewH]);

  const darkMageSendPet = useCallback((petId: string, mapId: MapId) => {
    setGameState(prev => {
      if (prev.resources.gold < DARK_MAGE_TELEPORT_COST) return prev;
      const pet = prev.pets.find(p => p.id === petId);
      if (!pet) return prev;
      return {
        ...prev,
        resources: { ...prev.resources, gold: prev.resources.gold - DARK_MAGE_TELEPORT_COST },
        pets: prev.pets.map(p =>
          p.id === petId ? {
            ...p, assignedMap: mapId, state: 'sleeping' as const,
            farmStartTime: Date.now(), cycleStartTime: Date.now(), stateTimer: 0,
            x: MAPS[mapId].playerStart.x + Math.random() * 40 - 20,
            y: MAPS[mapId].playerStart.y + Math.random() * 40 - 20,
          } : p
        ),
        selectedDarkMagePet: null,
        showDarkMage: false,
      };
    });
  }, []);

  const selectDarkMagePet = useCallback((petId: string | null) => {
    setGameState(prev => ({ ...prev, selectedDarkMagePet: petId }));
  }, []);

  const revivePet = useCallback((petId: string) => {
    setGameState(prev => {
      if (prev.resources.crystal < REVIVE_CRYSTAL_COST) return prev;
      const pet = prev.pets.find(p => p.id === petId);
      if (pet) queueEvent('pet_revived', `Pet revivido: ${pet.name}`, '✨', '#22c55e');
      return {
        ...prev,
        resources: { ...prev.resources, crystal: prev.resources.crystal - REVIVE_CRYSTAL_COST },
        pets: prev.pets.map(p => p.id === petId && p.state === 'dead' ? { ...p, state: 'idle' as const, hp: p.maxHp, assignedMap: null } : p),
      };
    });
  }, []);

  const assignPetToMap = useCallback((petId: string, mapId: MapId) => {
    setGameState(prev => ({
      ...prev,
      pets: prev.pets.map(p =>
        p.id === petId ? {
          ...p, assignedMap: mapId, state: 'sleeping' as const,
          farmStartTime: Date.now(), cycleStartTime: Date.now(), stateTimer: 0,
          x: MAPS[mapId].playerStart.x + Math.random() * 40 - 20,
          y: MAPS[mapId].playerStart.y + Math.random() * 40 - 20,
        } : p
      ),
    }));
  }, []);

  const claimQuest = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;
      queueEvent('quest_claimed', `Quest concluída: ${quest.title} (+${quest.rewardGold}🪙 +${quest.rewardRuby}🔴)`, '📜', '#fbbf24');
      return {
        ...prev,
        resources: { gold: prev.resources.gold + quest.rewardGold, ruby: prev.resources.ruby + quest.rewardRuby, crystal: prev.resources.crystal + quest.rewardCrystal },
        quests: prev.quests.map(q => q.id === questId ? { ...q, claimed: true } : q),
      };
    });
  }, []);

  const dismissAFK = useCallback(() => { setGameState(prev => ({ ...prev, afkResult: null })); }, []);

  const selectMob = useCallback((mobId: string | null) => {
    setGameState(prev => ({ ...prev, selectedMobId: mobId }));
  }, []);

  const toggleAutoMode = useCallback(() => {
    setGameState(prev => ({ ...prev, autoMode: !prev.autoMode }));
  }, []);

  const setAutoHealThreshold = useCallback((v: number) => {
    setGameState(prev => ({ ...prev, autoHealThreshold: Math.max(0, Math.min(100, Math.round(v))) }));
  }, []);
  const setAutoManaThreshold = useCallback((v: number) => {
    setGameState(prev => ({ ...prev, autoManaThreshold: Math.max(0, Math.min(100, Math.round(v))) }));
  }, []);
  const toggleAutoPotion = useCallback(() => {
    setGameState(prev => ({ ...prev, autoPotionEnabled: !prev.autoPotionEnabled }));
  }, []);

  const setJoystick = useCallback((dx: number, dy: number) => {
    joystickRef.current = { dx, dy };
  }, []);

  const useSkill = useCallback((skillId: SkillId) => {
    const s = stateRef.current;
    const def = SKILL_DEFS[skillId];
    const skillState = s.skills.find(k => k.id === skillId);
    const now = Date.now();
    if (!skillState || now < skillState.cooldownUntil) return;
    if (s.player.mp < def.manaCost) return;

    if (def.aoeRadius > 0) {
      // AOE around player — hit all mobs in radius
      const hits: { mobId: string; dmg: number }[] = [];
      s.mobs.forEach(m => {
        if (!m.alive || m.mapId !== s.currentMap) return;
        if (dist(s.player, m) <= def.aoeRadius) {
          const dmg = def.damageMin + Math.floor(Math.random() * (def.damageMax - def.damageMin));
          hits.push({ mobId: m.id, dmg });
        }
      });
      pendingHitsRef.current.push(...hits.map(h => ({ ...h, skill: skillId })));
      pendingFxRef.current.push({ kind: 'aoe', x: s.player.x, y: s.player.y, color: def.color, radius: def.aoeRadius, bornAt: performance.now() });
    } else {
      // Projectile to selected mob (or nearest)
      let targetMob = s.mobs.find(m => m.id === s.selectedMobId && m.alive && m.mapId === s.currentMap);
      if (!targetMob) {
        let best: typeof s.mobs[0] | undefined; let bestD = def.range;
        s.mobs.forEach(m => { if (m.alive && m.mapId === s.currentMap) { const d = dist(s.player, m); if (d < bestD) { bestD = d; best = m; } } });
        targetMob = best;
      }
      if (!targetMob) return;
      const dx = targetMob.x - s.player.x; const dy = targetMob.y - s.player.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 7;
      const dmg = def.damageMin + Math.floor(Math.random() * (def.damageMax - def.damageMin));
      pendingProjRef.current.push({
        id: `proj_${now}_${Math.random().toString(36).slice(2,6)}`,
        x: s.player.x, y: s.player.y - 10,
        vx: (dx / len) * speed, vy: (dy / len) * speed,
        targetMobId: targetMob.id, damage: dmg, skill: skillId,
        bornAt: performance.now(), ttl: 1500, fromPlayer: true,
      });
    }

    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, mp: Math.max(0, prev.player.mp - def.manaCost) },
      skills: prev.skills.map(k => k.id === skillId ? { ...k, cooldownUntil: now + def.cooldown } : k),
    }));
  }, []);


  // Main game loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const update = (time: number) => {
      const _dt = Math.min(time - lastTime, 32);
      lastTime = time;
      const now = Date.now();

      setGameState(prev => {
        const player = { ...prev.player };
        const creature = { ...prev.creature };
        const coins = prev.coins.map(c => ({ ...c }));
        const resources = { ...prev.resources };
        let totalCoins = prev.totalCoins;
        let cycleState = prev.cycleState;
        let cycleTimer = prev.cycleTimer;
        let cycleStartTime = prev.cycleStartTime;
        let chestOpened = prev.chestOpened;
        const chests = prev.chests.map(c => ({ ...c }));
        const pets = prev.pets.map(p => ({ ...p }));
        const demons = prev.demons.map(d => ({ ...d }));
        const bosses = prev.bosses.map(b => ({ ...b }));
        const quests = prev.quests.map(q => ({ ...q }));
        const walkingNPCs = prev.walkingNPCs.map(n => ({ ...n }));
        let xp = prev.xp;
        let isSnowing = prev.isSnowing;
        let snowTimer = prev.snowTimer;
        let questResetTimer = prev.questResetTimer;
        let bossMapTimer = prev.bossMapTimer;
        let bossMapAvailable = prev.bossMapAvailable;
        const bag = prev.bag.map(i => ({ ...i }));
        let alerts = prev.alerts.filter(a => now < a.expiresAt);

        // Pré-aviso de Boss
        if (!bossMapAvailable && bossMapTimer - now <= ALERT_PRE_BOSS_MS && bossMapTimer - now > 0) {
          if (!alerts.some(a => a.id === 'pre_boss')) {
            alerts = [...alerts, { id: 'pre_boss', message: '⚠️ Boss aparecerá em breve!', icon: '🏆', expiresAt: bossMapTimer + 3000, color: '#a855f7' }];
          }
        }
        // Pré-aviso de Neve
        if (!isSnowing && snowTimer - now <= ALERT_PRE_SNOW_MS && snowTimer - now > 0) {
          if (!alerts.some(a => a.id === 'pre_snow')) {
            alerts = [...alerts, { id: 'pre_snow', message: '❄️ Nevasca chegando!', icon: '❄️', expiresAt: snowTimer + 3000, color: '#06b6d4' }];
          }
        }

        // Snow timer
        if (!isSnowing && now >= snowTimer) {
          isSnowing = true;
          snowTimer = now + SNOW_DURATION;
        } else if (isSnowing && now >= snowTimer) {
          isSnowing = false;
          snowTimer = now + SNOW_INTERVAL;
        }

        // Quest reset
        if (now >= questResetTimer) {
          questResetTimer = now + QUEST_RESET_TIME;
          quests.forEach(q => { q.progress = 0; q.completed = false; q.claimed = false; });
        }

        // Boss map timer
        if (now >= bossMapTimer) {
          bossMapAvailable = true;
          bossMapTimer = now + BOSS_MAP_INTERVAL;
          // Spawn boss on current map if it has boss spawn
          const mapCfg = MAPS[prev.currentMap];
          if (mapCfg.bossSpawn && !bosses.some(b => b.active && b.mapId === prev.currentMap)) {
            bosses.push({
              id: `boss_${now}`, x: mapCfg.bossSpawn.x, y: mapCfg.bossSpawn.y,
              mapId: prev.currentMap, hp: BOSS_HP, maxHp: BOSS_HP, active: true,
              spawnTime: now, animFrame: 0, direction: 'down',
            });
          }
        }

        // ====== Player movement (joystick > target > auto-move-to-mob) ======
        const mobsLocal = prev.mobs.map(m => ({ ...m }));
        const projectiles = prev.projectiles.map(p => ({ ...p }));
        let floatingDamages = prev.floatingDamages.filter(f => now - f.bornAt < 900);
        let selectedMobId = prev.selectedMobId;

        // Auto: pick nearest live mob if needed
        if (prev.autoMode) {
          const sel = mobsLocal.find(m => m.id === selectedMobId && m.alive);
          if (!sel) {
            let best: typeof mobsLocal[0] | undefined; let bd = Infinity;
            mobsLocal.forEach(m => { if (m.alive && m.mapId === prev.currentMap) { const d = dist(player, m); if (d < bd) { bd = d; best = m; } } });
            selectedMobId = best?.id ?? null;
          }
        }

        const js = joystickRef.current;
        const jsActive = Math.abs(js.dx) > 0.1 || Math.abs(js.dy) > 0.1;
        let moveDX = 0, moveDY = 0; let useMove = false;

        if (jsActive) {
          targetRef.current = null;
          moveDX = js.dx; moveDY = js.dy; useMove = true;
        } else if (targetRef.current) {
          const t = targetRef.current;
          const dx = t.x - player.x, dy = t.y - player.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 4) { targetRef.current = null; }
          else { moveDX = dx / d; moveDY = dy / d; useMove = true; player.targetX = t.x; player.targetY = t.y; }
        } else if (prev.autoMode && selectedMobId) {
          const m = mobsLocal.find(x => x.id === selectedMobId);
          if (m && m.alive) {
            // Determina alcance preferido: classes ranged param antes para castar.
            const profileMv = loadProfile();
            const clsKind = profileMv ? getClass(profileMv.classId).combatKind : 'melee';
            // maior alcance disponível entre skills + ataque básico (com fallback)
            const skillRanges = prev.skills
              .map(sk => SKILL_DEFS[sk.id])
              .filter(Boolean)
              .map(def => def.range > 0 ? def.range : def.aoeRadius);
            const maxSkillRange = skillRanges.length ? Math.max(...skillRanges) : 0;
            const desiredRange =
              clsKind === 'ranged'
                ? Math.min(Math.max(220, maxSkillRange * 0.85), 320)
                : clsKind === 'hybrid'
                  ? Math.max(PLAYER_ATTACK_RANGE, maxSkillRange * 0.7)
                  : PLAYER_ATTACK_RANGE * 0.7;

            const dx = m.x - player.x, dy = m.y - player.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > desiredRange) {
              moveDX = dx / d; moveDY = dy / d; useMove = true;
            } else {
              // já está em alcance: para de andar e olha para o alvo (mago não fica fugindo)
              if (Math.abs(dx) > Math.abs(dy)) player.direction = dx > 0 ? 'right' : 'left';
              else player.direction = dy > 0 ? 'down' : 'up';
            }
          }
        }

        if (useMove) {
          player.moving = true; player.animFrame += 1;
          const nx = player.x + moveDX * PLAYER_SPEED;
          const ny = player.y + moveDY * PLAYER_SPEED;
          if (Math.abs(moveDX) > Math.abs(moveDY)) player.direction = moveDX > 0 ? 'right' : 'left';
          else player.direction = moveDY > 0 ? 'down' : 'up';
          const dimsM = mapDims(prev.currentMap);
          const bx = Math.max(20, Math.min(dimsM.w - 20, nx));
          const by = Math.max(20, Math.min(dimsM.h - 20, ny));
          if (isWalkable(bx, by, prev.currentMap)) { player.x = bx; player.y = by; }
          else if (isWalkable(bx, player.y, prev.currentMap)) { player.x = bx; }
          else if (isWalkable(player.x, by, prev.currentMap)) { player.y = by; }
          else { player.moving = false; targetRef.current = null; }
        } else { player.moving = false; }


        const dimsCam = mapDims(prev.currentMap);
        const cam = {
          x: Math.max(0, Math.min(dimsCam.w - viewW, player.x - viewW / 2)),
          y: Math.max(0, Math.min(dimsCam.h - viewH, player.y - viewH / 2)),
        };

        // Coin/chest respawn
        coins.forEach(coin => { if (coin.collected && coin.respawnAt && now >= coin.respawnAt) { coin.collected = false; coin.respawnAt = null; coin.isRuby = Math.random() < 0.15; } });
        chests.forEach(chest => { if (chest.opened && chest.respawnAt && now >= chest.respawnAt) { chest.opened = false; chest.respawnAt = null; } });

        // Walking NPC logic + NPCs hostis (bruxos)
        walkingNPCs.forEach(npc => {
          if (npc.despawnAt && now >= npc.despawnAt) {
            // marcado para sumir – removemos abaixo
            return;
          }
          if (now >= npc.moveTimer) {
            const map = MAPS[prev.currentMap];
            const wz = map.walkableZones[0];
            if (wz) {
              npc.targetX = wz.x + Math.random() * wz.w;
              npc.targetY = wz.y + Math.random() * wz.h;
            }
            npc.moveTimer = now + 3000 + Math.random() * 5000;
          }
          const dx = npc.targetX - npc.x;
          const dy = npc.targetY - npc.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > 3) {
            const spd = npc.isDarkMage ? 1.6 : 1.2;
            npc.x += (dx / d) * spd;
            npc.y += (dy / d) * spd;
            if (Math.abs(dx) > Math.abs(dy)) npc.direction = dx > 0 ? 'right' : 'left';
            else npc.direction = dy > 0 ? 'down' : 'up';
          }
          npc.animFrame += 1;

          // Bruxo hostil pune se nenhuma quest foi reivindicada recentemente
          if (npc.isHostile && npc.hostilityTimer && now >= npc.hostilityTimer) {
            const anyClaimed = quests.some(q => q.claimed);
            if (!anyClaimed) {
              // Spawn de demônios mais fortes próximos do NPC
              for (let i = 0; i < HOSTILE_NPC_DEMONS_PER_PUNISH; i++) {
                demons.push({
                  id: `demon_hostile_${now}_${i}`,
                  x: npc.x + (Math.random() - 0.5) * 80,
                  y: npc.y + (Math.random() - 0.5) * 80,
                  mapId: prev.currentMap, direction: 'down', animFrame: 0,
                  targetPet: null, spawnTime: now, active: true,
                  hp: DEMON_HP_FIXED, maxHp: DEMON_HP_FIXED, isElite: false,
                });
              }
              alerts = [...alerts.filter(a => a.id !== 'hostile_punish'), {
                id: 'hostile_punish', message: `🧙 ${npc.name} invocou demônios! Faça as quests!`, icon: '⚠️',
                expiresAt: now + 5000, color: '#dc2626',
              }];
            }
            npc.hostilityTimer = now + HOSTILE_NPC_PUNISH_INTERVAL;
          }
        });
        // Remove dark mages expirados
        const filteredNPCs = walkingNPCs.filter(n => !n.despawnAt || now < n.despawnAt);
        walkingNPCs.length = 0;
        walkingNPCs.push(...filteredNPCs);

        // Creature logic
        if (chestOpened) {
          if (cycleStartTime > 0) {
            const elapsed = now - cycleStartTime;
            cycleTimer = Math.max(0, 60000 - elapsed);
            if (cycleTimer <= 0) {
              cycleState = cycleState === 'collecting' ? 'resting' : 'collecting';
              cycleStartTime = now; cycleTimer = 60000;
              creature.state = cycleState; creature.targetCoin = null;
            }
          }
          if (creature.state === 'collecting') {
            if (creature.targetCoin === null || coins[creature.targetCoin]?.collected) {
              let nearest = -1, nearestDist = Infinity;
              coins.forEach((coin, i) => { if (!coin.collected) { const d = dist(creature, coin); if (d < nearestDist) { nearestDist = d; nearest = i; } } });
              creature.targetCoin = nearest >= 0 ? nearest : null;
            }
            if (creature.targetCoin !== null) {
              const ct = coins[creature.targetCoin];
              const d = dist(creature, ct);
              if (d < 8) {
                ct.collected = true; ct.respawnAt = now + COIN_RESPAWN_TIME; totalCoins += 1;
                const mapBonus = MAPS[prev.currentMap];
                if (ct.isRuby) {
                  const amt = Math.ceil(mapBonus.rubyBonus);
                  resources.ruby += amt;
                  collectEffectsRef.current.push({ x: ct.x, y: ct.y, startTime: time, text: `+${amt}💎` });
                  quests.forEach(q => { if (q.type === 'collect_ruby' && !q.completed) { q.progress += amt; if (q.progress >= q.target) q.completed = true; } });
                } else {
                  const amt = Math.ceil(mapBonus.goldBonus);
                  resources.gold += amt;
                  collectEffectsRef.current.push({ x: ct.x, y: ct.y, startTime: time, text: `+${amt}🪙` });
                  quests.forEach(q => { if (q.type === 'collect_gold' && !q.completed) { q.progress += amt; if (q.progress >= q.target) q.completed = true; } });
                }
                creature.targetCoin = null;
              } else {
                const ddx = ct.x - creature.x; const ddy = ct.y - creature.y;
                const len = Math.sqrt(ddx * ddx + ddy * ddy);
                creature.x += (ddx / len) * CREATURE_SPEED; creature.y += (ddy / len) * CREATURE_SPEED;
                creature.direction = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
              }
              creature.animFrame += 1;
            }
          } else if (creature.state === 'resting') {
            const restPos = { x: (MAPS[prev.currentMap].chests[0]?.x || 500) + 20, y: MAPS[prev.currentMap].chests[0]?.y || 800 };
            const d = dist(creature, restPos);
            if (d > 5) {
              const ddx = restPos.x - creature.x; const ddy = restPos.y - creature.y;
              const len = Math.sqrt(ddx * ddx + ddy * ddy);
              creature.x += (ddx / len) * CREATURE_SPEED * 0.5; creature.y += (ddy / len) * CREATURE_SPEED * 0.5;
            }
            creature.zzzFrame += 1;
          }
        }

        // Pet logic
        const snowSpeedMod = isSnowing ? 0.6 : 1.0;

        pets.forEach(pet => {
          if (!pet.assignedMap || pet.state === 'dead') return;

          // Trapped check
          if (pet.state === 'trapped') {
            if (pet.trappedUntil && now >= pet.trappedUntil) {
              pet.state = 'farming'; pet.trappedUntil = null; pet.cycleStartTime = now;
            }
            return;
          }

          // Pets curam o jogador (todos, não só healers) — pulso lento
          if (pet.assignedMap === prev.currentMap) {
            if (player.hp < player.maxHp && now - lastHealTime.current >= HEAL_INTERVAL) {
              const dPl = dist(pet, player);
              if (dPl < 80) {
                const heal = pet.isHealer ? 6 : pet.rarity === 'legendary' ? 4 : pet.rarity === 'epic' ? 3 : 2;
                player.hp = Math.min(player.maxHp, player.hp + heal);
                lastHealTime.current = now;
                collectEffectsRef.current.push({ x: player.x, y: player.y - 18, startTime: time, text: `+${heal} ❤️` });
              }
            }
          }


          if (pet.isHealer && pet.state === 'farming') {
            const hurtPets = pets.filter(p => p.assignedMap === pet.assignedMap && p.hp < p.maxHp && p.state !== 'dead' && p.id !== pet.id);
            if (hurtPets.length > 0 && now - lastHealTime.current >= HEAL_INTERVAL) {
              const target = hurtPets[0];
              const d = dist(pet, target);
              if (d < 20) {
                target.hp = Math.min(target.maxHp, target.hp + 3);
                lastHealTime.current = now;
                collectEffectsRef.current.push({ x: target.x, y: target.y, startTime: time, text: '+3 ❤️' });
                pet.healTarget = null;
              } else {
                pet.healTarget = target.id;
                const ddx = target.x - pet.x; const ddy = target.y - pet.y;
                const len = Math.sqrt(ddx * ddx + ddy * ddy);
                pet.x += (ddx / len) * pet.speed * snowSpeedMod;
                pet.y += (ddy / len) * pet.speed * snowSpeedMod;
              }
              pet.animFrame += 1;
              return;
            }
          }

          // Background farming
          if (pet.assignedMap !== prev.currentMap) {
            if (pet.state === 'farming') {
              if (now - pet.cycleStartTime >= PET_FARM_DURATION) {
                pet.state = 'sleeping'; pet.cycleStartTime = now;
                const amt = Math.ceil(pet.efficiency * 5 * MAPS[pet.assignedMap].goldBonus);
                resources.gold += amt;
                if (Math.random() < 0.15) resources.ruby += Math.ceil(pet.efficiency * MAPS[pet.assignedMap].rubyBonus);
              }
            } else if (pet.state === 'sleeping') {
              if (now - pet.cycleStartTime >= pet.sleepTime) { pet.state = 'farming'; pet.cycleStartTime = now; }
            }
            return;
          }

          if (pet.state === 'sleeping') {
            if (now - pet.cycleStartTime >= pet.sleepTime) { pet.state = 'farming'; pet.cycleStartTime = now; }
            pet.zzzFrame += 1; return;
          }

          if (pet.state === 'farming') {
            if (now - pet.cycleStartTime >= PET_FARM_DURATION) { pet.state = 'sleeping'; pet.cycleStartTime = now; pet.targetCoin = null; return; }

            // Boss attacking for rare+ pets
            const activeBoss = bosses.find(b => b.active && b.mapId === pet.assignedMap);
            if (activeBoss && (pet.rarity === 'rare' || pet.rarity === 'epic' || pet.rarity === 'legendary')) {
              const d = dist(pet, activeBoss);
              if (d < 25) {
                activeBoss.hp -= pet.efficiency * 0.1;
                pet.attackingBoss = true;
                if (activeBoss.hp <= 0) {
                  activeBoss.active = false;
                  resources.gold += 500; resources.ruby += 50; resources.crystal += 25;
                  xp += 10;
                  collectEffectsRef.current.push({ x: activeBoss.x, y: activeBoss.y, startTime: time, text: 'BOSS MORTO! 🏆' });
                  quests.forEach(q => { if (q.type === 'kill_boss' && !q.completed) { q.progress += 1; if (q.progress >= q.target) q.completed = true; } });
                }
              } else {
                const ddx = activeBoss.x - pet.x; const ddy = activeBoss.y - pet.y;
                const len = Math.sqrt(ddx * ddx + ddy * ddy);
                pet.x += (ddx / len) * pet.speed * snowSpeedMod;
                pet.y += (ddy / len) * pet.speed * snowSpeedMod;
              }
              pet.animFrame += 1;
              return;
            }
            pet.attackingBoss = false;

            // Coin farming
            if (pet.targetCoin === null || coins[pet.targetCoin]?.collected) {
              let nearest = -1, nearestDist = Infinity;
              coins.forEach((coin, i) => { if (!coin.collected) { const d = dist(pet, coin); if (d < nearestDist) { nearestDist = d; nearest = i; } } });
              pet.targetCoin = nearest >= 0 ? nearest : null;
            }
            if (pet.targetCoin !== null) {
              const ct = coins[pet.targetCoin]; const d = dist(pet, ct);
              if (d < 8) {
                ct.collected = true; ct.respawnAt = now + COIN_RESPAWN_TIME;
                const mapCfg = MAPS[prev.currentMap];
                const amount = Math.ceil(pet.efficiency * mapCfg.goldBonus);
                if (ct.isRuby) {
                  const rubyAmt = Math.ceil(pet.efficiency * mapCfg.rubyBonus);
                  resources.ruby += rubyAmt;
                  collectEffectsRef.current.push({ x: ct.x, y: ct.y, startTime: time, text: `+${rubyAmt}💎` });
                  quests.forEach(q => { if (q.type === 'collect_ruby' && !q.completed) { q.progress += rubyAmt; if (q.progress >= q.target) q.completed = true; } });
                } else {
                  resources.gold += amount;
                  collectEffectsRef.current.push({ x: ct.x, y: ct.y, startTime: time, text: `+${amount}🪙` });
                  quests.forEach(q => { if (q.type === 'collect_gold' && !q.completed) { q.progress += amount; if (q.progress >= q.target) q.completed = true; } });
                }
                totalCoins += amount; pet.targetCoin = null;
              } else {
                const ddx = ct.x - pet.x; const ddy = ct.y - pet.y; const len = Math.sqrt(ddx * ddx + ddy * ddy);
                pet.x += (ddx / len) * pet.speed * snowSpeedMod;
                pet.y += (ddy / len) * pet.speed * snowSpeedMod;
                pet.direction = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
              }
              pet.animFrame += 1;
            }
          }
        });

        // Auto-return pets after 1 hour
        pets.forEach(pet => { if (pet.farmStartTime && now - pet.farmStartTime >= 3600000) { pet.state = 'idle'; pet.assignedMap = null; pet.farmStartTime = null; } });

        // Demon spawning — escala APENAS quantidade (HP fixo)
        const mapCfg = MAPS[prev.currentMap];
        const petsInMap = pets.filter(p => p.assignedMap === prev.currentMap && p.state !== 'dead').length;
        const difficultyTier = Math.floor(petsInMap / DIFFICULTY_PETS_PER_TIER);
        const dynamicDemonCount = mapCfg.demonCount + difficultyTier * DIFFICULTY_SPAWN_BONUS_PER_TIER;

        if (now - lastDemonSpawn.current >= DEMON_SPAWN_INTERVAL) {
          lastDemonSpawn.current = now;
          for (let i = 0; i < dynamicDemonCount; i++) {
            if (mapCfg.demonSpawns.length > 0) {
              const spawn = mapCfg.demonSpawns[Math.floor(Math.random() * mapCfg.demonSpawns.length)];
              demons.push({
                id: `demon_${now}_${i}`, x: spawn.x + (Math.random() - 0.5) * 60, y: spawn.y + (Math.random() - 0.5) * 60,
                mapId: prev.currentMap, direction: 'down', animFrame: 0, targetPet: null, spawnTime: now, active: true,
                hp: DEMON_HP_FIXED, maxHp: DEMON_HP_FIXED, isElite: false,
              });
            }
          }
          // Demon Elite (raro): spawn 1 se houver pet épico/lendário no mapa
          const hasStrongPet = pets.some(p => p.assignedMap === prev.currentMap && p.state !== 'dead' && DEMON_ELITE_REQUIRES_RARITY.includes(p.rarity));
          const eliteAlive = demons.some(d => d.isElite && d.mapId === prev.currentMap && d.active);
          if (hasStrongPet && !eliteAlive && mapCfg.demonSpawns.length > 0) {
            const spawn = mapCfg.demonSpawns[Math.floor(Math.random() * mapCfg.demonSpawns.length)];
            demons.push({
              id: `demon_elite_${now}`, x: spawn.x, y: spawn.y,
              mapId: prev.currentMap, direction: 'down', animFrame: 0, targetPet: null, spawnTime: now, active: true,
              hp: DEMON_ELITE_HP_FIXED, maxHp: DEMON_ELITE_HP_FIXED, isElite: true,
            });
            alerts = [...alerts, { id: `elite_${now}`, message: '👹 Demônio Elite apareceu!', icon: '👹', expiresAt: now + 5000, color: '#dc2626' }];
          }
        }

        // Spawn do Mago Negro a cada 10 min
        if (now - lastDarkMageSpawn.current >= DARK_MAGE_SPAWN_INTERVAL) {
          lastDarkMageSpawn.current = now;
          const wz = mapCfg.walkableZones[0];
          if (wz && !walkingNPCs.some(n => n.isDarkMage)) {
            walkingNPCs.push({
              id: `dark_mage_${now}`,
              x: wz.x + wz.w / 2, y: wz.y + wz.h / 2,
              mapId: prev.currentMap,
              name: 'Mago Negro',
              direction: 'down', animFrame: 0,
              targetX: wz.x + Math.random() * wz.w,
              targetY: wz.y + Math.random() * wz.h,
              moveTimer: now + 2000,
              hasQuest: false,
              color: '#1e1b4b',
              isDarkMage: true,
              despawnAt: now + DARK_MAGE_DESPAWN,
            });
            alerts = [...alerts, { id: `dark_mage_${now}`, message: '🧙‍♂️ Mago Negro apareceu!', icon: '🧙‍♂️', expiresAt: now + 5000, color: '#1e1b4b' }];
          }
        }

        // Demon logic
        demons.forEach(demon => {
          if (!demon.active) return;
          if (now - demon.spawnTime > 60000) { demon.active = false; return; }
          // Demons no mapa atual também atacam o jogador
          if (demon.mapId === prev.currentMap) {
            const dPl = dist(demon, player);
            if (dPl < 22) {
              const last = (demon as { _lastPlAtk?: number })._lastPlAtk ?? 0;
              if (now - last > 1100) {
                (demon as { _lastPlAtk?: number })._lastPlAtk = now;
                const dmgMin = demon.isElite ? DEMON_ELITE_DMG_MIN : DEMON_DMG_MIN;
                const dmgMax = demon.isElite ? DEMON_ELITE_DMG_MAX : DEMON_DMG_MAX;
                const dmg = (dmgMin + Math.floor(Math.random() * (dmgMax - dmgMin + 1))) * 4;
                player.hp = Math.max(0, player.hp - dmg);
                floatingDamages.push({ id: `fd_dpl_${now}_${demon.id}`, x: player.x, y: player.y - 24, text: `-${dmg}`, color: '#dc2626', bornAt: now });
              }
            } else if (dPl < 220 && !demon.targetPet) {
              const ddx = player.x - demon.x; const ddy = player.y - demon.y;
              const len = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
              const demonSpeed = 2.5 + difficultyTier * DIFFICULTY_SPEED_BONUS_PER_TIER;
              demon.x += (ddx / len) * demonSpeed; demon.y += (ddy / len) * demonSpeed;
              demon.direction = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
              demon.animFrame += 1;
              return;
            }
          }
          if (!demon.targetPet) {
            const farmingPets = pets.filter(p => p.assignedMap === demon.mapId && (p.state === 'farming' || p.state === 'sleeping') && (p.state as string) !== 'dead');
            if (farmingPets.length > 0) {
              demon.targetPet = farmingPets.reduce((a, b) => dist(demon, a) < dist(demon, b) ? a : b).id;
            }
          }
          if (demon.targetPet) {
            const targetPet = pets.find(p => p.id === demon.targetPet);
            if (targetPet && targetPet.state !== 'dead') {
              const d = dist(demon, targetPet);
              if (d < 20) {
                // Dano variável (3-7 normal, 9-15 elite)
                const dmgMin = demon.isElite ? DEMON_ELITE_DMG_MIN : DEMON_DMG_MIN;
                const dmgMax = demon.isElite ? DEMON_ELITE_DMG_MAX : DEMON_DMG_MAX;
                let dmg = dmgMin + Math.floor(Math.random() * (dmgMax - dmgMin + 1));
                // Pets com energia alta sofrem menos dano
                if (targetPet.energy >= PET_HIGH_ENERGY_THRESHOLD) {
                  dmg = Math.max(1, Math.round(dmg * (1 - PET_HIGH_ENERGY_DMG_REDUCTION)));
                }
                targetPet.hp -= dmg;
                collectEffectsRef.current.push({ x: targetPet.x, y: targetPet.y - 10, startTime: time, text: `-${dmg}❤️` });
                if (targetPet.hp <= 0) {
                  targetPet.hp = 0; targetPet.state = 'dead'; targetPet.targetCoin = null;
                  queueEvent('pet_died', `Pet morto: ${targetPet.name} 💀`, '💀', '#ef4444');
                } else {
                  const chance = DEMON_TRAP_CHANCE[targetPet.rarity];
                  const trapDuration = Math.max(10000, DEMON_TRAP_DURATION * (1 - targetPet.efficiency * 0.05));
                  if (Math.random() < chance) {
                    targetPet.state = 'trapped'; targetPet.trappedUntil = now + trapDuration; targetPet.targetCoin = null;
                  }
                }
                // Rare+ pets podem matar demons
                if ((targetPet.rarity === 'rare' || targetPet.rarity === 'epic' || targetPet.rarity === 'legendary') && targetPet.state !== 'dead') {
                  demon.hp -= 1;
                  if (demon.hp <= 0) {
                    demon.active = false;
                    xp += demon.isElite ? 5 : 1;
                    collectEffectsRef.current.push({ x: demon.x, y: demon.y, startTime: time, text: demon.isElite ? '+5 XP 👹' : '+1 XP 💀' });
                    queueEvent('demon_killed', demon.isElite ? `Demon Elite morto (+5 XP)` : `Demon morto (+1 XP)`, demon.isElite ? '👹' : '💀', '#dc2626');
                    quests.forEach(q => { if (q.type === 'kill_demon' && !q.completed) { q.progress += 1; if (q.progress >= q.target) q.completed = true; } });
                    // Drop scroll de teleporte (elite ou demônios fortes)
                    if ((demon.isElite || demon.maxHp >= 5) && Math.random() < TELEPORT_SCROLL_DROP_CHANCE) {
                      const scroll = bag.find(i => i.id === 'teleport_scroll');
                      if (scroll) scroll.count += 1;
                      collectEffectsRef.current.push({ x: demon.x, y: demon.y, startTime: time, text: '📜 Scroll!' });
                      queueEvent('item_drop', 'Scroll de Teleporte coletado!', '📜', '#6366f1');
                    }
                  }
                }
                demon.targetPet = null;
              } else {
                const ddx = targetPet.x - demon.x; const ddy = targetPet.y - demon.y;
                const len = Math.sqrt(ddx * ddx + ddy * ddy);
                const demonSpeed = 2.5 + difficultyTier * DIFFICULTY_SPEED_BONUS_PER_TIER;
                demon.x += (ddx / len) * demonSpeed; demon.y += (ddy / len) * demonSpeed;
                demon.direction = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
              }
            } else { demon.targetPet = null; }
          }
          demon.animFrame += 1;
        });

        // ====== COMBAT (player vs mobs) ======
        // Regen
        const dtSec = 1 / 60;
        player.hp = Math.min(player.maxHp, player.hp + PLAYER_HP_REGEN * dtSec);
        player.mp = Math.min(player.maxMp, player.mp + PLAYER_MP_REGEN * dtSec);

        // Drain pending projectiles + fx + hits queued by skills
        if (pendingProjRef.current.length) { projectiles.push(...pendingProjRef.current); pendingProjRef.current = []; }
        if (pendingHitsRef.current.length) {
          pendingHitsRef.current.forEach(h => {
            const m = mobsLocal.find(mm => mm.id === h.mobId);
            if (m && m.alive) {
              m.hp -= h.dmg;
              floatingDamages.push({ id: `fd_${now}_${Math.random().toString(36).slice(2,5)}`, x: m.x, y: m.y - 16, text: `-${h.dmg}`, color: SKILL_DEFS[h.skill].color, bornAt: now });
              if (m.hp <= 0) {
                m.alive = false; m.hp = 0; m.respawnAt = now + MOB_RESPAWN_MS;
                const xpMult = xpDiffMultiplier(prev.level, m.level);
                xp += Math.max(1, Math.round(m.xpReward * xpMult));
                dropFromMob(m, prev.currentMap);
                quests.forEach(q => { if (q.type === 'kill_demon' && !q.completed) { q.progress += 1; if (q.progress >= q.target) q.completed = true; } });
              }
            }
          });
          pendingHitsRef.current = [];
        }

        // Mob respawn
        mobsLocal.forEach(m => {
          if (!m.alive && m.respawnAt && now >= m.respawnAt) {
            m.alive = true; m.hp = m.maxHp; m.x = m.spawnX; m.y = m.spawnY; m.respawnAt = null; m.lastAttack = 0;
          }
        });

        // Mob AI: aggro + chase + attack player + skills (ki_blast)
        mobsLocal.forEach(m => {
          if (!m.alive || m.mapId !== prev.currentMap) return;
          const d = dist(m, player);
          if (d <= m.aggroRange) {
            // Skill: ki_blast (ranged) — corrupted/alpha sometimes
            const canSkill = (m.variant === 'corrupted' || m.variant === 'alpha') && d > m.attackRange && d < 280;
            if (canSkill && now - m.lastSkill >= 4500) {
              m.lastSkill = now;
              const dx = player.x - m.x, dy = player.y - m.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const dmg = Math.round(m.damage * 0.85);
              pendingProjRef.current.push({
                id: `mp_${now}_${m.id}`, x: m.x, y: m.y - 8,
                vx: (dx / len) * 4.2, vy: (dy / len) * 4.2,
                targetMobId: null, damage: dmg, skill: 'dm_orb',
                bornAt: performance.now(), ttl: 1800, fromPlayer: false,
              });
              floatingDamages.push({ id: `fd_skill_${now}`, x: m.x, y: m.y - 22, text: 'KI!', color: '#a855f7', bornAt: now });
            } else if (d > m.attackRange) {
              const dx = player.x - m.x, dy = player.y - m.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              m.x += (dx / len) * m.speed; m.y += (dy / len) * m.speed;
              m.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            } else {
              if (now - m.lastAttack >= MOB_CONFIGS[m.kind].attackCooldown) {
                m.lastAttack = now;
                const dmg = m.damage + Math.floor(Math.random() * 20 - 10);
                player.hp = Math.max(0, player.hp - dmg);
                floatingDamages.push({ id: `fd_p_${now}`, x: player.x + (Math.random() - 0.5) * 10, y: player.y - 24, text: `-${dmg}`, color: '#ef4444', bornAt: now });
              }
            }
          }
          m.animFrame += 1;
        });

        // Player respawn on death — sempre volta para o primeiro mapa (vila)
        if (player.hp <= 0) {
          const ms = MAPS['village'];
          player.x = ms.playerStart.x; player.y = ms.playerStart.y;
          player.hp = player.maxHp; player.mp = player.maxMp;
          if (prev.currentMap !== 'village') {
            queueEvent('teleport', 'Você morreu! Voltando para a vila…', '💀', '#ef4444');
            return {
              ...prev, player, currentMap: 'village',
              coins: createCoins('village'),
              chests: MAPS['village'].chests.map((p, i) => ({ id: i, x: p.x, y: p.y, opened: false, respawnAt: null })),
              walkingNPCs: createWalkingNPCs('village'),
              camera: { x: ms.playerStart.x - viewW / 2, y: ms.playerStart.y - viewH / 2 },
              mobs: createMobsForMap('village'),
              projectiles: [], floatingDamages: [], selectedMobId: null,
              demons: [], bosses: [],
            };
          }
        }

        // Basic auto-attack on selected mob (or nearest in range) — usa atributos da classe
        const profileNow = loadProfile();
        const attrsNow = getProfileAttrs(profileNow);
        const derivedNow = profileNow && attrsNow ? deriveStats(profileNow.classId, attrsNow) : null;
        const clsKindNow = profileNow ? getClass(profileNow.classId).combatKind : 'melee';
        const atkBonus = derivedNow ? derivedNow.atk / 18 : 1;
        const baseMin = Math.round(PLAYER_BASIC_DMG_MIN * atkBonus);
        const baseMax = Math.round(PLAYER_BASIC_DMG_MAX * atkBonus);
        const critChance = derivedNow ? derivedNow.crit / 100 : 0.04;
        // Classes à distância usam o alcance da skill básica (1ª skill desbloqueada) como ataque básico ranged
        const firstSkillDef = prev.skills.length ? SKILL_DEFS[prev.skills[0].id] : null;
        const basicRange = clsKindNow === 'ranged' && firstSkillDef && firstSkillDef.range > 0
          ? firstSkillDef.range
          : PLAYER_ATTACK_RANGE;
        const aggroMob = mobsLocal.find(m => m.id === selectedMobId && m.alive) ||
          (prev.autoMode ? mobsLocal.find(m => m.alive && m.mapId === prev.currentMap && dist(m, player) <= basicRange) : undefined);
        if (aggroMob && dist(aggroMob, player) <= basicRange) {
          if (now - player.lastBasicAttack >= PLAYER_ATTACK_COOLDOWN) {
            player.lastBasicAttack = now;
            let dmg = baseMin + Math.floor(Math.random() * (baseMax - baseMin));
            const crit = Math.random() < critChance;
            if (crit) dmg = Math.round(dmg * 1.8);
            aggroMob.hp -= dmg;
            floatingDamages.push({ id: `fd_b_${now}`, x: aggroMob.x, y: aggroMob.y - 16, text: crit ? `${dmg}!` : `${dmg}`, color: crit ? '#fbbf24' : '#fde68a', bornAt: now });
            if (aggroMob.hp <= 0) {
              aggroMob.alive = false; aggroMob.hp = 0; aggroMob.respawnAt = now + MOB_RESPAWN_MS;
              const xpMult = xpDiffMultiplier(prev.level, aggroMob.level);
              xp += Math.max(1, Math.round(aggroMob.xpReward * xpMult));
              dropFromMob(aggroMob, prev.currentMap);
              quests.forEach(q => { if (q.type === 'kill_demon' && !q.completed) { q.progress += 1; if (q.progress >= q.target) q.completed = true; } });
              if (selectedMobId === aggroMob.id) selectedMobId = null;
            }
          }
        }

        // Auto-cast: tenta usar QUALQUER skill desbloqueada da classe
        if (prev.autoMode && aggroMob) {
          prev.skills.forEach(sk => {
            const def = SKILL_DEFS[sk.id];
            if (!def) return;
            if (now < sk.cooldownUntil || player.mp < def.manaCost) return;
            if (def.aoeRadius > 0) {
              if (def.range === 0 && dist(aggroMob, player) > def.aoeRadius) return;
              pendingHitsRef.current.push(...mobsLocal.filter(mm => mm.alive && mm.mapId === prev.currentMap && dist(mm, player) <= def.aoeRadius).map(mm => ({ mobId: mm.id, dmg: def.damageMin + Math.floor(Math.random() * (def.damageMax - def.damageMin)), skill: sk.id })));
            } else {
              if (dist(aggroMob, player) > def.range) return;
              const dx = aggroMob.x - player.x, dy = aggroMob.y - player.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              pendingProjRef.current.push({
                id: `proj_${now}_${sk.id}`, x: player.x, y: player.y - 10,
                vx: (dx / len) * 7, vy: (dy / len) * 7,
                targetMobId: aggroMob.id,
                damage: def.damageMin + Math.floor(Math.random() * (def.damageMax - def.damageMin)),
                skill: sk.id, bornAt: performance.now(), ttl: 1500, fromPlayer: true,
              });
            }
            player.mp = Math.max(0, player.mp - def.manaCost);
            sk.cooldownUntil = now + def.cooldown;
          });
        }

        // Update projectiles
        const liveProjectiles = projectiles.filter(p => {
          p.x += p.vx; p.y += p.vy;
          if (!p.fromPlayer) {
            // enemy projectile -> hit player
            if (Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2) < 14) {
              player.hp = Math.max(0, player.hp - p.damage);
              floatingDamages.push({ id: `fd_pp_${now}_${p.id}`, x: player.x, y: player.y - 24, text: `-${p.damage}`, color: '#a855f7', bornAt: now });
              return false;
            }
          } else if (p.targetMobId) {
            const m = mobsLocal.find(mm => mm.id === p.targetMobId);
            if (m && m.alive && Math.sqrt((m.x - p.x) ** 2 + (m.y - p.y) ** 2) < 16) {
              m.hp -= p.damage;
              floatingDamages.push({ id: `fd_pr_${now}_${p.id}`, x: m.x, y: m.y - 16, text: `-${p.damage}`, color: SKILL_DEFS[p.skill].color, bornAt: now });
              if (m.hp <= 0) {
                m.alive = false; m.hp = 0; m.respawnAt = now + MOB_RESPAWN_MS;
                const xpMult = xpDiffMultiplier(prev.level, m.level);
                xp += Math.max(1, Math.round(m.xpReward * xpMult));
                dropFromMob(m, prev.currentMap);
                quests.forEach(q => { if (q.type === 'kill_demon' && !q.completed) { q.progress += 1; if (q.progress >= q.target) q.completed = true; } });
              }
              return false;
            }
          }
          return performance.now() - p.bornAt < p.ttl;
        });

        // Level and XP — curva real (xpForLevel) cumulativa
        let level = 1;
        let cumul = 0;
        for (let lv = 1; lv < 200; lv++) {
          const need = xpForLevel(lv);
          if (xp < cumul + need) { level = lv; break; }
          cumul += need;
          level = lv + 1;
        }
        const needCur = xpForLevel(level);
        const xpPercent = Math.min(100, ((xp - cumul) / needCur) * 100);
        let newSkills = prev.skills;
        if (level > prev.level) {
          queueEvent('level_up', `Subiu para o nível ${level}!`, '⭐', '#fbbf24');
          if (profileNow) {
            const unlocked = getClassSkills(profileNow.classId, level);
            const existing = new Set(prev.skills.map(s => s.id));
            const added = unlocked.filter(u => !existing.has(u.id));
            if (added.length) {
              newSkills = [...prev.skills, ...added.map(s => ({ id: s.id, cooldownUntil: 0 }))];
              added.forEach(s => queueEvent('level_up', `🆕 Nova skill: ${s.name}`, s.icon, s.color));
            }
          }
        }

        // Ground items: drain pending drops + pickup + expire
        let groundItems = prev.groundItems.slice();
        if (pendingDropsRef.current.length) {
          groundItems.push(...pendingDropsRef.current);
          pendingDropsRef.current = [];
        }
        if (pendingGoldRef.current > 0) {
          resources.gold += pendingGoldRef.current;
          quests.forEach(q => { if (q.type === 'collect_gold' && !q.completed) { q.progress += pendingGoldRef.current; if (q.progress >= q.target) q.completed = true; } });
          pendingGoldRef.current = 0;
        }
        const newBag = bag;
        // Pets do mapa coletam ouro/rubi automaticamente
        const collectorPets = pets.filter(p => p.assignedMap === prev.currentMap && p.state !== 'dead');
        groundItems = groundItems.filter(gi => {
          if (gi.mapId !== prev.currentMap) return now < gi.expiresAt;
          if (now >= gi.expiresAt) return false;
          const dPlayer = Math.sqrt((gi.x - player.x) ** 2 + (gi.y - player.y) ** 2);
          // Gold: qualquer pet vivo coleta; Ruby: apenas pets lendários coletam
          if (gi.kind === 'gold') {
            const collected = collectorPets.length > 0 && collectorPets.some(p => Math.sqrt((gi.x - p.x) ** 2 + (gi.y - p.y) ** 2) < 60) || dPlayer < 26;
            if (collected) {
              resources.gold += gi.amount ?? 1;
              collectEffectsRef.current.push({ x: gi.x, y: gi.y, startTime: time, text: `+${gi.amount}🪙` });
              return false;
            }
            return true;
          }
          if (gi.kind === 'ruby') {
            const legendaryPets = collectorPets.filter(p => p.rarity === 'legendary');
            const collected = legendaryPets.some(p => Math.sqrt((gi.x - p.x) ** 2 + (gi.y - p.y) ** 2) < 60) || dPlayer < 26;
            if (collected) {
              resources.ruby += gi.amount ?? 1;
              collectEffectsRef.current.push({ x: gi.x, y: gi.y, startTime: time, text: `+${gi.amount}💎` });
              return false;
            }
            return true;
          }
          // Chest key: jogador OU pets coletam
          if (gi.kind === 'chest_key') {
            const petGrabKey = collectorPets.some(p => Math.sqrt((gi.x - p.x) ** 2 + (gi.y - p.y) ** 2) < 60);
            if (dPlayer < 26 || petGrabKey) {
              const slot = newBag.find(i => i.id === 'chest_key');
              if (slot) slot.count += 1;
              collectEffectsRef.current.push({ x: gi.x, y: gi.y, startTime: time, text: '+🔑' });
              return false;
            }
            return true;
          }
          // Eggs: SOMENTE jogador coleta (pets ignoram)
          const isEgg = gi.kind.startsWith('egg_');
          if (isEgg) {
            if (dPlayer < 22) {
              const slot = newBag.find(i => i.id === gi.kind);
              if (slot) slot.count += 1;
              collectEffectsRef.current.push({ x: gi.x, y: gi.y, startTime: time, text: '+🥚' });
              return false;
            }
            return true;
          }
          // Poções: jogador coleta; pets também trazem para o jogador
          const petGrabbed = collectorPets.some(p => Math.sqrt((gi.x - p.x) ** 2 + (gi.y - p.y) ** 2) < 60);
          if (dPlayer < 22 || petGrabbed) {
            const slot = newBag.find(i => i.id === gi.kind);
            if (slot) slot.count += 1;
            collectEffectsRef.current.push({ x: gi.x, y: gi.y, startTime: time, text: gi.kind === 'hp_potion' ? '+❤️' : '+💧' });
            return false;
          }
          return true;
        });

        // Auto Heal / Auto Mana — só atua se o autoMode estiver ativo e o painel ligado
        if (prev.autoMode && prev.autoPotionEnabled) {
          const hpPct = (player.hp / player.maxHp) * 100;
          const mpPct = (player.mp / player.maxMp) * 100;
          if (hpPct <= prev.autoHealThreshold && player.hp < player.maxHp) {
            const slot = newBag.find(i => i.id === 'hp_potion');
            if (slot && slot.count > 0) {
              slot.count -= 1;
              player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.5));
              floatingDamages.push({
                id: `fd_ah_${now}`, x: player.x, y: player.y - 28,
                text: '+❤️', color: '#22c55e', bornAt: now,
              });
            }
          }
          if (mpPct <= prev.autoManaThreshold && player.mp < player.maxMp) {
            const slot = newBag.find(i => i.id === 'mp_potion');
            if (slot && slot.count > 0) {
              slot.count -= 1;
              player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * 0.5));
              floatingDamages.push({
                id: `fd_am_${now}`, x: player.x, y: player.y - 28,
                text: '+💧', color: '#3b82f6', bornAt: now,
              });
            }
          }
        }

        return {
          ...prev, player, creature, coins, resources, totalCoins, chestOpened,
          cycleState, cycleTimer, cycleStartTime, camera: cam,
          chests, pets, demons: demons.filter(d => d.active), bosses: bosses.filter(b => b.active),
          quests, level, xp, xpPercent, walkingNPCs,
          isSnowing, snowTimer, questResetTimer, bossMapTimer, bossMapAvailable,
          bag: newBag, alerts,
          mobs: mobsLocal, projectiles: liveProjectiles, floatingDamages, selectedMobId,
          skills: newSkills, groundItems,
        };
      });

      collectEffectsRef.current = collectEffectsRef.current.filter(e => time - e.startTime < 800);
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [viewW, viewH]);

  const refreshPlayerStats = useCallback(() => {
    setGameState(prev => {
      const profile = loadProfile();
      const attrs = getProfileAttrs(profile);
      if (!profile || !attrs) return prev;
      const d = deriveStats(profile.classId, attrs);
      const maxHp = Math.round(d.hp), maxMp = Math.round(d.mp);
      return { ...prev, player: { ...prev.player, maxHp, maxMp, hp: Math.min(prev.player.hp, maxHp), mp: Math.min(prev.player.mp, maxMp) } };
    });
  }, []);

  return {
    gameState, setTarget, interactWithChest, collectEffects: collectEffectsRef,
    teleportToMap, toggleUI, buyPetChest, buyChestType, buyPlanfyEgg, assignPetToMap,
    claimQuest, dismissAFK, revivePet, useTeleportScroll, darkMageSendPet, selectDarkMagePet, setPetFilter,
    logEvent, clearEvents,
    selectMob, toggleAutoMode, setJoystick, useSkill, usePotion, openEgg, tradeFragments, buyBonusSkill,
    setAutoHealThreshold, setAutoManaThreshold, toggleAutoPotion,
    refreshPlayerStats,
    nextDemonSpawnRef: lastDemonSpawn,
  };
}

function rollGachaPet(playerPos: Position, customWeights?: Record<PetRarity, number>): Pet {
  const rarities: PetRarity[] = ['common', 'rare', 'epic', 'legendary'];
  const weightSrc = customWeights || GACHA_WEIGHTS;
  const weights = rarities.map(r => weightSrc[r]);
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  let rarity: PetRarity = 'common';
  for (let i = 0; i < rarities.length; i++) { roll -= weights[i]; if (roll <= 0) { rarity = rarities[i]; break; } }
  const variations: PetVariation[] = ['fast', 'slow', 'light_sleeper', 'heavy_sleeper'];
  const variation = variations[Math.floor(Math.random() * variations.length)];
  const config = PET_CONFIGS[rarity][variation];
  // HP variável por raridade (mais raridade tende a mais HP)
  const rarityBoost = rarity === 'legendary' ? 6 : rarity === 'epic' ? 4 : rarity === 'rare' ? 2 : 0;
  const hp = PET_HP_VARIATION_MIN + rarityBoost + Math.floor(Math.random() * (PET_HP_VARIATION_MAX - PET_HP_VARIATION_MIN));
  return {
    id: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: config.name, rarity, variation, color: config.color, accentColor: config.accent,
    speed: config.speed, energy: config.energy, efficiency: config.efficiency, sleepTime: config.sleepTime,
    state: 'idle', assignedMap: null, x: playerPos.x + 20, y: playerPos.y,
    direction: 'down', animFrame: 0, zzzFrame: 0, targetCoin: null,
    farmStartTime: null, cycleStartTime: 0, stateTimer: 0, trappedUntil: null,
    hp, maxHp: hp, isHealer: false, healTarget: null, attackingBoss: false,
  };
}

function generateChestRewards(goldBonus: number, rubyBonus: number) {
  const r = Math.random();
  if (r < 0.4) return { gold: Math.floor((10 + Math.random() * 20) * goldBonus), ruby: 0, crystal: Math.floor(Math.random() * 3) };
  if (r < 0.6) return { gold: Math.floor(5 * goldBonus), ruby: Math.floor((2 + Math.random() * 3) * rubyBonus), crystal: Math.floor(Math.random() * 5) };
  if (r < 0.85) return { gold: Math.floor((15 + Math.random() * 15) * goldBonus), ruby: Math.floor(rubyBonus), crystal: Math.floor(2 + Math.random() * 3) };
  return { gold: 0, ruby: Math.floor((5 + Math.random() * 5) * rubyBonus), crystal: Math.floor(5 + Math.random() * 5) };
}
