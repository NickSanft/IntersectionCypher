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
};
