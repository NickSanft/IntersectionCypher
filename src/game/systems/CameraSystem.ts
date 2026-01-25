import type { GameState } from "../types";

export class CameraSystem {
  public update(state: GameState, dt: number): void {
    const { world, shakeAmp, shakeFreq } = state.camera;
    const targetX = state.app.renderer.width * 0.5 - state.player.pos.x;
    const targetY = state.app.renderer.height * 0.5 - state.player.pos.y;

    let shakeX = 0;
    let shakeY = 0;
    if (state.camera.shakeTime > 0) {
      state.camera.shakeTime = Math.max(0, state.camera.shakeTime - dt);
      const t = performance.now() / 1000;
      const fade = state.camera.shakeTime;
      shakeX = Math.sin(t * shakeFreq) * shakeAmp * fade;
      shakeY = Math.cos(t * (shakeFreq * 1.2)) * shakeAmp * fade;
    }

    world.position.set(targetX + shakeX, targetY + shakeY);
  }

  public shake(state: GameState, duration: number, amplitude: number): void {
    state.camera.shakeTime = Math.max(state.camera.shakeTime, duration);
    state.camera.shakeAmp = Math.max(state.camera.shakeAmp, amplitude);
  }
}
