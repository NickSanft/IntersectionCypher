import * as PIXI from "pixi.js";
import { UIElement } from "../../ui/UIElement";

export interface RunSummaryStats {
  shotsOnBeat: number;
  shotsTotal: number;
  accuracy: number;
  bpm: number;
  timeSeconds: number;
}

const formatTime = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export class RunSummaryUI {
  public readonly root: UIElement;
  private readonly background: PIXI.Graphics;
  private readonly title: PIXI.Text;
  private readonly statsText: PIXI.Text;
  private readonly hintText: PIXI.Text;

  constructor(width: number, height: number) {
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
      text: "Run Summary",
      style: {
        fill: 0xf8fafc,
        fontFamily: "Arial",
        fontSize: 18,
        fontWeight: "700",
      },
    });
    this.title.position.set(16, 14);
    this.root.addChild(this.title);

    this.statsText = new PIXI.Text({
      text: "",
      style: {
        fill: 0xe2e8f0,
        fontFamily: "Arial",
        fontSize: 14,
        lineHeight: 20,
      },
    });
    this.statsText.position.set(16, 50);
    this.root.addChild(this.statsText);

    this.hintText = new PIXI.Text({
      text: "Press R to close",
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

  public setStats(stats: RunSummaryStats): void {
    const total = stats.shotsTotal;
    const onBeat = stats.shotsOnBeat;
    const accuracy = Math.max(0, Math.min(100, Math.round(stats.accuracy)));
    this.statsText.text =
      `On-beat accuracy: ${accuracy}%\n` +
      `Shots on beat: ${onBeat}/${total}\n` +
      `Current BPM: ${stats.bpm}\n` +
      `Run time: ${formatTime(stats.timeSeconds)}`;
  }

  public updateLayout(width: number, height: number): void {
    this.root.updateLayout(width, height);
  }
}
