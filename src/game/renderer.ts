import { Coin, Creature, Player, Pet, MapChest, Demon, WalkingNPC, Boss } from './types';
import { RARITY_COLORS } from './mapData';
import { drawAvatar } from './avatar';

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, camera: { x: number; y: number }, time = 0) {
  const sx = player.x - camera.x;
  const sy = player.y - camera.y;
  drawAvatar(ctx, sx, sy, player.direction, player.moving, player.animFrame, time);
}

export function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin, camera: { x: number; y: number }, time: number) {
  if (coin.collected) return;
  const sx = coin.x - camera.x;
  const sy = coin.y - camera.y;
  const sparkle = Math.sin(time * 0.005 + coin.id) * 0.3 + 0.7;
  ctx.save();
  const main = coin.isRuby ? '#ef4444' : '#fbbf24';
  const light = coin.isRuby ? '#fca5a5' : '#fde68a';
  const dark = coin.isRuby ? '#dc2626' : '#f59e0b';
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(sx - 5, sy + 4, 10, 3);
  ctx.fillStyle = main;
  ctx.globalAlpha = sparkle;
  ctx.fillRect(sx - 5, sy - 5, 10, 10);
  ctx.fillStyle = light;
  ctx.fillRect(sx - 3, sy - 4, 3, 8);
  ctx.fillStyle = dark;
  ctx.fillRect(sx + 1, sy - 3, 3, 6);
  ctx.globalAlpha = 1;
  if (Math.sin(time * 0.01 + coin.id * 2) > 0.7) {
    ctx.fillStyle = light;
    ctx.fillRect(sx - 8, sy - 8, 2, 2);
    ctx.fillRect(sx + 7, sy - 6, 2, 2);
  }
  ctx.restore();
}

export function drawCreature(ctx: CanvasRenderingContext2D, creature: Creature, camera: { x: number; y: number }, time: number) {
  const sx = creature.x - camera.x;
  const sy = creature.y - camera.y;
  ctx.save();
  if (creature.state === 'resting') {
    ctx.fillStyle = '#34d399';
    ctx.fillRect(sx - 8, sy - 4, 16, 10);
    ctx.fillRect(sx - 6, sy - 6, 12, 14);
    ctx.fillStyle = '#065f46';
    ctx.fillRect(sx - 4, sy - 2, 4, 1);
    ctx.fillRect(sx + 1, sy - 2, 4, 1);
    const zOffset = Math.sin(time * 0.003) * 3;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('z', sx + 10, sy - 8 + zOffset);
    ctx.font = '10px monospace';
    ctx.fillText('Z', sx + 16, sy - 14 + zOffset);
  } else {
    const bounce = Math.sin(time * 0.01) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(sx - 7, sy + 8, 14, 4);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(sx - 8, sy - 10 + bounce, 16, 14);
    ctx.fillRect(sx - 6, sy - 12 + bounce, 12, 18);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(sx - 8, sy - 16 + bounce, 4, 6);
    ctx.fillRect(sx + 4, sy - 16 + bounce, 4, 6);
    ctx.fillStyle = '#065f46';
    ctx.fillRect(sx - 4, sy - 6 + bounce, 3, 3);
    ctx.fillRect(sx + 2, sy - 6 + bounce, 3, 3);
    const footAnim = creature.state === 'collecting' ? Math.sin(time * 0.02) * 2 : 0;
    ctx.fillStyle = '#059669';
    ctx.fillRect(sx - 6, sy + 5 + bounce, 5, 3);
    ctx.fillRect(sx + 2, sy + 5 + bounce + footAnim, 5, 3);
  }
  ctx.restore();
}

export function drawPet(ctx: CanvasRenderingContext2D, pet: Pet, camera: { x: number; y: number }, time: number) {
  const sx = pet.x - camera.x;
  const sy = pet.y - camera.y;
  ctx.save();

  // Dead pet
  if (pet.state === 'dead') {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(sx - 7, sy - 3, 14, 8);
    ctx.globalAlpha = 1;
    // Wallet icon
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sx - 4, sy - 16, 8, 6);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(sx - 3, sy - 15, 6, 4);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💀', sx, sy - 20);
    ctx.restore();
    return;
  }

  // Planfy special glow
  if (pet.isHealer) {
    ctx.globalAlpha = 0.3 + Math.sin(time * 0.005) * 0.2;
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(sx, sy, 20, 0, Math.PI * 2);
    ctx.fill();
    // Stars
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 5; i++) {
      const angle = time * 0.002 + (Math.PI * 2 / 5) * i;
      const starX = sx + Math.cos(angle) * 16;
      const starY = sy + Math.sin(angle) * 16;
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(starX - 1, starY - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // Rarity aura
  const auraColor = RARITY_COLORS[pet.rarity];
  const auraSize = pet.rarity === 'legendary' ? 22 : pet.rarity === 'epic' ? 18 : pet.rarity === 'rare' ? 14 : 10;
  ctx.globalAlpha = 0.2 + Math.sin(time * 0.004) * 0.15;
  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.arc(sx, sy, auraSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (pet.state === 'trapped') {
    ctx.fillStyle = pet.color;
    ctx.fillRect(sx - 7, sy - 3, 14, 8);
    ctx.fillStyle = '#ef4444';
    ctx.globalAlpha = 0.6 + Math.sin(time * 0.01) * 0.3;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i + time * 0.003;
      const cx = sx + Math.cos(angle) * 12;
      const cy = sy + Math.sin(angle) * 12;
      ctx.fillRect(cx - 1, cy - 1, 3, 3);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx, cy); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('!', sx, sy - 16);
  } else if (pet.state === 'sleeping') {
    ctx.fillStyle = pet.color;
    ctx.fillRect(sx - 7, sy - 3, 14, 8);
    ctx.fillRect(sx - 5, sy - 5, 10, 12);
    ctx.fillStyle = pet.accentColor;
    ctx.fillRect(sx - 3, sy - 1, 3, 1);
    ctx.fillRect(sx + 1, sy - 1, 3, 1);
    const zOff = Math.sin(time * 0.003) * 3;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    ctx.fillText('z', sx + 9, sy - 7 + zOff);
    ctx.font = '9px monospace';
    ctx.fillText('Z', sx + 14, sy - 12 + zOff);
  } else {
    const bounce = Math.sin(time * 0.012 + pet.animFrame * 0.01) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(sx - 6, sy + 7, 12, 3);
    ctx.fillStyle = pet.color;
    ctx.fillRect(sx - 7, sy - 9 + bounce, 14, 12);
    ctx.fillRect(sx - 5, sy - 11 + bounce, 10, 16);
    ctx.fillStyle = pet.accentColor;
    ctx.fillRect(sx - 7, sy - 14 + bounce, 3, 5);
    ctx.fillRect(sx + 4, sy - 14 + bounce, 3, 5);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx - 3, sy - 5 + bounce, 2, 2);
    ctx.fillRect(sx + 2, sy - 5 + bounce, 2, 2);

    // Heal beam
    if (pet.isHealer && pet.healTarget) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + Math.sin(time * 0.01) * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, 15 + Math.sin(time * 0.008) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // HP bar
  if (pet.hp < pet.maxHp && (pet.state as string) !== 'dead') {
    const barW = 16;
    const barH = 2;
    const barX = sx - barW / 2;
    const barY = sy - 22;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = pet.hp > pet.maxHp * 0.5 ? '#22c55e' : pet.hp > pet.maxHp * 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(barX, barY, (pet.hp / pet.maxHp) * barW, barH);
  }

  // Rarity dot
  ctx.fillStyle = auraColor;
  ctx.fillRect(sx - 2, sy - 24, 4, 2);

  ctx.restore();
}

export function drawDemon(ctx: CanvasRenderingContext2D, demon: Demon, camera: { x: number; y: number }, time: number) {
  const sx = demon.x - camera.x;
  const sy = demon.y - camera.y;
  ctx.save();
  ctx.globalAlpha = 0.3 + Math.sin(time * 0.006) * 0.2;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(sx, sy, 20, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  const bounce = Math.sin(time * 0.008) * 2;
  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(sx - 8, sy - 10 + bounce, 16, 14);
  ctx.fillRect(sx - 6, sy - 12 + bounce, 12, 18);
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(sx - 8, sy - 18 + bounce, 4, 8);
  ctx.fillRect(sx + 4, sy - 18 + bounce, 4, 8);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(sx - 4, sy - 6 + bounce, 3, 3);
  ctx.fillRect(sx + 2, sy - 6 + bounce, 3, 3);
  // HP bar
  const barW = 16;
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(sx - barW / 2, sy - 22, barW, 2);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(sx - barW / 2, sy - 22, (demon.hp / demon.maxHp) * barW, 2);
  ctx.restore();
}

export function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, camera: { x: number; y: number }, time: number) {
  const sx = boss.x - camera.x;
  const sy = boss.y - camera.y;
  ctx.save();
  // Large aura
  ctx.globalAlpha = 0.4 + Math.sin(time * 0.004) * 0.2;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.arc(sx, sy, 35, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  const bounce = Math.sin(time * 0.006) * 3;
  // Large body
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(sx - 16, sy - 20 + bounce, 32, 28);
  ctx.fillRect(sx - 12, sy - 24 + bounce, 24, 36);
  // Horns
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(sx - 16, sy - 32 + bounce, 6, 14);
  ctx.fillRect(sx + 10, sy - 32 + bounce, 6, 14);
  // Crown
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(sx - 10, sy - 30 + bounce, 20, 3);
  ctx.fillRect(sx - 8, sy - 34 + bounce, 3, 6);
  ctx.fillRect(sx - 2, sy - 36 + bounce, 4, 8);
  ctx.fillRect(sx + 5, sy - 34 + bounce, 3, 6);
  // Eyes
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(sx - 8, sy - 12 + bounce, 5, 5);
  ctx.fillRect(sx + 3, sy - 12 + bounce, 5, 5);
  // Mouth
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(sx - 6, sy - 2 + bounce, 12, 3);
  // HP bar
  const barW = 40;
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(sx - barW / 2, sy - 40, barW, 4);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(sx - barW / 2, sy - 40, (boss.hp / boss.maxHp) * barW, 4);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS', sx, sy - 42);
  ctx.restore();
}

export function drawWalkingNPC(ctx: CanvasRenderingContext2D, npc: WalkingNPC, camera: { x: number; y: number }, time: number) {
  const sx = npc.x - camera.x;
  const sy = npc.y - camera.y;
  ctx.save();
  // Robe
  ctx.fillStyle = npc.color;
  ctx.fillRect(sx - 7, sy - 12, 14, 18);
  ctx.fillRect(sx - 5, sy - 14, 10, 22);
  // Hood
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(sx - 6, sy - 20, 12, 10);
  ctx.fillRect(sx - 8, sy - 18, 16, 6);
  // Glowing eyes
  const eyeGlow = Math.sin(time * 0.005) * 0.3 + 0.7;
  ctx.globalAlpha = eyeGlow;
  ctx.fillStyle = '#a78bfa';
  ctx.fillRect(sx - 3, sy - 15, 2, 2);
  ctx.fillRect(sx + 2, sy - 15, 2, 2);
  ctx.globalAlpha = 1;
  // Staff
  ctx.fillStyle = '#78350f';
  ctx.fillRect(sx + 8, sy - 24, 2, 30);
  ctx.fillStyle = '#a78bfa';
  ctx.fillRect(sx + 6, sy - 28, 6, 6);
  // Walking anim
  const legAnim = Math.sin(time * 0.008 + npc.animFrame * 0.1) * 2;
  ctx.fillStyle = npc.color;
  ctx.fillRect(sx - 4, sy + 6, 4, 4 + legAnim);
  ctx.fillRect(sx + 1, sy + 6, 4, 4 - legAnim);
  // Quest indicator
  if (npc.hasQuest) {
    const bounce = Math.sin(time * 0.005) * 3;
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', sx, sy - 32 + bounce);
  }
  ctx.restore();
}

export function drawChest(ctx: CanvasRenderingContext2D, chest: MapChest, camera: { x: number; y: number }, time: number) {
  const sx = chest.x - camera.x;
  const sy = chest.y - camera.y;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(sx - 14, sy + 10, 28, 6);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(sx - 12, sy - 4, 24, 16);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(sx - 12, sy - 4, 24, 2);
  ctx.fillRect(sx - 12, sy + 10, 24, 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(sx - 13, sy - 2, 26, 2);
  ctx.fillRect(sx - 13, sy + 6, 26, 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(sx - 3, sy + 1, 6, 5);
  if (chest.opened) {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(sx - 12, sy - 14, 24, 12);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(sx - 10, sy - 12, 20, 8);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(sx - 8, sy - 2, 16, 4);
  } else {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(sx - 12, sy - 8, 24, 6);
    ctx.fillStyle = '#a16207';
    ctx.fillRect(sx - 10, sy - 6, 20, 2);
  }
  ctx.restore();
}

export function drawInteractionPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, camera: { x: number; y: number }, time: number, text = 'TAP') {
  const sx = x - camera.x;
  const sy = y - camera.y;
  const bounce = Math.sin(time * 0.005) * 3;
  ctx.save();
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(sx - 14, sy - 36 + bounce, 28, 14);
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, sx, sy - 26 + bounce);
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(sx - 3, sy - 22 + bounce, 6, 4);
  ctx.restore();
}

export function drawCollectEffect(ctx: CanvasRenderingContext2D, x: number, y: number, camera: { x: number; y: number }, progress: number, text?: string) {
  const sx = x - camera.x;
  const sy = y - camera.y;
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  const radius = Math.max(0.1, progress * 15);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(sx, sy, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text || '+1', sx, sy - 10 - progress * 20);
  ctx.restore();
}

export function drawSnow(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.save();
  ctx.fillStyle = '#e2e8f0';
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 60; i++) {
    const x = ((i * 73 + time * 0.02) % width);
    const y = ((i * 137 + time * 0.03) % height);
    const size = 1 + (i % 3);
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
