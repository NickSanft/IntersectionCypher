import type { UIElement } from "../UIElement";

export interface Focusable {
  element: UIElement;
  focus(): void;
  blur(): void;
  activate(): void;
}

export class FocusManager {
  private readonly focusables: Focusable[] = [];
  private index = -1;

  public attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
  }

  public detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  public register(focusable: Focusable): void {
    this.focusables.push(focusable);
    if (this.index === -1) {
      this.index = 0;
      this.focusables[0].focus();
    }
  }

  public clear(): void {
    this.focusables.length = 0;
    this.index = -1;
  }

  public focusNext(): void {
    if (this.focusables.length === 0) {
      return;
    }
    this.focusables[this.index].blur();
    this.index = (this.index + 1) % this.focusables.length;
    this.focusables[this.index].focus();
  }

  public focusPrev(): void {
    if (this.focusables.length === 0) {
      return;
    }
    this.focusables[this.index].blur();
    this.index = (this.index - 1 + this.focusables.length) % this.focusables.length;
    this.focusables[this.index].focus();
  }

  public activateCurrent(): void {
    if (this.index < 0 || this.index >= this.focusables.length) {
      return;
    }
    this.focusables[this.index].activate();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        this.focusPrev();
      } else {
        this.focusNext();
      }
      return;
    }
    if (event.code === "Enter" || event.code === "Space") {
      this.activateCurrent();
    }
  };
}
