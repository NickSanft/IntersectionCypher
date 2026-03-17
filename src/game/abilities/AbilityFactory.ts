import { moveWithCollision } from "../../core/physics/Move";
import { findNearestOpen } from "../../core/world/MapUtils";
import type { AbilityState, GameState } from "../types";

const getAimDirection = (
  state: GameState
): { x: number; y: number } | null => {
  const dx = state.aim.x - state.player.pos.x;
  const dy = state.aim.y - state.player.pos.y;
  if (state.aim.active) {
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      return { x: dx / len, y: dy / len };
    }
  }

  const inputX =
    (state.input.isActionPressed("right") ? 1 : 0) -
    (state.input.isActionPressed("left") ? 1 : 0);
  const inputY =
    (state.input.isActionPressed("down") ? 1 : 0) -
    (state.input.isActionPressed("up") ? 1 : 0);
  if (inputX === 0 && inputY === 0) {
    return null;
  }
  const len = Math.hypot(inputX, inputY);
  return { x: inputX / len, y: inputY / len };
};

export const createAbilityStates = (state: GameState): AbilityState[] => {
  return [
    {
      def: {
        id: "roll",
        label: "Roll",
        keyLabel: "Q",
        inputAction: "ability1",
        cooldown: 1.8,
        castTime: 0,
        onCast: (game) => {
          const dir = getAimDirection(game);
          if (!dir) {
            return false;
          }
          game.dodgeRoll.active = true;
          game.dodgeRoll.timer = game.dodgeRoll.duration;
          game.dodgeRoll.dirX = dir.x;
          game.dodgeRoll.dirY = dir.y;
          return true;
        },
      },
      cooldownRemaining: 0,
      castRemaining: 0,
      readyFlash: 0,
    },
    {
      def: {
        id: "phaseShift",
        label: "Phase",
        keyLabel: "E",
        inputAction: "ability2",
        cooldown: 5,
        castTime: 0,
        onCast: (game) => {
          // Teleport toward aim cursor, max 200px
          const dx = game.aim.x - game.player.pos.x;
          const dy = game.aim.y - game.player.pos.y;
          const dist = Math.hypot(dx, dy);
          if (dist === 0) return false;
          const range = Math.min(dist, 200);
          const targetX = game.player.pos.x + (dx / dist) * range;
          const targetY = game.player.pos.y + (dy / dist) * range;
          const safe = findNearestOpen(game.map, targetX, targetY);
          game.player.pos.x = safe.x;
          game.player.pos.y = safe.y;
          game.player.renderUpdate();
          game.playerHitTimer = Math.max(game.playerHitTimer, 0.12);
          return true;
        },
      },
      cooldownRemaining: 0,
      castRemaining: 0,
      readyFlash: 0,
    },
    {
      def: {
        id: "guard",
        label: "Guard",
        keyLabel: "F",
        inputAction: "ability3",
        cooldown: 8,
        castTime: 0.15,
        onCast: (game) => {
          game.playerDamageMult = 0.5;
          game.playerDamageMultTimer = 4;
          return true;
        },
      },
      cooldownRemaining: 0,
      castRemaining: 0,
      readyFlash: 0,
    },
    {
      def: {
        id: "tempoBurst",
        label: "Tempo",
        keyLabel: "R",
        inputAction: "ability4",
        cooldown: 12,
        castTime: 0,
        onCast: (game) => {
          game.tempoBurstBeatsLeft = 8;
          return true;
        },
      },
      cooldownRemaining: 0,
      castRemaining: 0,
      readyFlash: 0,
    },
    {
      def: {
        id: "pulseWave",
        label: "Pulse",
        keyLabel: "C",
        inputAction: "ability5",
        cooldown: 8,
        castTime: 0,
        onCast: (game) => {
          const RANGE = 120;
          let hit = false;
          for (const enemy of game.enemies) {
            if (enemy.mapId !== game.currentMapId || enemy.dead) continue;
            const dx = enemy.entity.pos.x - game.player.pos.x;
            const dy = enemy.entity.pos.y - game.player.pos.y;
            if (Math.hypot(dx, dy) <= RANGE) {
              const dmg = game.rhythm.onBeat ? Math.round(3 * game.rhythm.onBeatDamageMult) : 3;
              enemy.hp = Math.max(0, enemy.hp - dmg);
              enemy.hitTimer = enemy.hitFlashSeconds;
              enemy.entity.sprite.tint = 0xffc2c2;
              if (enemy.hp === 0 && !enemy.expGranted) {
                enemy.dead = true;
                enemy.deathTimer = 0.25;
                enemy.expGranted = true;
                game.killCount += 1;
                game.levelUpSystem.addExperience(game, 5);
              }
              hit = true;
            }
          }
          return hit || true;
        },
      },
      cooldownRemaining: 0,
      castRemaining: 0,
      readyFlash: 0,
    },
  ];
};
