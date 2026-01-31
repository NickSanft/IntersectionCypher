export type KeyAction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "action"
  | "menu"
  | "summary"
  | "ability1"
  | "ability2"
  | "ability3";

const actionKeyMap: Record<KeyAction, ReadonlyArray<string>> = {
  up: ["KeyW", "ArrowUp"],
  down: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  action: ["Space", "Enter"],
  menu: ["Escape", "KeyM", "KeyI"],
  summary: ["KeyR"],
  ability1: ["KeyQ", "Digit1"],
  ability2: ["KeyE", "Digit2"],
  ability3: ["KeyF", "Digit3"],
};

export class Input {
  private readonly pressed = new Set<string>();

  public attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  public detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  public isActionPressed(action: KeyAction): boolean {
    const keys = actionKeyMap[action];
    for (const key of keys) {
      if (this.pressed.has(key)) {
        return true;
      }
    }
    return false;
  }

  public isAnyPressed(): boolean {
    return this.pressed.size > 0;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    this.pressed.add(event.code);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private onBlur = (): void => {
    this.pressed.clear();
  };
}
