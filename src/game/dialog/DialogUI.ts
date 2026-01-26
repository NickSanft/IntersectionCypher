import * as PIXI from "pixi.js";
import { UIElement } from "../../ui/UIElement";
import type { DialogChoice } from "./DialogEngine";

export class DialogUI {
  public readonly root: UIElement;
  public readonly text: PIXI.Text;
  private readonly background: PIXI.Graphics;
  private readonly choicesContainer: PIXI.Container;

  constructor(width: number, height: number) {
    this.root = new UIElement({
      width,
      height,
      anchor: "BottomCenter",
      offsetX: 0,
      offsetY: -24,
    });

    this.background = new PIXI.Graphics();
    this.background.beginFill(0x111827, 0.92);
    this.background.lineStyle(2, 0x3b82f6, 1);
    this.background.drawRoundedRect(0, 0, width, height, 10);
    this.background.endFill();
    this.root.addChild(this.background);

    this.text = new PIXI.Text({
      text: "",
      style: {
        fill: 0xf9fafb,
        fontFamily: "Arial",
        fontSize: 16,
        wordWrap: true,
        wordWrapWidth: width - 24,
      },
    });
    this.text.position.set(12, 12);
    this.root.addChild(this.text);

    this.choicesContainer = new PIXI.Container();
    this.choicesContainer.position.set(12, 48);
    this.root.addChild(this.choicesContainer);
  }

  public setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  public setText(text: string): void {
    this.text.text = text;
  }

  public setChoices(
    choices: DialogChoice[] | undefined,
    onSelect: (index: number) => void
  ): void {
    this.choicesContainer.removeChildren();
    if (!choices || choices.length === 0) {
      return;
    }

    const gap = 8;
    const choiceWidth = this.root.widthPx - 24;
    const choiceHeight = 24;
    choices.forEach((choice, index) => {
      const entry = new PIXI.Container();
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0b1220, 0.9);
      bg.lineStyle(1, 0x334155, 1);
      bg.drawRoundedRect(0, 0, choiceWidth, choiceHeight, 6);
      bg.endFill();
      entry.addChild(bg);

      const label = new PIXI.Text({
        text: choice.text,
        style: {
          fill: 0xe2e8f0,
          fontFamily: "Arial",
          fontSize: 12,
        },
      });
      label.position.set(10, 4);
      entry.addChild(label);

      entry.position.set(0, index * (choiceHeight + gap));
      entry.eventMode = "static";
      entry.cursor = "pointer";
      entry.on("pointertap", () => onSelect(index));
      entry.on("pointerover", () => {
        bg.clear();
        bg.beginFill(0x1e293b, 0.95);
        bg.lineStyle(1, 0x60a5fa, 1);
        bg.drawRoundedRect(0, 0, choiceWidth, choiceHeight, 6);
        bg.endFill();
      });
      entry.on("pointerout", () => {
        bg.clear();
        bg.beginFill(0x0b1220, 0.9);
        bg.lineStyle(1, 0x334155, 1);
        bg.drawRoundedRect(0, 0, choiceWidth, choiceHeight, 6);
        bg.endFill();
      });

      this.choicesContainer.addChild(entry);
    });
  }

  public updateLayout(width: number, height: number): void {
    this.root.updateLayout(width, height);
  }
}
