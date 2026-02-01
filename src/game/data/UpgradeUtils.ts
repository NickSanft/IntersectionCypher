import type { GameState } from "../types";
import { getUpgradeById, type UpgradeDefinition } from "./Upgrades";

export const applyUpgrade = (state: GameState, upgrade: UpgradeDefinition): void => {
  state.playerData.upgradeHistory.push({
    label: upgrade.label,
    rarity: upgrade.rarity,
  });

  const effect = upgrade.effect;
  if (effect.type === "stat") {
    const stats = state.playerData.stats;
    if (effect.stat === "moveSpeed") {
      stats.moveSpeed += effect.amount;
      state.playerController.setMoveSpeed(stats.moveSpeed);
      return;
    }
    if (effect.stat === "maxHp") {
      stats.maxHp += effect.amount;
      stats.hp += effect.amount;
      return;
    }
    if (effect.stat === "projectileSpeed") {
      stats.projectileSpeed += effect.amount;
      return;
    }
    stats[effect.stat] += effect.amount;
    return;
  }

  if (effect.type === "ability") {
    const ability = state.abilities.find((entry) => entry.def.id === effect.abilityId);
    if (!ability) {
      return;
    }
    if (effect.field === "cooldown") {
      ability.def.cooldown = Math.max(0.2, ability.def.cooldown + effect.delta);
      ability.cooldownRemaining = Math.min(
        ability.cooldownRemaining,
        ability.def.cooldown
      );
      return;
    }
    if (effect.field === "castTime") {
      ability.def.castTime = Math.max(0, ability.def.castTime + effect.delta);
    }
    return;
  }

  if (effect.type === "rhythm") {
    if (effect.field === "windowSeconds") {
      state.rhythm.windowSeconds = Math.min(
        0.3,
        Math.max(0.05, state.rhythm.windowSeconds + effect.delta)
      );
      return;
    }
    if (effect.field === "onBeatDamageMult") {
      state.rhythm.onBeatDamageMult = Math.min(
        4,
        Math.max(1.5, state.rhythm.onBeatDamageMult + effect.delta)
      );
    }
  }
};

export const applyUpgradeById = (state: GameState, id: string): boolean => {
  const upgrade = getUpgradeById(id);
  if (!upgrade) {
    return false;
  }
  applyUpgrade(state, upgrade);
  return true;
};
