import * as PIXI from "pixi.js";

import type { QuestEntry } from "../../game/data/Quest";

export class QuestMenu extends PIXI.Container {
  private flags: Record<string, boolean>;
  private quests: QuestEntry[];
  private widthPx = 0;
  private heightPx = 0;

  constructor(flags: Record<string, boolean>, quests: QuestEntry[]) {
    super();
    this.flags = flags;
    this.quests = quests;
  }

  public setData(flags: Record<string, boolean>, quests: QuestEntry[]): void {
    this.flags = flags;
    this.quests = quests;
    if (this.widthPx > 0 && this.heightPx > 0) {
      this.resize(this.widthPx, this.heightPx);
    }
  }

  public resize(width: number, height: number): void {
    if (this.widthPx === width && this.heightPx === height) {
      return;
    }
    this.widthPx = width;
    this.heightPx = height;
    this.removeChildren();

    const panel = new PIXI.Graphics();
    panel.beginFill(0x0b1220, 0.85);
    panel.lineStyle(1, 0x1e293b, 1);
    panel.drawRoundedRect(0, 0, width, height, 10);
    panel.endFill();
    this.addChild(panel);

    const title = new PIXI.Text({
      text: "Quest Log",
      style: {
        fill: 0xe2e8f0,
        fontFamily: "Arial",
        fontSize: 16,
        fontWeight: "700",
      },
    });
    title.position.set(16, 12);
    this.addChild(title);

    const questLines = this.quests.length
      ? this.quests
          .map(
            (quest) =>
              `${quest.completed ? "[x]" : "[ ]"} ${quest.title}\n  ${quest.description}`
          )
          .join("\n\n")
      : "No active quests";

    const questList = new PIXI.Text({
      text: questLines,
      style: {
        fill: 0xcbd5f5,
        fontFamily: "Arial",
        fontSize: 12,
        lineHeight: 18,
        wordWrap: true,
        wordWrapWidth: width - 32,
      },
    });
    questList.position.set(16, 44);
    this.addChild(questList);

    const flagTitle = new PIXI.Text({
      text: "Flags",
      style: {
        fill: 0xe2e8f0,
        fontFamily: "Arial",
        fontSize: 14,
        fontWeight: "700",
      },
    });
    const flagY = Math.min(height - 120, questList.position.y + questList.height + 24);
    flagTitle.position.set(16, flagY);
    this.addChild(flagTitle);

    const entries = Object.entries(this.flags);
    const flagLines = entries.length
      ? entries.map(([key, value]) => `${value ? "[x]" : "[ ]"} ${key}`).join("\n")
      : "No flags";

    const flagList = new PIXI.Text({
      text: flagLines,
      style: {
        fill: 0x94a3b8,
        fontFamily: "Arial",
        fontSize: 11,
        lineHeight: 16,
      },
    });
    flagList.position.set(16, flagY + 22);
    this.addChild(flagList);
  }
}
