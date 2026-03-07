import type { Element } from "../types";

export interface EnemyData {
  name: string;
  maxHp: number;
  radius: number;
  respawnSeconds: number;
  hitFlashSeconds: number;
  labelOffsetY: number;
  speed: number;
  aggroRange: number;
  stopRange: number;
  patrolRadius: number;
  attackRange: number;
  attackWindupSeconds: number;
  attackCooldownSeconds: number;
  strafeSpeed: number;
  strafeSwitchSeconds: number;
  projectileSpeed: number;
  projectileDamage: number;
  projectileRadius: number;
  projectileLifetime: number;
  element: Element;
}

export const defaultEnemyData: EnemyData = {
  name: "Target Drone",
  maxHp: 5,
  radius: 12,
  respawnSeconds: 2.5,
  hitFlashSeconds: 0.15,
  labelOffsetY: 44,
  speed: 90,
  aggroRange: 220,
  stopRange: 36,
  patrolRadius: 42,
  attackRange: 140,
  attackWindupSeconds: 0.35,
  attackCooldownSeconds: 1.2,
  strafeSpeed: 70,
  strafeSwitchSeconds: 1.6,
  projectileSpeed: 320,
  projectileDamage: 1,
  projectileRadius: 5,
  projectileLifetime: 1.2,
  element: "Heat",
};

export const turretEnemyData: EnemyData = {
  name: "Arc Turret",
  maxHp: 7,
  radius: 12,
  respawnSeconds: 3,
  hitFlashSeconds: 0.15,
  labelOffsetY: 44,
  speed: 0,
  aggroRange: 260,
  stopRange: 0,
  patrolRadius: 0,
  attackRange: 220,
  attackWindupSeconds: 0.45,
  attackCooldownSeconds: 1.4,
  strafeSpeed: 0,
  strafeSwitchSeconds: 1,
  projectileSpeed: 360,
  projectileDamage: 1,
  projectileRadius: 5,
  projectileLifetime: 1.2,
  element: "Wave",
};

export const heavyTurretEnemyData: EnemyData = {
  name: "Core Node",
  maxHp: 30,
  radius: 16,
  respawnSeconds: 999,
  hitFlashSeconds: 0.15,
  labelOffsetY: 58,
  speed: 0,
  aggroRange: 600,
  stopRange: 0,
  patrolRadius: 0,
  attackRange: 550,
  attackWindupSeconds: 0.5,
  attackCooldownSeconds: 0.7,
  strafeSpeed: 0,
  strafeSwitchSeconds: 1,
  projectileSpeed: 420,
  projectileDamage: 2,
  projectileRadius: 7,
  projectileLifetime: 2.0,
  element: "Neutral",
};

export const shieldEnemyData: EnemyData = {
  name: "Shield Guard",
  maxHp: 12,
  radius: 14,
  respawnSeconds: 4,
  hitFlashSeconds: 0.12,
  labelOffsetY: 54,
  speed: 45,
  aggroRange: 280,
  stopRange: 50,
  patrolRadius: 24,
  attackRange: 0,
  attackWindupSeconds: 0,
  attackCooldownSeconds: 999,
  strafeSpeed: 0,
  strafeSwitchSeconds: 1,
  projectileSpeed: 0,
  projectileDamage: 0,
  projectileRadius: 5,
  projectileLifetime: 1,
  element: "Wave",
};
