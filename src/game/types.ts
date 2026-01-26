import type * as PIXI from "pixi.js";
import type { TileMap } from "../core/world/TileMap";
import type { Input } from "./Input";
import type { PlayerController } from "./PlayerController";
import type { ZEntity } from "../entities/ZEntity";
import type { MenuSystem } from "../ui/menu/MenuSystem";
import type { UIElement } from "../ui/UIElement";
import type { Projectile } from "../projectiles/Projectile";
import type { PlayerData } from "./data/PlayerData";
import type { DialogEngine, DialogData } from "./dialog/DialogEngine";
import type { DialogUI } from "./dialog/DialogUI";

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

export interface EnemyProjectilePoolEntry {
  entity: ZEntity;
  projectile: Projectile;
  inUse: boolean;
}

export interface EnemyProjectileEntry {
  projectile: Projectile;
  life: number;
  damage: number;
  pool: EnemyProjectilePoolEntry;
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
  projectileSpeed: number;
  projectileDamage: number;
  projectileRadius: number;
  projectileLifetime: number;
  patrolAngle: number;
  homeX: number;
  homeY: number;
  hpBar: PIXI.Graphics;
  label: PIXI.Text;
}

export interface DialogState {
  open: boolean;
  dialogs: Record<string, DialogData>;
  activeId: string | null;
  engine: DialogEngine;
  ui: DialogUI;
  charIndex: number;
  charTimer: number;
  charsPerSecond: number;
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

export interface NpcState {
  entity: ZEntity;
  radius: number;
  dialogId: string;
  mapId: string;
}

export interface MapDoor {
  to: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  spawnX: number;
  spawnY: number;
}

export interface MapState {
  id: string;
  map: TileMap;
  view: PIXI.Container;
  spawnX: number;
  spawnY: number;
  door?: MapDoor;
}

export interface DoorMarker {
  mapId: string;
  view: PIXI.Container;
}

export interface GameState {
  app: PIXI.Application;
  world: PIXI.Container;
  map: TileMap;
  mapView: PIXI.Container;
  maps: Record<string, MapState>;
  currentMapId: string;
  input: Input;
  player: ZEntity;
  playerController: PlayerController;
  playerRadius: number;
  playerHitTimer: number;
  playerKnockbackTimer: number;
  npcs: NpcState[];
  menu: MenuSystem;
  hud: UIElement;
  hudTitle: PIXI.Text;
  hudHpBar: PIXI.Graphics;
  hudHpText: PIXI.Text;
  chargeBar: PIXI.Graphics;
  chargeLabel: PIXI.Text;
  dialog: DialogState;
  aim: AimState;
  camera: CameraState;
  projectiles: ProjectileEntry[];
  projectilePool: ProjectilePoolEntry[];
  enemyProjectiles: EnemyProjectileEntry[];
  enemyProjectilePool: EnemyProjectilePoolEntry[];
  enemyProjectileTexture: PIXI.Texture;
  enemy: EnemyState;
  enemyMapId: string;
  playerData: PlayerData;
  damageTexts: DamageTextEntry[];
  damageTextPool: DamageTextPoolEntry[];
  doorMarkers: DoorMarker[];
  transitionOverlay: PIXI.Graphics;
  transitionPhase: "idle" | "fadeOut" | "fadeIn";
  transitionTime: number;
  transitionDuration: number;
  transitionTargetMapId: string | null;
  transitionTargetSpawn: { x: number; y: number } | null;
}
