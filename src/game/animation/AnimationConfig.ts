export type AnimationState = "idle" | "walk" | "attack" | "hurt" | "dead";

export interface AnimClip {
  frames: number;
  speed: number;
  loop: boolean;
}

export type AnimSet = Record<AnimationState, AnimClip>;

export const playerAnims: AnimSet = {
  idle:   { frames: 4, speed: 0.08, loop: true },
  walk:   { frames: 6, speed: 0.14, loop: true },
  attack: { frames: 4, speed: 0.18, loop: false },
  hurt:   { frames: 2, speed: 0.20, loop: false },
  dead:   { frames: 6, speed: 0.10, loop: false },
};

export const chaserAnims: AnimSet = {
  idle:   { frames: 2, speed: 0.06, loop: true },
  walk:   { frames: 4, speed: 0.14, loop: true },
  attack: { frames: 3, speed: 0.20, loop: false },
  hurt:   { frames: 2, speed: 0.22, loop: false },
  dead:   { frames: 4, speed: 0.10, loop: false },
};

export const turretAnims: AnimSet = {
  idle:   { frames: 2, speed: 0.05, loop: true },
  walk:   { frames: 2, speed: 0.05, loop: true },
  attack: { frames: 3, speed: 0.22, loop: false },
  hurt:   { frames: 2, speed: 0.22, loop: false },
  dead:   { frames: 4, speed: 0.10, loop: false },
};

export const shieldAnims: AnimSet = {
  idle:   { frames: 2, speed: 0.06, loop: true },
  walk:   { frames: 4, speed: 0.12, loop: true },
  attack: { frames: 3, speed: 0.20, loop: false },
  hurt:   { frames: 2, speed: 0.22, loop: false },
  dead:   { frames: 4, speed: 0.10, loop: false },
};

export const npcAnims: AnimSet = {
  idle:   { frames: 4, speed: 0.07, loop: true },
  walk:   { frames: 4, speed: 0.12, loop: true },
  attack: { frames: 2, speed: 0.15, loop: false },
  hurt:   { frames: 2, speed: 0.20, loop: false },
  dead:   { frames: 2, speed: 0.10, loop: false },
};
