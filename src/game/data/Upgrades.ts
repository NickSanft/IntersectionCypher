import type { AbilityDefinition } from "../types";

export type UpgradeEffect =
  | {
      type: "stat";
      stat: "projectileDamage" | "moveSpeed" | "maxHp" | "focus" | "projectileSpeed";
      amount: number;
    }
  | { type: "ability"; abilityId: AbilityDefinition["id"]; field: "cooldown" | "castTime"; delta: number }
  | { type: "rhythm"; field: "windowSeconds" | "onBeatDamageMult"; delta: number };

export interface UpgradeDefinition {
  id: string;
  label: string;
  effect: UpgradeEffect;
  rarity: "Common" | "Rare" | "Epic";
  minLevel?: number;
}

const upgradePool: UpgradeDefinition[] = [
  {
    id: "stat-dmg-1",
    label: "+1 Projectile Damage",
    effect: { type: "stat", stat: "projectileDamage", amount: 1 },
    rarity: "Common",
  },
  {
    id: "stat-speed-1",
    label: "+20 Move Speed",
    effect: { type: "stat", stat: "moveSpeed", amount: 20 },
    rarity: "Common",
  },
  {
    id: "stat-hp-1",
    label: "+10 Max HP",
    effect: { type: "stat", stat: "maxHp", amount: 10 },
    rarity: "Common",
  },
  {
    id: "stat-focus-1",
    label: "+2 Focus",
    effect: { type: "stat", stat: "focus", amount: 2 },
    rarity: "Common",
  },
  {
    id: "stat-proj-speed-1",
    label: "+30 Projectile Speed",
    effect: { type: "stat", stat: "projectileSpeed", amount: 30 },
    rarity: "Common",
  },
  {
    id: "dash-cooldown-1",
    label: "Dash Cooldown -0.4s",
    effect: { type: "ability", abilityId: "dash", field: "cooldown", delta: -0.4 },
    rarity: "Rare",
    minLevel: 2,
  },
  {
    id: "blink-cooldown-1",
    label: "Blink Cooldown -0.6s",
    effect: { type: "ability", abilityId: "blink", field: "cooldown", delta: -0.6 },
    rarity: "Rare",
    minLevel: 2,
  },
  {
    id: "guard-cooldown-1",
    label: "Guard Cooldown -0.8s",
    effect: { type: "ability", abilityId: "guard", field: "cooldown", delta: -0.8 },
    rarity: "Rare",
    minLevel: 2,
  },
  {
    id: "dash-cast-1",
    label: "Dash Cast -0.02s",
    effect: { type: "ability", abilityId: "dash", field: "castTime", delta: -0.02 },
    rarity: "Rare",
    minLevel: 2,
  },
  {
    id: "guard-cast-1",
    label: "Guard Cast -0.03s",
    effect: { type: "ability", abilityId: "guard", field: "castTime", delta: -0.03 },
    rarity: "Rare",
    minLevel: 2,
  },
  {
    id: "rhythm-window-1",
    label: "+0.03s Beat Window",
    effect: { type: "rhythm", field: "windowSeconds", delta: 0.03 },
    rarity: "Rare",
    minLevel: 3,
  },
  {
    id: "rhythm-mult-1",
    label: "+0.5x On-Beat Damage",
    effect: { type: "rhythm", field: "onBeatDamageMult", delta: 0.5 },
    rarity: "Epic",
    minLevel: 4,
  },
];

const rarityWeights: Record<UpgradeDefinition["rarity"], number> = {
  Common: 70,
  Rare: 25,
  Epic: 5,
};

export const pickUpgradeOptions = (
  count: number,
  level: number
): UpgradeDefinition[] => {
  const pool = upgradePool.filter(
    (upgrade) => (upgrade.minLevel ?? 1) <= level
  );
  const picked: UpgradeDefinition[] = [];
  const target = Math.min(count, pool.length);
  for (let i = 0; i < target; i += 1) {
    const rarityPick = pickRarity();
    const filtered = pool.filter((entry) => entry.rarity === rarityPick);
    const source = filtered.length > 0 ? filtered : pool;
    const index = Math.floor(Math.random() * source.length);
    const selection = source[index];
    picked.push(selection);
    const poolIndex = pool.findIndex((entry) => entry.id === selection.id);
    if (poolIndex >= 0) {
      pool.splice(poolIndex, 1);
    }
  }
  return picked;
};

const pickRarity = (): UpgradeDefinition["rarity"] => {
  const roll = Math.random() * 100;
  if (roll < rarityWeights.Epic) {
    return "Epic";
  }
  if (roll < rarityWeights.Epic + rarityWeights.Rare) {
    return "Rare";
  }
  return "Common";
};
