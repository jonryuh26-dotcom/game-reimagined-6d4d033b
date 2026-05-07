import { useEffect, useState } from "react";
import {
  CLASSES, ClassDef, ClassId, PlayerProfile, STARTING_POINTS, saveProfile,
  ATTR_IDS, ATTR_META, AttrId, AttrMap, deriveStats,
} from "./classes";

interface Props {
  onConfirm: (profile: PlayerProfile) => void;
}

export default function ClassSelect({ onConfirm }: Props) {
  const [stage, setStage] = useState<"cinema" | "select">("cinema");
  const [selected, setSelected] = useState<ClassId>("titan");
  const [spent, setSpent] = useState<AttrMap>({
    str: 0, agi: 0, int: 0, vit: 0, dex: 0, luk: 0,
  });

  // Reset distributed points when changing class so the base bonuses always apply correctly.
  useEffect(() => {
    setSpent({ str: 0, agi: 0, int: 0, vit: 0, dex: 0, luk: 0 });
  }, [selected]);

  useEffect(() => {
    const t = setTimeout(() => setStage("select"), 4200);
    return () => clearTimeout(t);
  }, []);

  const used = ATTR_IDS.reduce((s, k) => s + spent[k], 0);
  const left = STARTING_POINTS - used;
  const cls = CLASSES.find((c) => c.id === selected)!;

  // Final attributes = class base + distributed points (live).
  const finalAttrs: AttrMap = ATTR_IDS.reduce(
    (acc, k) => ({ ...acc, [k]: cls.baseAttrs[k] + spent[k] }),
    {} as AttrMap,
  );
  const derived = deriveStats(selected, finalAttrs);

  const adjust = (k: AttrId, delta: number) => {
    setSpent((prev) => {
      const next = prev[k] + delta;
      if (next < 0) return prev;
      if (delta > 0 && left <= 0) return prev;
      return { ...prev, [k]: next };
    });
  };

  const confirm = () => {
    // Salva atributos no profile e também na chave de atributos para persistir entre sessões.
    const legacyStats = {
      hp: Math.round(derived.hp),
      mp: Math.round(derived.mp),
      atk: Math.round(derived.atk),
      def: Math.round(derived.def),
      spd: Math.round(derived.spd),
      crit: Math.round(derived.crit),
    };
    const profile: PlayerProfile = {
      classId: selected,
      stats: legacyStats,
      // Mantém o shape antigo para compat (preenche com zeros)
      spent: { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, crit: 0 },
      attrs: finalAttrs,
      attrSpent: { ...spent },
    };
    saveProfile(profile);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dragon-m-attrs-v1", JSON.stringify(finalAttrs));
    }
    onConfirm(profile);
  };

  if (stage === "cinema") return <Cinema onSkip={() => setStage("select")} />;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <NightBackdrop />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-8 md:py-10">
        <header className="mb-6 flex flex-col items-center gap-2 text-center animate-fade-in-up">
          <span className="font-oriental text-xs tracking-[0.6em] text-accent">DRAGON M ・ CAMINHO ESPIRITUAL</span>
          <h1 className="font-oriental text-4xl md:text-6xl text-gradient-gold">Escolha seu Caminho</h1>
          <p className="max-w-2xl text-sm md:text-base text-muted-foreground">
            “Antes de cruzar o portal de Dragon M, decida qual sangue corre em suas veias. Não há retorno.”
          </p>
          <div className="ink-divider mt-3 w-64" />
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          {CLASSES.map((c, i) => (
            <ClassCard
              key={c.id}
              cls={c}
              selected={selected === c.id}
              onSelect={() => setSelected(c.id)}
              delay={i * 90}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
          <ClassDetails cls={cls} derived={derived} />

          <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md shadow-[var(--shadow-elegant)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-oriental text-xs tracking-[0.4em] text-accent">力 ・ DISTRIBUIÇÃO</p>
                <h3 className="text-xl font-semibold">Pontos de Atributo</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Distribua {STARTING_POINTS} pontos entre os 6 atributos. Cada ponto altera HP/MP/ATK em tempo real.
                </p>
              </div>
              <div className="rounded-full border border-accent/40 bg-background/40 px-4 py-1.5 text-sm">
                <span className="text-muted-foreground">Restantes</span>{" "}
                <span className="font-oriental text-lg text-gradient-gold">{left}</span>
                <span className="text-muted-foreground"> / {STARTING_POINTS}</span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {ATTR_IDS.map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ATTR_META[k].icon}</span>
                    <div>
                      <div className="text-sm font-medium">
                        <span className="font-oriental text-accent mr-1">{ATTR_META[k].short}</span>
                        <span className="text-foreground/90">{ATTR_META[k].label}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Base <span className="text-foreground">{cls.baseAttrs[k]}</span>
                        {spent[k] > 0 && (
                          <span className="text-emerald-400"> +{spent[k]}</span>
                        )}
                        {" "}→ <span className="text-foreground font-semibold">{finalAttrs[k]}</span>{" "}
                        <span className="text-accent">({ATTR_META[k].desc})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjust(k, -1)}
                      className="h-7 w-7 rounded-md border border-border/60 bg-background/60 text-sm hover:bg-accent/20"
                    >
                      −
                    </button>
                    <div className="w-8 text-center font-oriental text-base">{spent[k]}</div>
                    <button
                      type="button"
                      onClick={() => adjust(k, 1)}
                      className="h-7 w-7 rounded-md border border-accent/50 bg-accent/15 text-sm hover:bg-accent/30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live derived stats preview */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border/40 bg-background/40 p-3">
              <DerivedStat label="HP"   value={Math.round(derived.hp)}   color="#ef4444" />
              <DerivedStat label="MP"   value={Math.round(derived.mp)}   color="#3b82f6" />
              <DerivedStat label="ATK"  value={Math.round(derived.atk)}  color="#fbbf24" />
              <DerivedStat label="DEF"  value={Math.round(derived.def)}  color="#a3a3a3" />
              <DerivedStat label="SPD"  value={Math.round(derived.spd * 10) / 10} color="#a78bfa" />
              <DerivedStat label="CRIT" value={`${Math.round(derived.crit * 10) / 10}%`} color="#22c55e" />
            </div>

            <button
              type="button"
              disabled={left > 0}
              onClick={confirm}
              className="mt-5 w-full rounded-xl border border-accent/60 bg-[var(--gradient-crimson)] px-5 py-3 font-oriental text-base tracking-[0.3em] text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-40 hover:translate-y-[-1px] hover:shadow-[var(--shadow-elegant)]"
            >
              {left > 0 ? `Distribua todos os ${left} pontos` : "ENTRAR EM DRAGON M ⛩"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function DerivedStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/50 bg-background/60 px-2 py-1.5">
      <span className="text-[10px] font-oriental tracking-[0.2em]" style={{ color }}>{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ClassCard({
  cls, selected, onSelect, delay,
}: { cls: ClassDef; selected: boolean; onSelect: () => void; delay: number }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition animate-fade-in-up ${
        selected
          ? "border-accent/80 bg-card/80 aura-gold animate-pulse-aura"
          : "border-border/60 bg-card/50 hover:border-accent/60 hover:-translate-y-1"
      }`}
    >
      <div
        className="absolute inset-0 opacity-25 transition group-hover:opacity-40"
        style={{ background: cls.gradient }}
      />
      <div className="relative">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-oriental text-3xl text-gradient-gold">{cls.kanji}</span>
          <span className="text-2xl">{cls.emoji}</span>
        </div>
        <div className="font-oriental text-[10px] tracking-[0.4em] text-accent">{cls.title.toUpperCase()}</div>
        <div className="mt-1 text-lg font-semibold">{cls.name}</div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{cls.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
          <Stat label="HP" v={cls.baseStats.hp} />
          <Stat label="ATK" v={cls.baseStats.atk} />
          <Stat label="DEF" v={cls.baseStats.def} />
          <Stat label="SPD" v={cls.baseStats.spd} />
        </div>
      </div>
    </button>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <span className="rounded border border-border/60 bg-background/50 px-1.5 py-0.5 font-oriental">
      <span className="text-muted-foreground">{label}</span>{" "}
      <span className="text-foreground">{v}</span>
    </span>
  );
}

function ClassDetails({ cls, derived }: { cls: ClassDef; derived: ReturnType<typeof deriveStats> }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md shadow-[var(--shadow-elegant)]">
      <div className="flex items-start gap-3">
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
          style={{ background: cls.gradient }}
        >
          {cls.emoji}
        </div>
        <div>
          <div className="font-oriental text-[11px] tracking-[0.4em] text-accent">{cls.title.toUpperCase()}</div>
          <h2 className="text-2xl font-semibold">{cls.name}</h2>
          <p className="text-sm text-muted-foreground">{cls.growth}</p>
          <p className="text-[10px] mt-0.5 font-oriental tracking-[0.3em] text-accent">
            {cls.combatKind === "ranged" ? "À DISTÂNCIA" : cls.combatKind === "hybrid" ? "HÍBRIDO" : "CORPO A CORPO"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{cls.description}</p>

      <div className="mt-4">
        <p className="font-oriental text-[11px] tracking-[0.4em] text-accent">技 ・ ÁRVORE DE SKILLS</p>
        <div className="mt-2 space-y-1.5">
          {cls.skills.map((s) => (
            <div key={s.level} className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-accent/50 bg-background/60 font-oriental text-xs text-accent">
                {s.level}
              </span>
              <div className="text-sm">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs">
        <span className="font-oriental tracking-[0.3em] text-accent">ESPÍRITO DRACÔNICO</span>
        <p className="mt-1 text-foreground/90">{cls.spirit}</p>
      </div>
    </section>
  );
}

function Cinema({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <NightBackdrop intense />
      <div className="absolute inset-x-0 top-[14%] animate-dragon">
        <div className="text-7xl drop-shadow-[0_0_30px_oklch(0.6_0.25_25/0.6)]">🐉</div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[42%]">
        <SilhouetteCity />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in-up">
          <p className="font-oriental text-xs tracking-[0.6em] text-accent">RYŪZEN ・ ANO 1287</p>
          <h1 className="mt-4 font-oriental text-5xl md:text-7xl text-gradient-gold drop-shadow">
            龍 の 道
          </h1>
          <p className="mt-2 text-2xl md:text-3xl font-oriental text-gradient-crimson">
            O Caminho dos Dragões
          </p>
          <p className="mx-auto mt-6 max-w-xl text-sm md:text-base text-muted-foreground">
            “Os dragões antigos despertaram. As cinco terras tremem. Apenas um discípulo de espírito puro
            poderá atravessar o portal e enfrentar o Imperador Dragão.”
          </p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="mt-10 rounded-full border border-accent/50 bg-background/40 px-6 py-2 text-xs tracking-[0.4em] text-accent backdrop-blur transition hover:bg-accent/15"
        >
          PULAR ▸
        </button>
      </div>
    </div>
  );
}

function SilhouetteCity() {
  return (
    <svg viewBox="0 0 1200 400" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="city" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.1 0.03 270)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="oklch(0.05 0.02 270)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        fill="url(#city)"
        d="M0,400 L0,260 L60,260 L80,230 L120,230 L140,200 L180,200 L210,170 L260,170 L260,260 L320,260 L340,210 L380,210 L380,170 L430,150 L470,170 L470,260 L540,260 L560,220 L610,220 L640,180 L690,180 L710,210 L760,210 L760,260 L830,260 L860,230 L910,230 L940,200 L990,200 L1010,170 L1060,170 L1060,260 L1140,260 L1160,240 L1200,240 L1200,400 Z"
      />
      {[120, 380, 720, 1010].map((x, i) => (
        <g key={i} className="animate-lantern" style={{ transformOrigin: `${x}px 100px` }}>
          <line x1={x} y1={80} x2={x} y2={140} stroke="oklch(0.4 0.05 30)" strokeWidth={1} />
          <ellipse cx={x} cy={150} rx={10} ry={14} fill="oklch(0.7 0.22 28)" opacity="0.85" />
          <circle cx={x} cy={150} r={18} fill="oklch(0.7 0.22 28)" opacity="0.18" />
        </g>
      ))}
    </svg>
  );
}

function NightBackdrop({ intense = false }: { intense?: boolean }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: "var(--gradient-night)" }} />
      <div className="pointer-events-none absolute right-[8%] top-[8%] h-48 w-48 rounded-full bg-[oklch(0.95_0.04_90)] opacity-90 blur-[1px]" style={{ boxShadow: "0 0 80px 20px oklch(0.9 0.08 80 / 0.35)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-60 animate-mist" style={{ background: "radial-gradient(ellipse at 30% 70%, oklch(0.8 0.05 200 / 0.18), transparent 60%), radial-gradient(ellipse at 70% 40%, oklch(0.7 0.1 280 / 0.15), transparent 60%)" }} />
      {intense && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute bottom-0 block h-1.5 w-1.5 rounded-full bg-[oklch(0.75_0.22_40)]"
              style={{
                left: `${(i * 37) % 100}%`,
                animation: `ember-rise ${8 + (i % 6)}s linear ${(i * 0.3) % 5}s infinite`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
