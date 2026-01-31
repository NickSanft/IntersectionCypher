import * as PIXI from "pixi.js";
import { UIElement } from "../../ui/UIElement";
import { UIButton } from "../../ui/UIButton";

export class SettingsUI {
  public readonly root: UIElement;
  private readonly background: PIXI.Graphics;
  private readonly title: PIXI.Text;
  private readonly metronomeLabel: PIXI.Text;
  private readonly volumeLabel: PIXI.Text;
  private readonly metronomeButton: UIButton;
  private readonly volumeButton: UIButton;
  private readonly hintText: PIXI.Text;

  constructor(width: number, height: number, onToggleMetronome: () => void, onCycleVolume: () => void) {
    this.root = new UIElement({
      width,
      height,
      anchor: "Center",
    });

    this.background = new PIXI.Graphics();
    this.background.beginFill(0x0b1220, 0.92);
    this.background.lineStyle(2, 0x3b82f6, 1);
    this.background.drawRoundedRect(0, 0, width, height, 12);
    this.background.endFill();
    this.root.addChild(this.background);

    this.title = new PIXI.Text({
      text: "Settings",
      style: {
        fill: 0xf8fafc,
        fontFamily: "Arial",
        fontSize: 18,
        fontWeight: "700",
      },
    });
    this.title.position.set(16, 14);
    this.root.addChild(this.title);

    this.metronomeLabel = new PIXI.Text({
      text: "Metronome",
      style: {
        fill: 0xe2e8f0,
        fontFamily: "Arial",
        fontSize: 14,
      },
    });
    this.metronomeLabel.position.set(16, 52);
    this.root.addChild(this.metronomeLabel);

    this.metronomeButton = new UIButton({
      width: 160,
      height: 34,
      label: "On",
      onClick: onToggleMetronome,
    });
    this.metronomeButton.position.set(180, 46);
    this.root.addChild(this.metronomeButton);

    this.volumeLabel = new PIXI.Text({
      text: "Tick Volume",
      style: {
        fill: 0xe2e8f0,
        fontFamily: "Arial",
        fontSize: 14,
      },
    });
    this.volumeLabel.position.set(16, 98);
    this.root.addChild(this.volumeLabel);

    this.volumeButton = new UIButton({
      width: 160,
      height: 34,
      label: "Medium",
      onClick: onCycleVolume,
    });
    this.volumeButton.position.set(180, 92);
    this.root.addChild(this.volumeButton);

    this.hintText = new PIXI.Text({
      text: "Press O to close",
      style: {
        fill: 0x94a3b8,
        fontFamily: "Arial",
        fontSize: 12,
      },
    });
    this.hintText.position.set(16, height - 28);
    this.root.addChild(this.hintText);

    this.root.visible = false;
  }

  public setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  public setMetronomeEnabled(enabled: boolean): void {
    this.metronomeButton.setLabel(enabled ? "On" : "Off");
  }

  public setTickVolumeLabel(label: string): void {
    this.volumeButton.setLabel(label);
  }

  public updateLayout(width: number, height: number): void {
    this.root.updateLayout(width, height);
  }
}
