// Attribute system unified with class profile (str/agi/int/vit/dex/luk).
import { AttrId, AttrMap, ATTR_META, deriveStats, getProfileAttrs, loadProfile, saveProfile, getClass } from './classes';

export type AttrKey = AttrId;

export interface AttrState {
  // current totals (base class + spent points), persisted on profile
  values: AttrMap;
  // points unspent (gained from leveling)
  unspent: number;
  // last level processed for granting points
  lastLevel: number;
}

const META_KEY = 'ryuzen-attrs-meta-v2';

export const ATTR_LABELS = ATTR_META;

const POINTS_PER_LEVEL = 3;

function defaultMeta(level: number) {
  return { unspent: 0, lastLevel: Math.max(1, level) };
}

function loadMeta(level: number): { unspent: number; lastLevel: number } {
  if (typeof window === 'undefined') return defaultMeta(level);
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { unspent: number; lastLevel: number };
      return { unspent: parsed.unspent ?? 0, lastLevel: parsed.lastLevel ?? Math.max(1, level) };
    }
  } catch {}
  return defaultMeta(level);
}

function saveMeta(meta: { unspent: number; lastLevel: number }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/** Load current attribute state (totals from profile + meta points). */
export function loadAttrState(level: number): AttrState {
  const profile = loadProfile();
  const values = (getProfileAttrs(profile) ?? { str: 0, agi: 0, int: 0, vit: 0, dex: 0, luk: 0 }) as AttrMap;
  const meta = loadMeta(level);
  return { values: { ...values }, unspent: meta.unspent, lastLevel: meta.lastLevel };
}

/** Grant unspent points when level rises (3 per level). */
export function syncWithLevel(state: AttrState, level: number): AttrState {
  if (level <= state.lastLevel) return state;
  const gained = (level - state.lastLevel) * POINTS_PER_LEVEL;
  const next = { ...state, unspent: state.unspent + gained, lastLevel: level };
  saveMeta({ unspent: next.unspent, lastLevel: next.lastLevel });
  return next;
}

/** Persist final state into profile + meta and recompute derived stats. */
export function commitAttrState(state: AttrState) {
  const profile = loadProfile();
  if (!profile) return null;
  const updated = { ...profile, attrs: { ...state.values } };
  saveProfile(updated);
  saveMeta({ unspent: state.unspent, lastLevel: state.lastLevel });
  const derived = deriveStats(profile.classId, state.values);
  return derived;
}

export { deriveStats, getClass };
