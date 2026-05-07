import { lazy, Suspense, useEffect, useState } from "react";
import ClassSelect from "./ClassSelect";
import { PlayerProfile, loadProfile } from "./classes";

const GameCanvas = lazy(() => import("./GameCanvas"));

export default function GameClient() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    setMounted(true);
    setProfile(loadProfile());
  }, []);

  const Loader = ({ text }: { text: string }) => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b0820] via-[#1a0b2e] to-black text-amber-200 gap-4">
      <div className="text-3xl font-bold tracking-wider drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]">Dragon M</div>
      <div className="flex items-center gap-2 text-sm text-amber-100/80">
        <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
        {text}
      </div>
    </div>
  );

  if (!mounted) return <Loader text="Invocando o mundo de Dragon M..." />;

  if (!profile) return <ClassSelect onConfirm={setProfile} />;

  return (
    <Suspense fallback={<Loader text="Atravessando o portal de Dragon M..." />}>
      <GameCanvas />
    </Suspense>
  );
}
