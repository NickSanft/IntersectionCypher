import type { AbilityDefinition } from "../types";

export type UpgradeEffect =
  | { type: "stat"; stat: "projectileDamage" | "moveSpeed" | "maxHp" | "focus"; amount: number }
  | { type: "ability"; abilityId: AbilityDefinition["id"]; field: "cooldown" | "castTime"; delta: number };

export interface UpgradeDefinition {
  id: string;
  label: string;
  effect: UpgradeEffect;
}

const upgradePool: UpgradeDefinition[] = [
  {
    id: "stat-dmg-1",
    label: "+1 Projectile Damage",
    effect: { type: "stat", stat: "projectileDamage", amount: 1 },
  },
  {
    id: "stat-speed-1",
    label: "+20 Move Speed",
    effect: { type: "stat", stat: "moveSpeed", amount: 20 },
  },
  {
    id: "stat-hp-1",
    label: "+10 Max HP",
    effect: { type: "stat", stat: "maxHp", amount: 10 },
  },
  {
    id: "stat-focus-1",
    label: "+2 Focus",
    effect: { type: "stat", stat: "focus", amount: 2 },
  },
  {
    id: "dash-cooldown-1",
    label: "Dash Cooldown -0.4s",
    effect: { type: "ability", abilityId: "dash", field: "cooldown", delta: -0.4 },
  },
  {
    id: "blink-cooldown-1",
    label: "Blink Cooldown -0.6s",
    effect: { type: "ability", abilityId: "blink", field: "cooldown", delta: -0.6 },
  },
  {
    id: "guard-cooldown-1",
    label: "Guard Cooldown -0.8s",
    effect: { type: "ability", abilityId: "guard", field: "cooldown", delta: -0.8 },
  },
  {
    id: "dash-cast-1",
    label: "Dash Cast -0.02s",
    effect: { type: "ability", abilityId: "dash", field: "castTime", delta: -0.02 },
  },
  {
    id: "guard-cast-1",
    label: "Guard Cast -0.03s",
    effect: { type: "ability", abilityId: "guard", field: "castTime", delta: -0.03 },
  },
];

export const pickUpgradeOptions = (count: number): UpgradeDefinition[] => {
  const pool = [...upgradePool];
  const picked: UpgradeDefinition[] = [];
  const target = Math.min(count, pool.length);
  for (let i = 0; i < target; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }
  return picked;
};
