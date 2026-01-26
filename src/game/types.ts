import type * as PIXI from "pixi.js";
import type { TileMap } from "../core/world/TileMap";
import type { Input } from "./Input";
import type { PlayerController } from "./PlayerController";
import type { ZEntity } from "../entities/ZEntity";
import type { MenuSystem } from "../ui/menu/MenuSystem";
import type { UIElement } from "../ui/UIElement";
import type { Projectile } from "../projectiles/Projectile";
import type { PlayerData } from "./data/PlayerData";

export interface ProjectilePoolEntry {
  entity: ZEntity;
  projectile: Projectile;
  inUse: boolean;
}

export interface ProjectileEntry {
  projectile: Projectile;
  life: number;
  damage: number;
  pool: ProjectilePoolEntry;
}

export interface DamageTextPoolEntry {
  text: PIXI.Text;
  inUse: boolean;
}

export interface DamageTextEntry {
  text: PIXI.Text;
  life: number;
  velY: number;
  pool: DamageTextPoolEntry;
}

export interface EnemyState {
  entity: ZEntity;
  name: string;
  radius: number;
  maxHp: number;
  hp: number;
  hitTimer: number;
  dead: boolean;
  respawnTimer: number;
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
  attackCooldown: number;
  attackTimer: number;
  attackFlashTimer: number;
  strafeSpeed: number;
  strafeSwitchSeconds: number;
  strafeSwitchTimer: number;
  strafeDir: number;
  patrolAngle: number;
  homeX: number;
  homeY: number;
  hpBar: PIXI.Graphics;
  label: PIXI.Text;
}

export interface DialogState {
  open: boolean;
  content: string;
  text: PIXI.Text;
  charIndex: number;
  charTimer: number;
  charsPerSecond: number;
  ui: UIElement;
}

export interface AimState {
  line: PIXI.Graphics;
  active: boolean;
  x: number;
  y: number;
  chargeActive: boolean;
  chargeStartMs: number;
  chargeRatio: number;
  chargeThresholdMs: number;
  chargeRing: PIXI.Graphics;
}

export interface CameraState {
  world: PIXI.Container;
  shakeTime: number;
  shakeAmp: number;
  shakeFreq: number;
}

export interface GameState {
  app: PIXI.Application;
  world: PIXI.Container;
  map: TileMap;
  input: Input;
  player: ZEntity;
  playerController: PlayerController;
  playerRadius: number;
  npc: ZEntity;
  npcRadius: number;
  menu: MenuSystem;
  hud: UIElement;
  hudTitle: PIXI.Text;
  chargeBar: PIXI.Graphics;
  chargeLabel: PIXI.Text;
  dialog: DialogState;
  aim: AimState;
  camera: CameraState;
  projectiles: ProjectileEntry[];
  projectilePool: ProjectilePoolEntry[];
  enemy: EnemyState;
  playerData: PlayerData;
  damageTexts: DamageTextEntry[];
  damageTextPool: DamageTextPoolEntry[];
}
