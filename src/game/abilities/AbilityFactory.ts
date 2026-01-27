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
        id: "dash",
        label: "Dash",
        keyLabel: "Q",
        inputAction: "ability1",
        cooldown: 2.5,
        castTime: 0.05,
        onCast: (game) => {
          const dir = getAimDirection(game);
          if (!dir) {
            return false;
          }
          const dashSpeed = 900;
          const dashTime = 0.12;
          const vel = { x: dir.x * dashSpeed, y: dir.y * dashSpeed, z: 0 };
          moveWithCollision(game.player.pos, vel, dashTime, game.playerRadius, game.map);
          game.player.renderUpdate();
          return true;
        },
      },
      cooldownRemaining: 0,
      castRemaining: 0,
    },
    {
      def: {
        id: "blink",
        label: "Blink",
        keyLabel: "E",
        inputAction: "ability2",
        cooldown: 5,
        castTime: 0.2,
        onCast: (game) => {
          const dir = getAimDirection(game);
          if (!dir) {
            return false;
          }
          const distance = 160;
          const targetX = game.player.pos.x + dir.x * distance;
          const targetY = game.player.pos.y + dir.y * distance;
          const safe = findNearestOpen(game.map, targetX, targetY);
          game.player.pos.x = safe.x;
          game.player.pos.y = safe.y;
          game.player.renderUpdate();
          return true;
        },
      },
      cooldownRemaining: 0,
      castRemaining: 0,
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
    },
  ];
};
