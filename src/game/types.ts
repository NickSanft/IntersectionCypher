import type * as PIXI from "pixi.js";
import type { TileMap } from "../core/world/TileMap";
import type { Input, KeyAction } from "./Input";
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

export interface ImpactParticlePoolEntry {
  gfx: PIXI.Graphics;
  inUse: boolean;
}

export interface ImpactParticleEntry {
  gfx: PIXI.Graphics;
  life: number;
  velX: number;
  velY: number;
  pool: ImpactParticlePoolEntry;
}

export interface HitMarkerPoolEntry {
  gfx: PIXI.Graphics;
  inUse: boolean;
}

export interface HitMarkerEntry {
  gfx: PIXI.Graphics;
  life: number;
  pool: HitMarkerPoolEntry;
}

export interface EnemyState {
  entity: ZEntity;
  name: string;
  type: "chaser" | "turret";
  radius: number;
  maxHp: number;
  hp: number;
  hitTimer: number;
  dead: boolean;
  expGranted: boolean;
  respawnTimer: number;
  respawnSeconds: number;
  hitFlashSeconds: number;
  labelOffsetY: number;
  mapId: string;
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

export interface AbilityDefinition {
  id: string;
  label: string;
  keyLabel: string;
  inputAction: KeyAction;
  cooldown: number;
  castTime: number;
  onCast: (state: GameState) => boolean;
}

export interface AbilityState {
  def: AbilityDefinition;
  cooldownRemaining: number;
  castRemaining: number;
}

export interface AbilityBarState {
  root: UIElement;
  slotBgs: PIXI.Graphics[];
  slotLabels: PIXI.Text[];
  slotKeys: PIXI.Text[];
  slotCooldowns: PIXI.Graphics[];
  slotCasts: PIXI.Graphics[];
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
  hitStopTimer: number;
  hitStopDuration: number;
  playerDamageMult: number;
  playerDamageMultTimer: number;
  npcs: NpcState[];
  menu: MenuSystem;
  hud: UIElement;
  hudBg: PIXI.Graphics;
  hudText: PIXI.Text;
  hudTopRight: UIElement;
  hudTopRightBg: PIXI.Graphics;
  hudTitle: PIXI.Text;
  hudHpBar: PIXI.Graphics;
  hudHpText: PIXI.Text;
  hudLevelText: PIXI.Text;
  hudExpText: PIXI.Text;
  chargeBar: PIXI.Graphics;
  chargeLabel: PIXI.Text;
  abilities: AbilityState[];
  abilityBar: AbilityBarState;
  dialog: DialogState;
  aim: AimState;
  camera: CameraState;
  levelUpSystem: import("./systems/LevelUpSystem").LevelUpSystem;
  levelUp: LevelUpState;
  projectiles: ProjectileEntry[];
  projectilePool: ProjectilePoolEntry[];
  enemyProjectiles: EnemyProjectileEntry[];
  enemyProjectilePool: EnemyProjectilePoolEntry[];
  enemyProjectileTexture: PIXI.Texture;
  enemies: EnemyState[];
  playerData: PlayerData;
  damageTexts: DamageTextEntry[];
  damageTextPool: DamageTextPoolEntry[];
  impactParticles: ImpactParticleEntry[];
  impactParticlePool: ImpactParticlePoolEntry[];
  hitMarkers: HitMarkerEntry[];
  hitMarkerPool: HitMarkerPoolEntry[];
  doorMarkers: DoorMarker[];
  doorPrompt: UIElement;
  doorPromptBg: PIXI.Graphics;
  doorPromptText: PIXI.Text;
  minimap: UIElement;
  minimapBg: PIXI.Graphics;
  minimapView: PIXI.Graphics;
  minimapScale: number;
  transitionOverlay: PIXI.Graphics;
  transitionPhase: "idle" | "fadeOut" | "fadeIn";
  transitionTime: number;
  transitionDuration: number;
  transitionTargetMapId: string | null;
  transitionTargetSpawn: { x: number; y: number } | null;
}

export interface LevelUpOption {
  id: string;
  label: string;
  apply: (state: GameState) => void;
}

export interface LevelUpState {
  active: boolean;
  options: LevelUpOption[];
  selectedIndex: number;
  ui: import("../game/level/LevelUpUI").LevelUpUI;
}
