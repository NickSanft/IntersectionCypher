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
};
