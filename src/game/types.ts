export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type MapId = 'village' | 'darkvillage' | 'forest' | 'volcano' | 'desert' | 'swamp' | 'crystal' | 'ruins' | 'dark' | 'enchantedforest' | 'frozentundra' | 'lavafields' | 'mysticswamp' | 'underground_1' | 'underground_2' | 'underground_3' | 'purplewilds' | 'infernal';

export interface Portal {
  x: number;
  y: number;
  targetMap: MapId;
  targetX: number;
  targetY: number;
}

export interface MapConfig {
  id: MapId;
  name: string;
  image: string;
  color: string;
  /** opcional — se ausente usa MAP_WIDTH/HEIGHT padrão */
  width?: number;
  height?: number;
  coins: Position[];
  chests: Position[];
  portals: Portal[];
  walkableZones: { x: number; y: number; w: number; h: number }[];
  collisionZones: { x: number; y: number; w: number; h: number }[];
  waterZones: { x: number; y: number; w: number; h: number }[];
  /** Escadas de subida/descida — clique para teleportar */
  stairs?: { x: number; y: number; targetMap: MapId; targetX: number; targetY: number; label: string }[];
  playerStart: Position;
  npcPositions: Position[];
  demonSpawns: Position[];
  demonCount: number;
  goldBonus: number;
  rubyBonus: number;
  chestRespawnTime: number;
  bossSpawn?: Position;
}

export interface Resources {
  gold: number;
  ruby: number;
  crystal: number;
}

export type PetRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type PetVariation = 'fast' | 'slow' | 'light_sleeper' | 'heavy_sleeper';

export interface Pet {
  id: string;
  name: string;
  rarity: PetRarity;
  variation: PetVariation;
  color: string;
  accentColor: string;
  speed: number;
  energy: number;
  efficiency: number;
  sleepTime: number;
  state: 'idle' | 'sleeping' | 'farming' | 'trapped' | 'dead';
  assignedMap: MapId | null;
  x: number;
  y: number;
  direction: Direction;
  animFrame: number;
  zzzFrame: number;
  targetCoin: number | null;
  farmStartTime: number | null;
  cycleStartTime: number;
  stateTimer: number;
  trappedUntil: number | null;
  hp: number;
  maxHp: number;
  isHealer: boolean;
  healTarget: string | null;
  attackingBoss: boolean;
}

export interface MapChest {
  id: number;
  x: number;
  y: number;
  opened: boolean;
  respawnAt: number | null;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  respawnAt: number | null;
  sparkle: number;
  isRuby: boolean;
}

export interface Demon {
  id: string;
  x: number;
  y: number;
  mapId: MapId;
  direction: Direction;
  animFrame: number;
  targetPet: string | null;
  spawnTime: number;
  active: boolean;
  hp: number;
  maxHp: number;
  isElite: boolean;
}

export interface Boss {
  id: string;
  x: number;
  y: number;
  mapId: MapId;
  hp: number;
  maxHp: number;
  active: boolean;
  spawnTime: number;
  animFrame: number;
  direction: Direction;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'collect_gold' | 'collect_ruby' | 'open_chest' | 'kill_demon' | 'kill_boss';
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardGold: number;
  rewardRuby: number;
  rewardCrystal: number;
}

export interface WalkingNPC {
  id: string;
  x: number;
  y: number;
  mapId: MapId;
  name: string;
  direction: Direction;
  animFrame: number;
  targetX: number;
  targetY: number;
  moveTimer: number;
  hasQuest: boolean;
  color: string;
  isHostile?: boolean; // bruxo hostil que ataca se quest ignorada
  hostilityTimer?: number; // próximo spawn de demônios se quest não feita
  isDarkMage?: boolean; // teleporta pets por gold
  despawnAt?: number; // dark mage some após X tempo
}

export interface Player {
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
  animFrame: number;
  targetX?: number;
  targetY?: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  lastBasicAttack: number;
}

export type SkillId = string;

export interface SkillState {
  id: SkillId;
  cooldownUntil: number;
}

export type MobKind =
  | 'goblin' | 'slime' | 'darkmage'
  | 'oni' | 'kitsune' | 'tengu' | 'kappa'
  | 'yurei' | 'samurai_zumbi' | 'wyrmling' | 'shogun_dark'
  | 'saibaman' | 'saibaman_elite' | 'saibaman_corrupted' | 'saibaman_alpha'
  | 'dragonling_emerald' | 'dragonling_crimson'
  // Vila — 3 mobs novos
  | 'shadow_wolf' | 'wild_boar' | 'spectral_fairy'
  // Subterrâneo — mini-dragões estilo Charizard
  | 'charling_orange' | 'charling_blue' | 'charling_obsidian';

export type SaibamanSkill = 'paralysis' | 'slow' | 'ki_blast' | 'charge' | 'poison' | 'mini_explosion';

export interface Mob {
  id: string;
  kind: MobKind;
  name: string;
  level: number;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  mapId: MapId;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  aggroRange: number;
  attackRange: number;
  lastAttack: number;
  lastSkill: number;
  xpReward: number;
  goldReward: number;
  color: string;
  animFrame: number;
  direction: Direction;
  respawnAt: number | null;
  alive: boolean;
  variant: 'normal' | 'elite' | 'corrupted' | 'alpha' | 'dragon_emerald' | 'dragon_crimson' | 'wolf' | 'boar' | 'fairy' | 'char_orange' | 'char_blue' | 'char_obsidian';
  state: 'idle' | 'walk' | 'attack' | 'skill' | 'hit' | 'death';
  stateUntil: number;
  skill: SaibamanSkill | null;
}

export interface PlayerStatus {
  paralyzedUntil: number;
  slowUntil: number;
  poisonUntil: number;
  poisonDmgPerSec: number;
  lastPoisonTick: number;
}

export interface Attributes {
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  unspent: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetMobId: string | null;
  damage: number;
  skill: SkillId;
  bornAt: number;
  ttl: number;
  fromPlayer: boolean;
}

export interface GroundItem {
  id: string;
  x: number;
  y: number;
  mapId: MapId;
  kind: 'hp_potion' | 'mp_potion' | 'gold' | 'ruby';
  amount?: number;
  expiresAt: number;
  bornAt: number;
}

export interface FloatingDamage {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  bornAt: number;
}

export interface Creature {
  x: number;
  y: number;
  targetCoin: number | null;
  state: 'idle' | 'collecting' | 'resting';
  direction: Direction;
  animFrame: number;
  zzzFrame: number;
}

export interface AFKResult {
  goldEarned: number;
  rubyEarned: number;
  timeOffline: number;
  demonPenalty: number;
  show: boolean;
}

export interface GameState {
  player: Player;
  creature: Creature;
  pets: Pet[];
  coins: Coin[];
  chests: MapChest[];
  resources: Resources;
  totalCoins: number;
  chestOpened: boolean;
  currentMap: MapId;
  demons: Demon[];
  bosses: Boss[];
  quests: Quest[];
  walkingNPCs: WalkingNPC[];
  level: number;
  xp: number;
  xpPercent: number;
  afkResult: AFKResult | null;
  lastOnline: number;
  camera: Position;
  showPetMenu: boolean;
  showShop: boolean;
  showTeleport: boolean;
  showQuest: boolean;
  showBossMenu: boolean;
  showBag: boolean;
  showDarkMage: boolean;
  showMenu: boolean;
  cycleState: 'collecting' | 'resting';
  cycleTimer: number;
  cycleStartTime: number;
  isSnowing: boolean;
  snowTimer: number;
  questResetTimer: number;
  bossMapTimer: number;
  bossMapAvailable: boolean;
  bag: InventoryItem[];
  alerts: EventAlert[];
  petQuestRarityFilter: PetRarity | 'all';
  selectedDarkMagePet: string | null;
  showReport: boolean;
  events: GameEvent[];
  mobs: Mob[];
  projectiles: Projectile[];
  floatingDamages: FloatingDamage[];
  skills: SkillState[];
  selectedMobId: string | null;
  autoMode: boolean;
  groundItems: GroundItem[];
  /** % HP mínimo (0-100) para usar poção de vida automaticamente quando autoMode estiver ligado */
  autoHealThreshold: number;
  /** % MP mínimo (0-100) para usar poção de mana automaticamente quando autoMode estiver ligado */
  autoManaThreshold: number;
  /** Habilita auto consumo de poções (mostra/oculta painel rapidamente) */
  autoPotionEnabled: boolean;
}

export type GameEventType =
  | 'chest_opened' | 'demon_killed' | 'boss_killed' | 'pet_died' | 'pet_revived'
  | 'pet_acquired' | 'level_up' | 'teleport' | 'quest_claimed' | 'item_drop'
  | 'snow_started' | 'boss_spawned' | 'darkmage_arrived' | 'afk_return';

export interface GameEvent {
  id: string;
  type: GameEventType;
  message: string;
  icon: string;
  color: string;
  timestamp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  priceRuby: number;
  priceGold: number;
  priceCrystal: number;
  type: 'pet_chest' | 'planfy_egg' | 'send_zone' | 'rare_chest' | 'epic_chest' | 'legendary_chest';
}

export type InventoryItemType = 'teleport_scroll' | 'black_crystal' | 'hp_potion' | 'mp_potion';

export interface InventoryItem {
  id: InventoryItemType;
  name: string;
  icon: string;
  count: number;
}

export interface EventAlert {
  id: string;
  message: string;
  icon: string;
  expiresAt: number;
  color: string;
}
