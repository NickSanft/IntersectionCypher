import type { Element, GameState } from "../types";

const ELEMENT_ORDER: Element[] = ["Neutral", "Heat", "Wave"];
const ELEMENT_COLORS: Record<Element, number> = {
  Neutral: 0xfbbf24,
  Heat: 0xf97316,
  Wave: 0x38bdf8,
};

export class ElementSystem {
  private wasPressed = false;

  public update(state: GameState): void {
    const pressed = state.input.isActionPressed("cycleElement");
    if (pressed && !this.wasPressed) {
      const idx = ELEMENT_ORDER.indexOf(state.element.current);
      state.element.current = ELEMENT_ORDER[(idx + 1) % ELEMENT_ORDER.length];
    }
    this.wasPressed = pressed;

    const color = ELEMENT_COLORS[state.element.current];
    state.element.hudIcon.text = state.element.current;
    state.element.hudIcon.tint = color;
  }
}

export { ELEMENT_COLORS };
