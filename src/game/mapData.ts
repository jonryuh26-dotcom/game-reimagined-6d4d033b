import { MapConfig, MapId, ShopItem, PetRarity, PetVariation, Quest } from './types';
import mapMain from '@/assets/map-altar-hub.png';
import mapDarkVillage from '@/assets/map-darkvillage.png';
import mapIce from '@/assets/map-ice.png';
import mapFire from '@/assets/map-fire.png';
import mapDesert from '@/assets/map-desert.png';
import mapSwamp from '@/assets/map-swamp.png';
import mapCrystal from '@/assets/map-crystal.png';
import mapRuins from '@/assets/map-ruins.png';
import mapDark from '@/assets/map-dark.png';
import mapEnchantedForest from '@/assets/map-enchanted-forest.png';
import mapFrozenTundra from '@/assets/map-frozen-tundra.png';
import mapLavaFields from '@/assets/map-lava-fields.png';
import mapMysticSwamp from '@/assets/map-mystic-swamp.png';
import mapUnderground1 from '@/assets/map-underground-1.jpg';
import mapUnderground2 from '@/assets/map-underground-2.jpg';
import mapUnderground3 from '@/assets/map-underground-3.jpg';
import mapPurpleWilds from '@/assets/map-purple-wilds.png';
import mapInfernal from '@/assets/map-infernal.png';

// Dimensão padrão (mapas antigos). Vila grande define seu próprio width/height.
export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 1280;

// Vila gigante (5x área) — Tibia HD style
export const VILLAGE_WIDTH = 2400;
export const VILLAGE_HEIGHT = 2880;

/** Resolve dimensões reais do mapa (com fallback para o padrão). */
export function mapDims(mapId: MapId): { w: number; h: number } {
  const m = MAPS[mapId];
  return { w: m?.width ?? MAP_WIDTH, h: m?.height ?? MAP_HEIGHT };
}
export const TILE_SIZE = 32;
export const PLAYER_SPEED = 2.5;
export const CREATURE_SPEED = 3.5;
export const COIN_RESPAWN_TIME = 20000;
export const PET_FARM_DURATION = 60000;
export const PET_SLEEP_DURATION = 60000;
export const DEMON_SPAWN_INTERVAL = 300000;
export const DEMON_TRAP_DURATION = 30000;
export const TELEPORT_COST_GOLD = 0;
export const TELEPORT_COST_RUBY = 0;
export const PET_CHEST_COST_RUBY = 30;
export const PET_CHEST_COST_GOLD = 50;
export const PLANFY_EGG_COST_RUBY = 50;
export const PLANFY_EGG_COST_GOLD = 100;
export const SEND_ZONE_COST_GOLD = 50000;
export const XP_PER_LEVEL = 100;
export const MAX_AFK_HOURS = 8;
export const AFK_DEMON_PENALTY = 0.2;
export const SNOW_INTERVAL = 1800000; // 30 min
export const SNOW_DURATION = 120000; // 2 min snow
export const QUEST_RESET_TIME = 10800000; // 3 hours
export const BOSS_MAP_INTERVAL = 7200000; // 2 hours
export const CHEST_RESPAWN_DEFAULT = 7200000; // 2 hours
export const HEAL_INTERVAL = 180000; // 3 min
export const PET_MAX_HP = 10;
export const DEMON_HIT_DAMAGE = 1;
export const BOSS_HP = 50;
export const REVIVE_CRYSTAL_COST = 5;

// Patch 2 - Sistemas avançados
export const RARE_CHEST_COST = 30000;
export const EPIC_CHEST_COST = 30000;
export const LEGENDARY_CHEST_COST = 30000;
export const PLANFY_NEW_GOLD_COST = 2000;
export const PLANFY_NEW_RUBY_COST = 200;
export const DARK_MAGE_TELEPORT_COST = 5000;
export const DARK_MAGE_SPAWN_INTERVAL = 600000; // 10 min
export const DARK_MAGE_DESPAWN = 120000; // visível por 2 min
export const HOSTILE_NPC_PUNISH_INTERVAL = 300000; // 5 min sem quest = spawn
export const HOSTILE_NPC_DEMONS_PER_PUNISH = 5;
export const ALERT_PRE_BOSS_MS = 30000; // avisa 30s antes
export const ALERT_PRE_SNOW_MS = 30000;
export const TELEPORT_SCROLL_DROP_CHANCE = 0.15; // demon raro+
export const PET_HP_VARIATION_MIN = 8;
export const PET_HP_VARIATION_MAX = 16;

// Escala dinâmica — APENAS quantidade, nunca HP. A cada 5 pets, +2 demons.
export const DIFFICULTY_PETS_PER_TIER = 5;
export const DIFFICULTY_SPAWN_BONUS_PER_TIER = 2;
export const DIFFICULTY_SPEED_BONUS_PER_TIER = 0.15;

// HP fixo dos demons (não escala)
export const DEMON_HP_FIXED = 4;
export const DEMON_ELITE_HP_FIXED = 12;

// Dano de demons (range)
export const DEMON_DMG_MIN = 3;
export const DEMON_DMG_MAX = 7;
export const DEMON_ELITE_DMG_MIN = 9;
export const DEMON_ELITE_DMG_MAX = 15;

// Pets com energia alta sofrem menos dano
export const PET_HIGH_ENERGY_THRESHOLD = 180;
export const PET_HIGH_ENERGY_DMG_REDUCTION = 0.4; // -40% dano

// Demon elite (raro)
export const DEMON_ELITE_REQUIRES_RARITY: PetRarity[] = ['epic', 'legendary'];

// Drop de Cristal Negro nos baús
export const BLACK_CRYSTAL_DROP_CHANCE = 0.18;

// ====== Sistema de combate (player vs mobs) ======
// MMORPG mobile — progressão lenta. Player começa devagar.
export const PLAYER_MAX_HP = 600;
export const PLAYER_MAX_MP = 200;
export const PLAYER_HP_REGEN = 2;
export const PLAYER_MP_REGEN = 6;
export const PLAYER_BASIC_DMG_MIN = 14;
export const PLAYER_BASIC_DMG_MAX = 22;
export const PLAYER_ATTACK_RANGE = 60;
export const PLAYER_ATTACK_COOLDOWN = 1400;     // base lenta
export const PLAYER_BASE_SPEED = 1.4;            // base lenta

// XP — progressão MMO lenta. XP_PER_LEVEL escala por nível.
export function xpForLevel(level: number): number {
  return Math.floor(120 * Math.pow(level, 1.55));
}
// Penalidade de XP por desnível (player muito acima do mob)
export function xpDiffMultiplier(playerLevel: number, mobLevel: number): number {
  const diff = playerLevel - mobLevel;
  if (diff <= 2) return 1;
  if (diff <= 4) return 0.6;
  if (diff <= 6) return 0.3;
  if (diff <= 9) return 0.1;
  return 0.02;
}

// Skills agora vêm de skills.ts (uma por classe).
export { SKILL_BY_ID as SKILL_DEFS } from './skills';


export const MOB_RESPAWN_MS = 22000;             // respawn lento
export const MOB_CONFIGS: Record<import('./types').MobKind, {
  name: string; color: string; hp: number; damage: number;
  speed: number; aggroRange: number; attackRange: number;
  xp: number; gold: number; attackCooldown: number;
}> = {
  // Saibaman base — escalado por level depois
  saibaman:           { name: 'Saibaman',           color: '#4ade80', hp: 240, damage: 22, speed: 0.95, aggroRange: 200, attackRange: 30, xp: 14, gold: 6,  attackCooldown: 1500 },
  saibaman_elite:     { name: 'Saibaman Elite',     color: '#16a34a', hp: 520, damage: 38, speed: 1.10, aggroRange: 240, attackRange: 32, xp: 30, gold: 14, attackCooldown: 1400 },
  saibaman_corrupted: { name: 'Saibaman Corrompido',color: '#7c3aed', hp: 720, damage: 48, speed: 1.20, aggroRange: 260, attackRange: 50, xp: 48, gold: 22, attackCooldown: 1700 },
  saibaman_alpha:     { name: 'Saibaman Alpha',     color: '#dc2626', hp: 1600,damage: 70, speed: 1.30, aggroRange: 320, attackRange: 50, xp: 110,gold: 60, attackCooldown: 1300 },
  // legados (mantidos só por compat — não spawnam mais)
  goblin:   { name: 'Goblin Guerreiro', color: '#65a30d', hp: 1200, damage: 70, speed: 1.4, aggroRange: 180, attackRange: 45, xp: 18, gold: 25, attackCooldown: 1200 },
  slime:    { name: 'Slime',            color: '#a855f7', hp: 700,  damage: 45, speed: 1.0, aggroRange: 150, attackRange: 40, xp: 10, gold: 12, attackCooldown: 1400 },
  darkmage: { name: 'Mago Negro',       color: '#1e1b4b', hp: 1600, damage: 90, speed: 1.1, aggroRange: 220, attackRange: 55, xp: 25, gold: 40, attackCooldown: 1800 },
  kitsune:       { name: 'Kitsune',      color: '#fb923c', hp: 600,  damage: 35, speed: 1.6, aggroRange: 180, attackRange: 42, xp: 8,  gold: 10, attackCooldown: 1100 },
  oni:           { name: 'Oni',          color: '#dc2626', hp: 1500, damage: 85, speed: 1.2, aggroRange: 200, attackRange: 50, xp: 22, gold: 38, attackCooldown: 1300 },
  tengu:         { name: 'Tengu',        color: '#16a34a', hp: 950,  damage: 60, speed: 1.5, aggroRange: 220, attackRange: 50, xp: 16, gold: 22, attackCooldown: 1600 },
  kappa:         { name: 'Kappa',        color: '#0ea5e9', hp: 1300, damage: 70, speed: 1.0, aggroRange: 170, attackRange: 45, xp: 19, gold: 28, attackCooldown: 1400 },
  yurei:         { name: 'Yūrei',        color: '#a78bfa', hp: 800,  damage: 55, speed: 1.3, aggroRange: 220, attackRange: 42, xp: 14, gold: 18, attackCooldown: 1300 },
  samurai_zumbi: { name: 'Samurai Zumbi',color: '#475569', hp: 2200, damage: 120,speed: 1.2, aggroRange: 200, attackRange: 50, xp: 38, gold: 70, attackCooldown: 1500 },
  wyrmling:      { name: 'Wyrmling',     color: '#f59e0b', hp: 1800, damage: 95, speed: 1.4, aggroRange: 220, attackRange: 55, xp: 30, gold: 55, attackCooldown: 1700 },
  shogun_dark:   { name: 'Shōgun Negro', color: '#1e1b4b', hp: 3200, damage: 160,speed: 1.3, aggroRange: 240, attackRange: 55, xp: 60, gold: 110,attackCooldown: 1500 },
  // Mini Dragões — novos
  dragonling_emerald: { name: 'Dragãozinho Esmeralda', color: '#10b981', hp: 880,  damage: 52, speed: 1.25, aggroRange: 260, attackRange: 55, xp: 38, gold: 26, attackCooldown: 1500 },
  dragonling_crimson: { name: 'Dragãozinho Carmesim',  color: '#ef4444', hp: 1400, damage: 78, speed: 1.30, aggroRange: 280, attackRange: 55, xp: 70, gold: 48, attackCooldown: 1400 },
  // Mobs da Floresta Sombria (vila)
  shadow_wolf:     { name: 'Lobo Sombrio',     color: '#475569', hp: 320,  damage: 26, speed: 1.55, aggroRange: 240, attackRange: 45, xp: 18, gold: 9,  attackCooldown: 1100 },
  wild_boar:       { name: 'Javali Selvagem',  color: '#92400e', hp: 540,  damage: 34, speed: 1.20, aggroRange: 200, attackRange: 45, xp: 22, gold: 12, attackCooldown: 1500 },
  spectral_fairy:  { name: 'Fada Espectral',   color: '#e879f9', hp: 220,  damage: 40, speed: 1.35, aggroRange: 280, attackRange: 50, xp: 26, gold: 16, attackCooldown: 1700 },
  // Mini-dragões estilo Charizard (subterrâneo)
  charling_orange:   { name: 'Charling Flamejante', color: '#f97316', hp: 900,  damage: 58, speed: 1.30, aggroRange: 280, attackRange: 55, xp: 60,  gold: 40, attackCooldown: 1500 },
  charling_blue:     { name: 'Charling Azul',       color: '#0ea5e9', hp: 1500, damage: 78, speed: 1.35, aggroRange: 300, attackRange: 60, xp: 110, gold: 70, attackCooldown: 1450 },
  charling_obsidian: { name: 'Charling Obsidiana',  color: '#1f2937', hp: 2600, damage: 120,speed: 1.40, aggroRange: 320, attackRange: 65, xp: 220, gold: 140,attackCooldown: 1400 },
};

// Mapas de progressão — só Saibaman variantes.
export const MAP_MOB_KINDS: Partial<Record<import('./types').MapId, import('./types').MobKind[]>> = {
  village:        ['shadow_wolf', 'wild_boar', 'spectral_fairy'],
  enchantedforest:['saibaman', 'saibaman_elite', 'dragonling_emerald'],
  frozentundra:   ['saibaman_elite', 'saibaman_corrupted', 'dragonling_emerald'],
  volcano:        ['saibaman_corrupted', 'saibaman_alpha', 'dragonling_crimson'],
  dark:           ['saibaman_alpha', 'saibaman_corrupted', 'dragonling_crimson'],
  underground_1:  ['charling_orange'],
  // Subterrâneos II e III agora também recebem mobs da vila (lvl 35+)
  underground_2:  ['charling_orange', 'charling_blue', 'shadow_wolf', 'wild_boar', 'spectral_fairy'],
  underground_3:  ['charling_blue', 'charling_obsidian', 'shadow_wolf', 'wild_boar', 'spectral_fairy'],
  purplewilds:    ['saibaman_corrupted', 'spectral_fairy', 'shadow_wolf'],
  infernal:       ['saibaman_alpha', 'dragonling_crimson', 'wild_boar'],
};

// Range de level por mapa (mob terá level aleatório nesse range)
export const MAP_LEVEL_RANGE: Partial<Record<import('./types').MapId, [number, number]>> = {
  village:         [1, 20],
  enchantedforest: [20, 40],
  frozentundra:    [40, 60],
  volcano:         [60, 80],
  dark:            [80, 100],
  underground_1:   [1, 10],
  underground_2:   [35, 55],
  underground_3:   [40, 70],
  purplewilds:     [25, 50],
  infernal:        [55, 90],
};

// Sequência principal de progressão (5 mapas) e nível requerido
export const PROGRESSION_MAPS: { id: import('./types').MapId; minLevel: number }[] = [
  { id: 'village',         minLevel: 1 },
  { id: 'enchantedforest', minLevel: 5 },
  { id: 'frozentundra',    minLevel: 15 },
  { id: 'volcano',         minLevel: 30 },
  { id: 'dark',            minLevel: 50 },
  { id: 'purplewilds',     minLevel: 25 },
  { id: 'infernal',        minLevel: 55 },
];


// Chances do baú gacha por tipo (somam ~1.0)
export const CHEST_RARITY_WEIGHTS: Record<'rare_chest' | 'epic_chest' | 'legendary_chest', Record<PetRarity, number>> = {
  rare_chest:      { common: 25, rare: 55, epic: 17, legendary: 3 },
  epic_chest:      { common: 8,  rare: 25, epic: 55, legendary: 12 },
  legendary_chest: { common: 3,  rare: 12, epic: 30, legendary: 55 },
};

export const DEMON_TRAP_CHANCE: Record<PetRarity, number> = {
  common: 0.8,
  rare: 0.5,
  epic: 0.25,
  legendary: 0.1,
};

function genCoins(count: number, xMin: number, xMax: number, yMin: number, yMax: number) {
  const coins = [];
  for (let i = 0; i < count; i++) {
    coins.push({ x: xMin + Math.floor(Math.random() * (xMax - xMin)), y: yMin + Math.floor(Math.random() * (yMax - yMin)) });
  }
  return coins;
}

function genDemonSpawns(count: number, xMin: number, xMax: number, yMin: number, yMax: number) {
  const spawns = [];
  for (let i = 0; i < count; i++) {
    spawns.push({ x: xMin + Math.floor(Math.random() * (xMax - xMin)), y: yMin + Math.floor(Math.random() * (yMax - yMin)) });
  }
  return spawns;
}

export const MAPS: Record<MapId, MapConfig> = {
  village: {
    id: 'village', name: 'Floresta Sombria', image: mapMain, color: '#a78bfa',
    width: VILLAGE_WIDTH, height: VILLAGE_HEIGHT,
    playerStart: { x: VILLAGE_WIDTH / 2, y: VILLAGE_HEIGHT / 2 },
    coins: genCoins(80, 200, VILLAGE_WIDTH - 200, 200, VILLAGE_HEIGHT - 200),
    chests: [
      { x: 600, y: 600 }, { x: VILLAGE_WIDTH - 600, y: 600 },
      { x: 600, y: VILLAGE_HEIGHT - 600 }, { x: VILLAGE_WIDTH - 600, y: VILLAGE_HEIGHT - 600 },
      { x: VILLAGE_WIDTH / 2, y: 800 }, { x: VILLAGE_WIDTH / 2, y: VILLAGE_HEIGHT - 800 },
    ],
    portals: [], goldBonus: 1, rubyBonus: 1, demonCount: 14, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 0, y: 0, w: VILLAGE_WIDTH, h: VILLAGE_HEIGHT }],
    collisionZones: [],
    waterZones: [],
    // Escadas e portais — sempre no lado DIREITO do mapa, longe dos cantos clicáveis
    stairs: [
      { x: VILLAGE_WIDTH - 220, y: VILLAGE_HEIGHT / 2 - 200, targetMap: 'underground_1', targetX: 480, targetY: 1180, label: '🪜 Subterrâneo I' },
      { x: VILLAGE_WIDTH - 220, y: VILLAGE_HEIGHT / 2,        targetMap: 'purplewilds',  targetX: 480, targetY: 1100, label: '🌌 Bosque Sombrio' },
      { x: VILLAGE_WIDTH - 220, y: VILLAGE_HEIGHT / 2 + 200, targetMap: 'infernal',     targetX: 480, targetY: 1100, label: '🔥 Reino Infernal' },
    ],
    npcPositions: [{ x: VILLAGE_WIDTH / 2 - 80, y: VILLAGE_HEIGHT / 2 + 80 }, { x: VILLAGE_WIDTH / 2 + 200, y: VILLAGE_HEIGHT / 2 - 200 }],
    demonSpawns: genDemonSpawns(14, 250, VILLAGE_WIDTH - 250, 250, VILLAGE_HEIGHT - 250),
  },
  darkvillage: {
    id: 'darkvillage', name: 'Vila Encantada', image: mapDarkVillage, color: '#c084fc',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(24, 150, 800, 300, 1100),
    chests: [{ x: 480, y: 600 }, { x: 250, y: 800 }, { x: 700, y: 500 }, { x: 400, y: 350 }],
    portals: [], goldBonus: 1.4, rubyBonus: 1.6, demonCount: 5, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 100, y: 250, w: 760, h: 950 }],
    collisionZones: [
      { x: 380, y: 280, w: 220, h: 200 }, { x: 180, y: 380, w: 180, h: 160 },
      { x: 620, y: 380, w: 180, h: 160 }, { x: 200, y: 620, w: 180, h: 160 },
      { x: 440, y: 540, w: 100, h: 100 },
    ],
    waterZones: [],
    npcPositions: [{ x: 350, y: 700 }, { x: 620, y: 700 }, { x: 480, y: 950 }],
    demonSpawns: genDemonSpawns(5, 150, 800, 300, 1050),
    bossSpawn: { x: 480, y: 540 },
  },
  forest: {
    id: 'forest', name: 'Vale Gelado', image: mapIce, color: '#7dd3fc',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(20, 150, 800, 300, 1100),
    chests: [{ x: 480, y: 600 }, { x: 250, y: 400 }, { x: 700, y: 800 }],
    portals: [], goldBonus: 1.2, rubyBonus: 1.1, demonCount: 4, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 100, y: 250, w: 760, h: 950 }],
    collisionZones: [{ x: 300, y: 350, w: 360, h: 250 }],
    waterZones: [{ x: 300, y: 350, w: 360, h: 250 }],
    npcPositions: [{ x: 600, y: 500 }],
    demonSpawns: genDemonSpawns(4, 150, 800, 300, 1000),
  },
  volcano: {
    id: 'volcano', name: 'Vulcão Ardente', image: mapFire, color: '#f87171',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(20, 200, 750, 300, 1050),
    chests: [{ x: 480, y: 500 }, { x: 700, y: 350 }, { x: 300, y: 800 }],
    portals: [], goldBonus: 1.5, rubyBonus: 1.3, demonCount: 5, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 150, y: 250, w: 660, h: 950 }],
    collisionZones: [],
    waterZones: [],
    npcPositions: [{ x: 300, y: 600 }, { x: 650, y: 400 }],
    demonSpawns: genDemonSpawns(5, 200, 750, 300, 1000),
  },
  desert: {
    id: 'desert', name: 'Deserto Dourado', image: mapDesert, color: '#fbbf24',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(25, 150, 800, 300, 1100),
    chests: [{ x: 300, y: 500 }, { x: 650, y: 400 }, { x: 480, y: 800 }, { x: 200, y: 900 }],
    portals: [], goldBonus: 2.0, rubyBonus: 1.2, demonCount: 6, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 100, y: 200, w: 760, h: 1000 }],
    collisionZones: [{ x: 350, y: 400, w: 250, h: 200 }],
    waterZones: [{ x: 600, y: 350, w: 200, h: 300 }],
    npcPositions: [{ x: 200, y: 600 }, { x: 700, y: 700 }],
    demonSpawns: genDemonSpawns(6, 150, 800, 250, 1050),
    bossSpawn: { x: 480, y: 500 },
  },
  swamp: {
    id: 'swamp', name: 'Pântano Sombrio', image: mapSwamp, color: '#22c55e',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(22, 200, 750, 350, 1050),
    chests: [{ x: 400, y: 600 }, { x: 600, y: 800 }, { x: 250, y: 500 }],
    portals: [], goldBonus: 1.3, rubyBonus: 1.5, demonCount: 7, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 150, y: 300, w: 660, h: 900 }],
    collisionZones: [],
    waterZones: [{ x: 300, y: 400, w: 360, h: 400 }],
    npcPositions: [{ x: 500, y: 500 }, { x: 300, y: 900 }],
    demonSpawns: genDemonSpawns(7, 200, 750, 350, 1000),
    bossSpawn: { x: 480, y: 600 },
  },
  crystal: {
    id: 'crystal', name: 'Caverna de Cristal', image: mapCrystal, color: '#06b6d4',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(24, 200, 750, 300, 1050),
    chests: [{ x: 350, y: 500 }, { x: 600, y: 600 }, { x: 480, y: 900 }, { x: 300, y: 700 }],
    portals: [], goldBonus: 1.8, rubyBonus: 2.0, demonCount: 8, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 180, y: 250, w: 600, h: 950 }],
    collisionZones: [{ x: 350, y: 350, w: 250, h: 200 }],
    waterZones: [],
    npcPositions: [{ x: 400, y: 400 }, { x: 600, y: 800 }],
    demonSpawns: genDemonSpawns(8, 200, 750, 300, 1000),
    bossSpawn: { x: 480, y: 500 },
  },
  ruins: {
    id: 'ruins', name: 'Ruínas Antigas', image: mapRuins, color: '#64748b',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(22, 250, 700, 300, 1050),
    chests: [{ x: 480, y: 500 }, { x: 300, y: 400 }, { x: 650, y: 700 }],
    portals: [], goldBonus: 1.6, rubyBonus: 1.8, demonCount: 8, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 200, y: 250, w: 560, h: 950 }],
    collisionZones: [{ x: 300, y: 350, w: 360, h: 200 }],
    waterZones: [],
    npcPositions: [{ x: 350, y: 600 }, { x: 600, y: 500 }],
    demonSpawns: genDemonSpawns(8, 250, 700, 300, 1000),
    bossSpawn: { x: 480, y: 450 },
  },
  dark: {
    id: 'dark', name: 'Reino Sombrio', image: mapDark, color: '#a855f7',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(28, 200, 750, 300, 1100),
    chests: [{ x: 350, y: 500 }, { x: 600, y: 600 }, { x: 480, y: 800 }, { x: 300, y: 400 }, { x: 700, y: 900 }],
    portals: [], goldBonus: 2.5, rubyBonus: 3.0, demonCount: 10, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 150, y: 250, w: 660, h: 950 }],
    collisionZones: [],
    waterZones: [],
    npcPositions: [{ x: 400, y: 500 }, { x: 600, y: 700 }, { x: 300, y: 800 }],
    demonSpawns: genDemonSpawns(10, 200, 750, 300, 1050),
    bossSpawn: { x: 480, y: 400 },
  },
  enchantedforest: {
    id: 'enchantedforest', name: 'Floresta Encantada', image: mapEnchantedForest, color: '#22c55e',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(28, 180, 780, 300, 1100),
    chests: [{ x: 350, y: 500 }, { x: 600, y: 600 }, { x: 480, y: 850 }, { x: 250, y: 750 }, { x: 720, y: 400 }],
    portals: [], goldBonus: 1.7, rubyBonus: 1.4, demonCount: 7, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 120, y: 250, w: 720, h: 980 }],
    collisionZones: [
      { x: 320, y: 480, w: 180, h: 160 }, { x: 580, y: 380, w: 160, h: 140 },
      { x: 220, y: 720, w: 160, h: 140 }, { x: 600, y: 800, w: 180, h: 140 },
    ],
    waterZones: [{ x: 680, y: 280, w: 160, h: 140 }],
    npcPositions: [{ x: 400, y: 600 }, { x: 620, y: 950 }],
    demonSpawns: genDemonSpawns(7, 180, 780, 300, 1050),
    bossSpawn: { x: 480, y: 500 },
  },
  frozentundra: {
    id: 'frozentundra', name: 'Tundra Congelada', image: mapFrozenTundra, color: '#bae6fd',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(26, 180, 780, 280, 1100),
    chests: [{ x: 320, y: 480 }, { x: 640, y: 380 }, { x: 480, y: 800 }, { x: 280, y: 900 }, { x: 700, y: 750 }],
    portals: [], goldBonus: 1.6, rubyBonus: 1.9, demonCount: 8, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 120, y: 220, w: 720, h: 1000 }],
    collisionZones: [
      { x: 280, y: 380, w: 180, h: 160 }, { x: 540, y: 460, w: 200, h: 160 },
      { x: 220, y: 700, w: 180, h: 160 }, { x: 580, y: 760, w: 200, h: 160 },
    ],
    waterZones: [],
    npcPositions: [{ x: 400, y: 600 }, { x: 640, y: 950 }],
    demonSpawns: genDemonSpawns(8, 180, 780, 280, 1050),
    bossSpawn: { x: 480, y: 540 },
  },
  lavafields: {
    id: 'lavafields', name: 'Campos de Lava', image: mapLavaFields, color: '#f97316',
    playerStart: { x: 480, y: 900 },
    coins: genCoins(28, 180, 780, 280, 1100),
    chests: [{ x: 360, y: 520 }, { x: 620, y: 460 }, { x: 480, y: 820 }, { x: 280, y: 760 }, { x: 700, y: 840 }],
    portals: [], goldBonus: 2.2, rubyBonus: 1.7, demonCount: 9, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT }],
    collisionZones: [],
    waterZones: [],
    npcPositions: [{ x: 380, y: 700 }, { x: 600, y: 880 }],
    demonSpawns: genDemonSpawns(9, 180, 780, 280, 1050),
    bossSpawn: { x: 480, y: 480 },
  },
  mysticswamp: {
    id: 'mysticswamp', name: 'Pântano Místico', image: mapMysticSwamp, color: '#d946ef',
    playerStart: { x: 480, y: 900 },
    coins: genCoins(26, 180, 780, 300, 1100),
    chests: [{ x: 340, y: 540 }, { x: 640, y: 460 }, { x: 480, y: 820 }, { x: 720, y: 760 }],
    portals: [], goldBonus: 1.8, rubyBonus: 2.1, demonCount: 8, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT }],
    collisionZones: [],
    waterZones: [],
    npcPositions: [{ x: 400, y: 700 }, { x: 620, y: 880 }],
    demonSpawns: genDemonSpawns(8, 180, 780, 300, 1050),
    bossSpawn: { x: 480, y: 520 },
  },
  // ===== Subterrâneo =====
  underground_1: {
    id: 'underground_1', name: 'Subterrâneo I', image: mapUnderground1, color: '#78350f',
    playerStart: { x: 480, y: 1180 },
    coins: genCoins(18, 160, 800, 200, 1100),
    chests: [{ x: 200, y: 300 }, { x: 760, y: 300 }, { x: 480, y: 700 }],
    portals: [], goldBonus: 1.5, rubyBonus: 1.3, demonCount: 8, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT }],
    collisionZones: [],
    waterZones: [],
    stairs: [
      { x: MAP_WIDTH - 80, y: 360, targetMap: 'village', targetX: VILLAGE_WIDTH - 320, targetY: VILLAGE_HEIGHT / 2 - 200, label: '🪜 Voltar à Vila' },
      { x: MAP_WIDTH - 80, y: 720, targetMap: 'underground_2', targetX: 480, targetY: 1180, label: '🪜 Descer (Lv 35-55)' },
    ],
    npcPositions: [],
    demonSpawns: genDemonSpawns(8, 160, 800, 200, 1100),
  },
  underground_2: {
    id: 'underground_2', name: 'Subterrâneo II', image: mapUnderground2, color: '#7f1d1d',
    playerStart: { x: 480, y: 1180 },
    coins: genCoins(20, 160, 800, 200, 1100),
    chests: [{ x: 240, y: 350 }, { x: 720, y: 350 }, { x: 480, y: 650 }],
    portals: [], goldBonus: 2.0, rubyBonus: 1.7, demonCount: 9, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT }],
    collisionZones: [],
    waterZones: [],
    stairs: [
      { x: MAP_WIDTH - 80, y: 360, targetMap: 'underground_1', targetX: MAP_WIDTH - 140, targetY: 720, label: '🪜 Subir' },
      { x: MAP_WIDTH - 80, y: 720, targetMap: 'underground_3', targetX: 480, targetY: 1180, label: '🪜 Descer (Lv 40-70)' },
    ],
    npcPositions: [],
    demonSpawns: genDemonSpawns(9, 160, 800, 200, 1100),
  },
  underground_3: {
    id: 'underground_3', name: 'Covil dos Dragões', image: mapUnderground3, color: '#dc2626',
    playerStart: { x: 480, y: 1180 },
    coins: genCoins(24, 160, 800, 200, 1100),
    chests: [{ x: 240, y: 380 }, { x: 720, y: 380 }, { x: 480, y: 700 }, { x: 320, y: 900 }, { x: 640, y: 900 }],
    portals: [], goldBonus: 3.0, rubyBonus: 2.5, demonCount: 10, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT }],
    collisionZones: [],
    waterZones: [],
    stairs: [
      { x: MAP_WIDTH - 80, y: 360, targetMap: 'underground_2', targetX: MAP_WIDTH - 140, targetY: 720, label: '🪜 Subir' },
    ],
    npcPositions: [],
    demonSpawns: genDemonSpawns(10, 160, 800, 200, 1100),
    bossSpawn: { x: 480, y: 300 },
  },
  // ===== Mapas novos do portal direito =====
  purplewilds: {
    id: 'purplewilds', name: 'Bosque Sombrio', image: mapPurpleWilds, color: '#a855f7',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(28, 150, 800, 250, 1150),
    chests: [{ x: 380, y: 500 }, { x: 640, y: 600 }, { x: 480, y: 850 }, { x: 250, y: 750 }, { x: 720, y: 400 }],
    portals: [], goldBonus: 1.9, rubyBonus: 2.2, demonCount: 9, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT }],
    collisionZones: [],
    waterZones: [],
    stairs: [
      { x: MAP_WIDTH - 80, y: MAP_HEIGHT / 2, targetMap: 'village', targetX: VILLAGE_WIDTH - 320, targetY: VILLAGE_HEIGHT / 2, label: '🌀 Voltar à Vila' },
    ],
    npcPositions: [{ x: 400, y: 600 }],
    demonSpawns: genDemonSpawns(9, 150, 800, 250, 1100),
    bossSpawn: { x: 480, y: 480 },
  },
  infernal: {
    id: 'infernal', name: 'Reino Infernal', image: mapInfernal, color: '#dc2626',
    playerStart: { x: 480, y: 1100 },
    coins: genCoins(30, 150, 800, 250, 1150),
    chests: [{ x: 360, y: 520 }, { x: 660, y: 460 }, { x: 480, y: 820 }, { x: 280, y: 760 }, { x: 700, y: 880 }],
    portals: [], goldBonus: 2.6, rubyBonus: 2.4, demonCount: 11, chestRespawnTime: CHEST_RESPAWN_DEFAULT,
    walkableZones: [{ x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT }],
    collisionZones: [],
    waterZones: [],
    stairs: [
      { x: MAP_WIDTH - 80, y: MAP_HEIGHT / 2, targetMap: 'village', targetX: VILLAGE_WIDTH - 320, targetY: VILLAGE_HEIGHT / 2 + 200, label: '🌀 Voltar à Vila' },
    ],
    npcPositions: [{ x: 400, y: 700 }],
    demonSpawns: genDemonSpawns(11, 150, 800, 250, 1100),
    bossSpawn: { x: 480, y: 500 },
  },
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'pet_chest', name: 'Baú de Pet', description: 'Pet aleatório (gacha)', priceRuby: PET_CHEST_COST_RUBY, priceGold: PET_CHEST_COST_GOLD, priceCrystal: 0, type: 'pet_chest' },
  { id: 'rare_chest', name: '🎁 Baú Raro', description: 'Maior chance de pet Raro', priceRuby: 0, priceGold: RARE_CHEST_COST, priceCrystal: 0, type: 'rare_chest' },
  { id: 'epic_chest', name: '🎁 Baú Épico', description: 'Maior chance de pet Épico', priceRuby: 0, priceGold: EPIC_CHEST_COST, priceCrystal: 0, type: 'epic_chest' },
  { id: 'legendary_chest', name: '🎁 Baú Lendário', description: 'Maior chance de pet Lendário', priceRuby: 0, priceGold: LEGENDARY_CHEST_COST, priceCrystal: 0, type: 'legendary_chest' },
  { id: 'planfy_egg', name: '🥚 Ovo Planfy Healer', description: 'Cura todos os pets a cada 3 min!', priceRuby: PLANFY_NEW_RUBY_COST, priceGold: PLANFY_NEW_GOLD_COST, priceCrystal: 0, type: 'planfy_egg' },
  { id: 'send_zone', name: '📦 Enviar Pet p/ Zona', description: 'Envia qualquer pet para zona premium', priceRuby: 0, priceGold: SEND_ZONE_COST_GOLD, priceCrystal: 0, type: 'send_zone' },
];

export const PET_CONFIGS: Record<PetRarity, Record<PetVariation, {
  name: string; color: string; accent: string;
  speed: number; energy: number; efficiency: number; sleepTime: number;
}>> = {
  common: {
    fast: { name: 'Slime Veloz', color: '#34d399', accent: '#059669', speed: 4.5, energy: 80, efficiency: 1, sleepTime: 60000 },
    slow: { name: 'Slime Pesado', color: '#6ee7b7', accent: '#10b981', speed: 2, energy: 120, efficiency: 1.5, sleepTime: 60000 },
    light_sleeper: { name: 'Slime Alerta', color: '#a7f3d0', accent: '#34d399', speed: 3, energy: 100, efficiency: 1, sleepTime: 30000 },
    heavy_sleeper: { name: 'Slime Dorminhoco', color: '#047857', accent: '#064e3b', speed: 3, energy: 150, efficiency: 1.8, sleepTime: 90000 },
  },
  rare: {
    fast: { name: 'Raposa Veloz', color: '#60a5fa', accent: '#2563eb', speed: 5, energy: 90, efficiency: 1.5, sleepTime: 60000 },
    slow: { name: 'Raposa Forte', color: '#93c5fd', accent: '#3b82f6', speed: 2.5, energy: 130, efficiency: 2, sleepTime: 60000 },
    light_sleeper: { name: 'Raposa Insone', color: '#3b82f6', accent: '#1d4ed8', speed: 3.5, energy: 110, efficiency: 1.5, sleepTime: 30000 },
    heavy_sleeper: { name: 'Raposa Sonolenta', color: '#1e40af', accent: '#1e3a8a', speed: 3.5, energy: 160, efficiency: 2.5, sleepTime: 90000 },
  },
  epic: {
    fast: { name: 'Fênix Veloz', color: '#a78bfa', accent: '#7c3aed', speed: 5.5, energy: 100, efficiency: 2, sleepTime: 50000 },
    slow: { name: 'Fênix Poderosa', color: '#c4b5fd', accent: '#8b5cf6', speed: 3, energy: 150, efficiency: 3, sleepTime: 60000 },
    light_sleeper: { name: 'Fênix Incansável', color: '#8b5cf6', accent: '#6d28d9', speed: 4, energy: 120, efficiency: 2, sleepTime: 25000 },
    heavy_sleeper: { name: 'Fênix Anciã', color: '#6d28d9', accent: '#4c1d95', speed: 4, energy: 180, efficiency: 3.5, sleepTime: 80000 },
  },
  legendary: {
    fast: { name: 'Dragão Infernal', color: '#ef4444', accent: '#b91c1c', speed: 6, energy: 120, efficiency: 3, sleepTime: 40000 },
    slow: { name: 'Dragão Titânico', color: '#fca5a5', accent: '#ef4444', speed: 3.5, energy: 200, efficiency: 4, sleepTime: 60000 },
    light_sleeper: { name: 'Dragão Eterno', color: '#dc2626', accent: '#991b1b', speed: 5, energy: 150, efficiency: 3, sleepTime: 20000 },
    heavy_sleeper: { name: 'Dragão Ancestral', color: '#991b1b', accent: '#7f1d1d', speed: 5, energy: 250, efficiency: 5, sleepTime: 80000 },
  },
};

export const GACHA_WEIGHTS: Record<PetRarity, number> = {
  common: 55, rare: 30, epic: 12, legendary: 3,
};

export const RARITY_COLORS: Record<PetRarity, string> = {
  common: '#4ade80', rare: '#60a5fa', epic: '#a78bfa', legendary: '#f97316',
};

export const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: 'Coletor Iniciante', description: 'Colete 50 de ouro', type: 'collect_gold', target: 50, progress: 0, completed: false, claimed: false, rewardGold: 0, rewardRuby: 15, rewardCrystal: 5 },
  { id: 'q2', title: 'Caçador de Rubis', description: 'Colete 10 rubis', type: 'collect_ruby', target: 10, progress: 0, completed: false, claimed: false, rewardGold: 100, rewardRuby: 20, rewardCrystal: 10 },
  { id: 'q3', title: 'Abridor de Baús', description: 'Abra 3 baús', type: 'open_chest', target: 3, progress: 0, completed: false, claimed: false, rewardGold: 50, rewardRuby: 30, rewardCrystal: 15 },
  { id: 'q4', title: 'Caçador de Demônios', description: 'Mate 5 demônios', type: 'kill_demon', target: 5, progress: 0, completed: false, claimed: false, rewardGold: 200, rewardRuby: 25, rewardCrystal: 20 },
  { id: 'q5', title: 'Dizimador', description: 'Mate 20 demônios', type: 'kill_demon', target: 20, progress: 0, completed: false, claimed: false, rewardGold: 500, rewardRuby: 50, rewardCrystal: 30 },
  { id: 'q6', title: 'Tesouro Oculto', description: 'Colete 200 de ouro', type: 'collect_gold', target: 200, progress: 0, completed: false, claimed: false, rewardGold: 0, rewardRuby: 40, rewardCrystal: 25 },
  { id: 'q7', title: 'Rubis Raros', description: 'Colete 30 rubis', type: 'collect_ruby', target: 30, progress: 0, completed: false, claimed: false, rewardGold: 300, rewardRuby: 50, rewardCrystal: 20 },
  { id: 'q8', title: 'Destruidor', description: 'Mate 50 demônios', type: 'kill_demon', target: 50, progress: 0, completed: false, claimed: false, rewardGold: 1000, rewardRuby: 100, rewardCrystal: 50 },
  { id: 'q9', title: 'Matador de Boss', description: 'Derrote 1 boss', type: 'kill_boss', target: 1, progress: 0, completed: false, claimed: false, rewardGold: 2000, rewardRuby: 100, rewardCrystal: 50 },
  { id: 'q10', title: 'Caçador Supremo', description: 'Abra 10 baús', type: 'open_chest', target: 10, progress: 0, completed: false, claimed: false, rewardGold: 500, rewardRuby: 80, rewardCrystal: 40 },
];

export const NPC_NAMES = ['Mago Eldrin', 'Bruxa Nyx', 'Sábio Orin', 'Feiticeira Luna', 'Alquimista Rex', 'Druida Fern', 'Xamã Kael'];
export const NPC_COLORS = ['#312e81', '#7f1d1d', '#064e3b', '#4c1d95', '#78350f', '#166534', '#1e3a5f'];
