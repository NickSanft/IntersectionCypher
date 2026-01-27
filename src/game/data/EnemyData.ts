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
};
