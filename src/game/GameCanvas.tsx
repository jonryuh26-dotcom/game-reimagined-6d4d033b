import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameEngine } from './useGameEngine';
import { drawPlayer, drawCoin, drawCreature, drawPet, drawChest, drawInteractionPrompt, drawCollectEffect, drawDemon, drawWalkingNPC, drawBoss, drawSnow } from './renderer';
import { drawMob, MobAnimState, MobVisualKind, MobFacing } from './mobRenderer';
import { MAPS, MAP_WIDTH, MAP_HEIGHT, mapDims, DEMON_SPAWN_INTERVAL, SKILL_DEFS } from './mapData';
import { buildMaskFromImage } from './collisionMask';
import GameUI from './GameUI';
import Joystick from './Joystick';
import Minimap from './Minimap';
import CombatHUD from './CombatHUD';

function distPos(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImgsRef = useRef<Record<string, HTMLImageElement>>({});
  const mapLoadedRef = useRef<Record<string, boolean>>({});
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const vw = size.w;
  const vh = size.h;
  const scale = Math.max(vw / MAP_WIDTH, vh / MAP_HEIGHT) * 1.8;
  const viewW = vw / scale;
  const viewH = vh / scale;

  const {
    gameState, setTarget, interactWithChest, collectEffects,
    teleportToMap, toggleUI, buyPetChest, buyChestType, buyPlanfyEgg, assignPetToMap,
    claimQuest, dismissAFK, revivePet, useTeleportScroll, darkMageSendPet, selectDarkMagePet, setPetFilter,
    clearEvents, openEgg, tradeFragments, buyBonusSkill,
    selectMob, toggleAutoMode, setJoystick, useSkill, usePotion,
    setAutoHealThreshold, setAutoManaThreshold, toggleAutoPotion,
    refreshPlayerStats,
    nextDemonSpawnRef,
  } = useGameEngine(viewW, viewH);

  useEffect(() => {
    Object.values(MAPS).forEach(mapConfig => {
      if (!mapImgsRef.current[mapConfig.id]) {
        const img = new Image();
        
        const finalize = () => {
          mapImgsRef.current[mapConfig.id] = img;
          mapLoadedRef.current[mapConfig.id] = true;
          buildMaskFromImage(mapConfig.id, img);
        };
        img.onload = finalize;
        img.src = mapConfig.image;
        if (img.complete && img.naturalWidth > 0) finalize();
      }
    });
  }, []);

  const handleCanvasTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (gameState.showPetMenu || gameState.showShop || gameState.showTeleport || gameState.showQuest || gameState.showBossMenu || gameState.showBag || gameState.showDarkMage || gameState.showReport || gameState.afkResult?.show) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    } else { clientX = e.clientX; clientY = e.clientY; }

    const rect = canvas.getBoundingClientRect();
    const mapX = gameState.camera.x + (clientX - rect.left) / scale;
    const mapY = gameState.camera.y + (clientY - rect.top) / scale;

    // Mob selection (priority)
    let mobHit: typeof gameState.mobs[0] | undefined;
    let mobBest = 40;
    gameState.mobs.forEach(m => {
      if (!m.alive || m.mapId !== gameState.currentMap) return;
      const d = distPos({ x: mapX, y: mapY }, m);
      if (d < mobBest) { mobBest = d; mobHit = m; }
    });
    if (mobHit) {
      selectMob(mobHit.id);
      return;
    }

    // Stair interaction
    const stairs = MAPS[gameState.currentMap].stairs ?? [];
    for (const st of stairs) {
      if (distPos({ x: mapX, y: mapY }, st) < 40) {
        teleportToMap(st.targetMap);
        return;
      }
    }

    // Chest interaction
    for (let i = 0; i < gameState.chests.length; i++) {
      if (!gameState.chests[i].opened && distPos({ x: mapX, y: mapY }, gameState.chests[i]) < 30) {
        interactWithChest(i); return;
      }
    }

    // NPC interaction (dark mage abre menu específico)
    for (const npc of gameState.walkingNPCs) {
      if (distPos({ x: mapX, y: mapY }, npc) < 30) {
        if (npc.isDarkMage) toggleUI('showDarkMage');
        else toggleUI('showQuest');
        return;
      }
    }

    setTarget({ x: mapX, y: mapY });
    selectMob(null);
  }, [gameState, scale, setTarget, interactWithChest, toggleUI, selectMob, teleportToMap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    const render = (time: number) => {
      canvas.width = vw; canvas.height = vh;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, vw, vh);
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(-gameState.camera.x, -gameState.camera.y);

      const currentMapId = gameState.currentMap;
      const mapImg = mapImgsRef.current[currentMapId];
      const dims = mapDims(currentMapId);
      // Mapas grandes (vila e subterrâneos) usam smoothing pra não ficar pixel quebrado quando esticados
      const smoothMaps = currentMapId === 'village' || currentMapId.startsWith('underground_');
      if (mapLoadedRef.current[currentMapId] && mapImg) {
        if (smoothMaps) ctx.imageSmoothingEnabled = true;
        ctx.drawImage(mapImg, 0, 0, dims.w, dims.h);
        ctx.imageSmoothingEnabled = false;
      } else {
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 0, dims.w, dims.h);
      }

      const cam = { x: 0, y: 0 };

      gameState.coins.forEach(coin => drawCoin(ctx, coin, cam, time));
      gameState.chests.forEach(chest => drawChest(ctx, chest, cam, time));
      // Stairs
      (MAPS[currentMapId].stairs ?? []).forEach(st => {
        const pulse = 0.6 + Math.sin(time * 0.005) * 0.3;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(st.x, st.y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = 'bold 20px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪜', st.x, st.y + 7);
        if (distPos(gameState.player, st) < 80) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(st.label, st.x, st.y - 22);
        }
        ctx.restore();
      });
      gameState.chests.forEach((chest, i) => {
        if (!chest.opened && distPos(gameState.player, chest) < 50) {
          drawInteractionPrompt(ctx, chest.x, chest.y, cam, time, 'ABRIR');
        }
      });

      // Walking NPCs
      gameState.walkingNPCs.forEach(npc => {
        drawWalkingNPC(ctx, npc, cam, time);
        if (distPos(gameState.player, npc) < 60) {
          drawInteractionPrompt(ctx, npc.x, npc.y, cam, time, 'QUEST');
        }
      });

      // creature inicial removida — não há mais pet inicial do baú

      gameState.pets.forEach(pet => {
        if (pet.assignedMap === currentMapId && pet.state !== 'idle') drawPet(ctx, pet, cam, time);
      });

      gameState.demons.forEach(demon => { if (demon.mapId === currentMapId) drawDemon(ctx, demon, cam, time); });
      gameState.bosses.forEach(boss => { if (boss.mapId === currentMapId) drawBoss(ctx, boss, cam, time); });

      // Mobs (Saibaman sprite renderer)
      gameState.mobs.forEach(mob => {
        if (!mob.alive || mob.mapId !== currentMapId) return;
        const isSel = mob.id === gameState.selectedMobId;
        ctx.save();
        if (isSel) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          const r = 22 + Math.sin(time * 0.008) * 2;
          ctx.beginPath(); ctx.ellipse(mob.x, mob.y + 8, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
        }
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(mob.x, mob.y + 10, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        const sDir: MobFacing = (mob.direction as MobFacing) ?? 'down';
        const stateMap: Record<string, MobAnimState> = { idle: 'idle', walk: 'walk', attack: 'attack', skill: 'skill', hit: 'hit', death: 'death' };
        const sState: MobAnimState = stateMap[mob.state] ?? 'idle';
        drawMob(ctx, mob.x, mob.y, sState, mob.variant as MobVisualKind, mob.animFrame, sDir, mob.hp / mob.maxHp);
        // HP bar
        const barW = 26;
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(mob.x - barW / 2, mob.y - 28, barW, 3);
        ctx.fillStyle = mob.hp / mob.maxHp > 0.5 ? '#22c55e' : mob.hp / mob.maxHp > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(mob.x - barW / 2, mob.y - 28, (mob.hp / mob.maxHp) * barW, 3);
        // Difficulty colored name + level
        const diff = mob.level - gameState.level;
        const nameColor =
          diff <= -8 ? '#9ca3af' :
          diff <= -3 ? '#fde047' :
          diff <= 2  ? '#ffffff' :
          diff <= 6  ? '#ef4444' :
                       '#a855f7';
        ctx.fillStyle = nameColor;
        ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        const label = `${mob.name} Lv.${mob.level}`;
        ctx.strokeText(label, mob.x, mob.y - 32);
        ctx.fillText(label, mob.x, mob.y - 32);
        ctx.restore();
      });

      // Ground items (potions, gold, ruby)
      gameState.groundItems.forEach(gi => {
        if (gi.mapId !== currentMapId) return;
        const bob = Math.sin(time * 0.005 + gi.x) * 2;
        ctx.save();
        const isEgg = gi.kind.startsWith('egg_');
        const eggColor =
          gi.kind === 'egg_common' ? '#e5e7eb' :
          gi.kind === 'egg_rare' ? '#22c55e' :
          gi.kind === 'egg_magic' ? '#3b82f6' :
          gi.kind === 'egg_epic' ? '#a855f7' :
          gi.kind === 'egg_legendary' ? '#ef4444' :
          gi.kind === 'egg_mythic' ? '#fbbf24' : '#fff';
        const color = isEgg ? eggColor : (gi.kind === 'hp_potion' ? '#ef4444' : gi.kind === 'mp_potion' ? '#3b82f6' : gi.kind === 'gold' ? '#fbbf24' : '#ef4444');
        if (isEgg) {
          const pulse = 0.4 + Math.sin(time * 0.005) * 0.25;
          ctx.globalAlpha = pulse;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(gi.x, gi.y + bob, 16, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.shadowColor = color;
        ctx.shadowBlur = isEgg ? 16 : 10;
        ctx.font = isEgg ? '20px serif' : '16px serif';
        ctx.textAlign = 'center';
        const icon = isEgg ? '🥚' : (gi.kind === 'hp_potion' ? '🧪' : gi.kind === 'mp_potion' ? '💧' : gi.kind === 'gold' ? '🪙' : '💎');
        ctx.fillText(icon, gi.x, gi.y + bob);
        ctx.restore();
      });

      gameState.projectiles.forEach(p => {
        const def = SKILL_DEFS[p.skill];
        ctx.save();
        ctx.shadowColor = def.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = def.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Floating damage numbers
      const tNow = Date.now();
      gameState.floatingDamages.forEach(f => {
        const age = tNow - f.bornAt;
        const prog = age / 900;
        if (prog >= 1) return;
        ctx.save();
        ctx.globalAlpha = 1 - prog;
        ctx.fillStyle = f.color;
        ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.strokeText(f.text, f.x, f.y - prog * 24);
        ctx.fillText(f.text, f.x, f.y - prog * 24);
        ctx.restore();
      });

      drawPlayer(ctx, gameState.player, cam, time);

      if (gameState.player.moving && gameState.player.targetX !== undefined) {
        const tx = gameState.player.targetX;
        const ty = gameState.player.targetY!;
        const pulse = Math.sin(time * 0.008) * 2 + 4;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(tx, ty, pulse, 0, Math.PI * 2); ctx.stroke();
      }

      collectEffects.current.forEach(effect => {
        const progress = (time - effect.startTime) / 800;
        if (progress < 1) drawCollectEffect(ctx, effect.x, effect.y, cam, progress, effect.text);
      });

      ctx.restore();

      // Snow overlay (outside transform)
      if (gameState.isSnowing) {
        drawSnow(ctx, vw, vh, time);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, vw, vh, scale, collectEffects]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} width={vw} height={vh} className="block" onTouchStart={handleCanvasTap} onClick={handleCanvasTap} />
      <GameUI
        state={gameState}
        onTogglePetMenu={() => toggleUI('showPetMenu')}
        onToggleShop={() => toggleUI('showShop')}
        onToggleTeleport={() => toggleUI('showTeleport')}
        onToggleQuest={() => toggleUI('showQuest')}
        onToggleBossMenu={() => toggleUI('showBossMenu')}
        onToggleBag={() => toggleUI('showBag')}
        onToggleDarkMage={() => toggleUI('showDarkMage')}
        onToggleReport={() => toggleUI('showReport')}
        onToggleMenu={() => toggleUI('showMenu')}
        onTeleport={teleportToMap}
        onBuyPetChest={buyPetChest}
        onBuyChestType={buyChestType}
        onBuyPlanfyEgg={buyPlanfyEgg}
        onAssignPet={assignPetToMap}
        onClaimQuest={claimQuest}
        onDismissAFK={dismissAFK}
        onRevivePet={revivePet}
        onUseTeleportScroll={useTeleportScroll}
        onDarkMageSendPet={darkMageSendPet}
        onSelectDarkMagePet={selectDarkMagePet}
        onSetPetFilter={setPetFilter}
        onClearEvents={clearEvents}
        onOpenEgg={openEgg}
        onTradeFragments={tradeFragments}
        nextDemonSpawnAt={nextDemonSpawnRef.current + DEMON_SPAWN_INTERVAL}
        onRefreshStats={refreshPlayerStats}
      />
      <CombatHUD
        state={gameState}
        onUseSkill={useSkill}
        onToggleAuto={toggleAutoMode}
        onUsePotion={usePotion}
        onOpenMenu={() => toggleUI('showMenu')}
        onSetAutoHeal={setAutoHealThreshold}
        onSetAutoMana={setAutoManaThreshold}
        onToggleAutoPotion={toggleAutoPotion}
      />
      <Joystick onMove={(dx, dy) => setJoystick(dx, dy)} />
      <div className="fixed top-2 right-2 z-30">
        <Minimap state={gameState} />
      </div>
      {gameState.chests.some((c) => !c.opened && distPos(gameState.player, c) < 50) && (
        <button
          type="button"
          className="fixed bottom-20 right-3 w-14 h-14 bg-amber-500/90 backdrop-blur-sm border-2 border-amber-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 select-none animate-pulse z-30"
          onClick={(e) => { e.stopPropagation(); const idx = gameState.chests.findIndex((c) => !c.opened && distPos(gameState.player, c) < 50); if (idx >= 0) interactWithChest(idx); }}
          style={{ color: '#78350f' }}
        >
          <span className="text-xs font-bold">ABRIR</span>
        </button>
      )}
    </div>
  );
}
