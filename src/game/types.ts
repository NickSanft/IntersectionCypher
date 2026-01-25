import type * as PIXI from "pixi.js";
import type { TileMap } from "../core/world/TileMap";
import type { Input } from "./Input";
import type { PlayerController } from "./PlayerController";
import type { ZEntity } from "../entities/ZEntity";
import type { MenuSystem } from "../ui/menu/MenuSystem";
import type { UIElement } from "../ui/UIElement";
import type { Projectile } from "../projectiles/Projectile";

export interface ProjectileEntry {
  projectile: Projectile;
  life: number;
  damage: number;
}

export interface DamageTextEntry {
  text: PIXI.Text;
  life: number;
  velY: number;
}

export interface EnemyState {
  entity: ZEntity;
  radius: number;
  maxHp: number;
  hp: number;
  hitTimer: number;
  dead: boolean;
  respawnTimer: number;
  hpBar: PIXI.Graphics;
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

export interface GameState {
  app: PIXI.Application;
  map: TileMap;
  input: Input;
  player: ZEntity;
  playerController: PlayerController;
  playerRadius: number;
  npc: ZEntity;
  npcRadius: number;
  menu: MenuSystem;
  hud: UIElement;
  dialog: DialogState;
  aim: AimState;
  projectiles: ProjectileEntry[];
  enemy: EnemyState;
  damageTexts: DamageTextEntry[];
}
