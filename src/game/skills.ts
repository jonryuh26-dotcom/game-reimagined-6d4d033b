import type { ClassId } from './classes';

export interface SkillDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  manaCost: number;
  cooldown: number;
  damageMin: number;
  damageMax: number;
  range: number;
  aoeRadius: number;
  unlockLevel: number;
  desc: string;
}

export const CLASS_SKILLS: Record<ClassId, SkillDef[]> = {
  tanker: [
    { id: 'tk_smash',  name: 'Impacto do Dragão', icon: '🛡️', color: '#60a5fa', manaCost: 25, cooldown: 1500, damageMin: 180, damageMax: 260, range: 90,  aoeRadius: 0,   unlockLevel: 1,  desc: 'Golpe sísmico em alvo próximo.' },
    { id: 'tk_shield', name: 'Escudo Espiritual', icon: '✨', color: '#93c5fd', manaCost: 60, cooldown: 8000, damageMin: 0,   damageMax: 0,   range: 0,   aoeRadius: 0,   unlockLevel: 10, desc: 'Cura instantânea (40% HP).' },
    { id: 'tk_roar',   name: 'Rugido Ancestral',  icon: '📣', color: '#fbbf24', manaCost: 70, cooldown: 6000, damageMin: 220, damageMax: 320, range: 0,   aoeRadius: 160, unlockLevel: 20, desc: 'Provoca e fere inimigos em volta.' },
    { id: 'tk_wall',   name: 'Muralha do Imperador', icon: '🏯', color: '#fde68a', manaCost: 120, cooldown: 12000, damageMin: 400, damageMax: 600, range: 0, aoeRadius: 200, unlockLevel: 30, desc: 'Onda imperial em larga área.' },
  ],
  dagger: [
    { id: 'dg_slash', name: 'Corte Fantasma', icon: '🗡️', color: '#c084fc', manaCost: 18, cooldown: 700,  damageMin: 140, damageMax: 220, range: 70,  aoeRadius: 0,  unlockLevel: 1,  desc: 'Dois cortes rápidos.' },
    { id: 'dg_rain',  name: 'Chuva de Flechas', icon: '🏹', color: '#a78bfa', manaCost: 55, cooldown: 4000, damageMin: 160, damageMax: 240, range: 0, aoeRadius: 150, unlockLevel: 10, desc: 'Cobre a área com flechas espirituais.' },
    { id: 'dg_step',  name: 'Passo Sombrio',   icon: '👤', color: '#7c3aed', manaCost: 40, cooldown: 3500, damageMin: 380, damageMax: 520, range: 280, aoeRadius: 0, unlockLevel: 20, desc: 'Salta atrás do alvo, crítico garantido.' },
    { id: 'dg_thousand', name: 'Mil Cortes',   icon: '⚔️', color: '#e879f9', manaCost: 110, cooldown: 11000, damageMin: 680, damageMax: 980, range: 90, aoeRadius: 0, unlockLevel: 30, desc: 'Rajada de 12 golpes em um alvo.' },
  ],
  darkmage: [
    { id: 'dm_orb',     name: 'Bola Sombria',    icon: '🌑', color: '#a855f7', manaCost: 30, cooldown: 1500, damageMin: 240, damageMax: 360, range: 340, aoeRadius: 0,   unlockLevel: 1,  desc: 'Projétil amaldiçoado.' },
    { id: 'dm_chains',  name: 'Prisão das Almas', icon: '⛓️', color: '#6d28d9', manaCost: 50, cooldown: 4000, damageMin: 200, damageMax: 280, range: 320, aoeRadius: 0,   unlockLevel: 10, desc: 'Imobiliza e dilacera o alvo.' },
    { id: 'dm_storm',   name: 'Tempestade Negra', icon: '🌀', color: '#7e22ce', manaCost: 80, cooldown: 5500, damageMin: 280, damageMax: 420, range: 0, aoeRadius: 200, unlockLevel: 20, desc: 'Raios sombrios em larga área.' },
    { id: 'dm_eclipse', name: 'Dragão do Eclipse', icon: '🐲', color: '#000000', manaCost: 160, cooldown: 14000, damageMin: 900, damageMax: 1300, range: 0, aoeRadius: 260, unlockLevel: 30, desc: 'Invoca um dragão de escuridão pura.' },
  ],
  titan: [
    { id: 'tt_punch',   name: 'Punho Titânico',  icon: '👊', color: '#f97316', manaCost: 22, cooldown: 1200, damageMin: 260, damageMax: 380, range: 80,  aoeRadius: 0,  unlockLevel: 1,  desc: 'Soco que abala o chão.' },
    { id: 'tt_burst',   name: 'Explosão Dracônica', icon: '💥', color: '#ef4444', manaCost: 60, cooldown: 4500, damageMin: 320, damageMax: 460, range: 0, aoeRadius: 140, unlockLevel: 10, desc: 'Aura vermelha explode ao redor.' },
    { id: 'tt_berserk', name: 'Forma Berserk',   icon: '🔥', color: '#dc2626', manaCost: 90, cooldown: 9000, damageMin: 480, damageMax: 720, range: 100, aoeRadius: 0, unlockLevel: 20, desc: 'Golpe brutal com fúria de dragão.' },
    { id: 'tt_meteor',  name: 'Queda Celestial', icon: '☄️', color: '#fb923c', manaCost: 150, cooldown: 13000, damageMin: 950, damageMax: 1400, range: 360, aoeRadius: 200, unlockLevel: 30, desc: 'Cai do céu como meteoro vermelho.' },
  ],
};

export const BONUS_AOE_SKILL: SkillDef = {
  id: 'bonus_nova', name: 'Nova Cristalina', icon: '💠', color: '#22d3ee',
  manaCost: 90, cooldown: 8000, damageMin: 500, damageMax: 800, range: 0, aoeRadius: 220,
  unlockLevel: 1, desc: 'Explosão arcana de cristal em larga área (Bônus de Loja).',
};

export const SKILL_BY_ID: Record<string, SkillDef> = {
  ...Object.fromEntries(Object.values(CLASS_SKILLS).flat().map((s) => [s.id, s])),
  [BONUS_AOE_SKILL.id]: BONUS_AOE_SKILL,
};

export function getClassSkills(classId: ClassId, level: number): SkillDef[] {
  return CLASS_SKILLS[classId].filter((s) => s.unlockLevel <= level);
}
