export type ClassId = "tanker" | "dagger" | "darkmage" | "titan";

export type AttrId = "str" | "agi" | "int" | "vit" | "dex" | "luk";

export const ATTR_IDS: AttrId[] = ["str", "agi", "int", "vit", "dex", "luk"];

export const ATTR_META: Record<AttrId, { label: string; short: string; icon: string; desc: string }> = {
  str: { label: "Força",        short: "STR", icon: "💪", desc: "+ATK físico" },
  agi: { label: "Agilidade",    short: "AGI", icon: "🌬️", desc: "+velocidade" },
  int: { label: "Inteligência", short: "INT", icon: "🔮", desc: "+ATK mágico, +MP" },
  vit: { label: "Vitalidade",   short: "VIT", icon: "❤️", desc: "+HP máximo" },
  dex: { label: "Destreza",     short: "DEX", icon: "🎯", desc: "+chance crítico" },
  luk: { label: "Sorte",        short: "LUK", icon: "🍀", desc: "+drops e crítico" },
};

export type AttrMap = Record<AttrId, number>;

export interface ClassDerived {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
}

export type RangedKind = "melee" | "ranged" | "hybrid";

export interface ClassDef {
  id: ClassId;
  name: string;
  title: string;
  kanji: string;
  emoji: string;
  tagline: string;
  description: string;
  gradient: string;
  accent: string;
  baseStats: { hp: number; mp: number; atk: number; def: number; spd: number; crit: number };
  baseAttrs: AttrMap;
  combatKind: RangedKind;
  growth: string;
  skills: { level: number; name: string; desc: string }[];
  spirit: string;
}

export const CLASSES: ClassDef[] = [
  {
    id: "tanker",
    name: "Guardião Dracônico",
    title: "Tanker",
    kanji: "守",
    emoji: "🛡️",
    tagline: "A muralha que nem o céu derruba.",
    description:
      "Veste a armadura imperial e empunha a espada-martelo do clã da pedra. Onde ele crava os pés, o exército do Imperador descansa.",
    gradient: "var(--gradient-storm)",
    accent: "oklch(0.7 0.15 230)",
    baseStats: { hp: 220, mp: 40, atk: 18, def: 28, spd: 6, crit: 4 },
    baseAttrs: { str: 12, agi: 5, int: 3, vit: 14, dex: 4, luk: 4 },
    combatKind: "melee",
    growth: "HP altíssimo • Defesa absurda • Dano médio",
    skills: [
      { level: 1, name: "Impacto do Dragão", desc: "Golpe sísmico que atordoa." },
      { level: 10, name: "Escudo Espiritual", desc: "Barreira que absorve dano por 6s." },
      { level: 20, name: "Rugido Ancestral", desc: "Provoca inimigos e reduz defesa deles." },
      { level: 30, name: "Muralha do Imperador", desc: "Imune por 3s e reflete 50% do dano." },
    ],
    spirit: "Dragão de Pedra — desperta como uma muralha viva.",
  },
  {
    id: "dagger",
    name: "Sombra da Lua",
    title: "Dagger & Arch",
    kanji: "影",
    emoji: "🗡️",
    tagline: "O corte chega antes do som.",
    description:
      "Discípulo do clã da Lua, mistura adagas envenenadas e arco sombrio. Movimenta-se entre folhas como se fosse uma delas.",
    gradient: "var(--gradient-shadow)",
    accent: "oklch(0.78 0.15 290)",
    baseStats: { hp: 130, mp: 60, atk: 22, def: 10, spd: 18, crit: 22 },
    baseAttrs: { str: 8, agi: 14, int: 5, vit: 6, dex: 12, luk: 8 },
    combatKind: "hybrid",
    growth: "Velocidade extrema • Crítico alto • Defesa frágil",
    skills: [
      { level: 1, name: "Corte Fantasma", desc: "Dois cortes rápidos com chance de sangrar." },
      { level: 10, name: "Chuva de Flechas", desc: "Cobre uma área com flechas espirituais." },
      { level: 20, name: "Passo Sombrio", desc: "Teleporta atrás do inimigo com crítico garantido." },
      { level: 30, name: "Mil Cortes", desc: "Rajada de 12 golpes em um único alvo." },
    ],
    spirit: "Dragão das Sombras — invisível, letal, eterno.",
  },
  {
    id: "darkmage",
    name: "Discípulo do Vazio",
    title: "Mago Negro",
    kanji: "闇",
    emoji: "🌑",
    tagline: "Da escuridão, nasce a tempestade.",
    description:
      "Estudou os pergaminhos proibidos do Templo do Vazio. Conjura magia amaldiçoada que precisa de tempo de canalização para explodir.",
    gradient: "var(--gradient-shadow)",
    accent: "oklch(0.65 0.2 320)",
    baseStats: { hp: 110, mp: 180, atk: 26, def: 6, spd: 10, crit: 14 },
    baseAttrs: { str: 3, agi: 6, int: 16, vit: 5, dex: 9, luk: 7 },
    combatKind: "ranged",
    growth: "Dano mágico massivo • Mana alta • Muito frágil",
    skills: [
      { level: 1, name: "Bola Sombria", desc: "Projétil de energia amaldiçoada." },
      { level: 10, name: "Prisão das Almas", desc: "Imobiliza o inimigo em correntes negras." },
      { level: 20, name: "Tempestade Negra", desc: "Chuva de raios sombrios em área." },
      { level: 30, name: "Dragão do Eclipse", desc: "Invoca um dragão de pura escuridão." },
    ],
    spirit: "Dragão do Eclipse — devorador de luz.",
  },
  {
    id: "titan",
    name: "Filho do Dragão",
    title: "Titan",
    kanji: "龍",
    emoji: "🐉",
    tagline: "Sangue de dragão, punho de montanha.",
    description:
      "Raro guerreiro nascido com aura dracônica vermelha. Cada golpe é lento, mas reduz o inimigo a cinzas.",
    gradient: "var(--gradient-crimson)",
    accent: "oklch(0.68 0.22 30)",
    baseStats: { hp: 180, mp: 80, atk: 32, def: 16, spd: 8, crit: 12 },
    baseAttrs: { str: 16, agi: 4, int: 4, vit: 11, dex: 6, luk: 5 },
    combatKind: "melee",
    growth: "Dano altíssimo • Ataque lento • HP médio-alto",
    skills: [
      { level: 1, name: "Punho Titânico", desc: "Soco que abala o chão à frente." },
      { level: 10, name: "Explosão Dracônica", desc: "Aura vermelha explode ao redor." },
      { level: 20, name: "Forma Berserk", desc: "Dobra o ataque e reduz a defesa." },
      { level: 30, name: "Queda do Dragão Celestial", desc: "Cai do céu como um meteoro vermelho." },
    ],
    spirit: "Dragão Vermelho — fúria da montanha em chamas.",
  },
];

export interface PlayerProfile {
  classId: ClassId;
  stats: { hp: number; mp: number; atk: number; def: number; spd: number; crit: number };
  spent: { hp: number; mp: number; atk: number; def: number; spd: number; crit: number };
  attrs?: AttrMap;       // STR/AGI/INT/VIT/DEX/LUK final (base + spent)
  attrSpent?: AttrMap;   // points spent at character creation
}

export const STARTING_POINTS = 20;

const STORAGE_KEY = "ryuzen-profile-v1";

export function loadProfile(): PlayerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlayerProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: PlayerProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getClass(id: ClassId): ClassDef {
  return CLASSES.find((c) => c.id === id)!;
}

/** Retorna os atributos finais do personagem (base da classe + pontos distribuídos). */
export function getProfileAttrs(p: PlayerProfile | null): AttrMap | null {
  if (!p) return null;
  if (p.attrs) return p.attrs;
  const base = getClass(p.classId).baseAttrs;
  return { ...base };
}

/** Deriva HP/MP/ATK/DEF/SPD/CRIT a partir dos atributos da classe. */
export function deriveStats(classId: ClassId, attrs: AttrMap): ClassDerived {
  const cls = getClass(classId);
  const isCaster = cls.combatKind === "ranged";
  const atkAttr = isCaster ? attrs.int : attrs.str;
  return {
    hp:   80 + attrs.vit * 14 + (cls.combatKind === "melee" ? 40 : 0),
    mp:   20 + attrs.int * 9  + (isCaster ? 30 : 0),
    atk:  6  + atkAttr * 2.2,
    def:  3  + attrs.vit * 0.6 + attrs.str * 0.3,
    spd:  4  + attrs.agi * 0.18,
    crit: 3  + attrs.dex * 0.7 + attrs.luk * 0.4,
  };
}
