import * as PIXI from "pixi.js";

export class CharacterMenu extends PIXI.Container {
  private readonly statsText: PIXI.Text;
  private readonly gearText: PIXI.Text;

  constructor(width: number, height: number) {
    super();

    const statsPanel = new PIXI.Graphics();
    statsPanel.beginFill(0x0b1220, 0.85);
    statsPanel.lineStyle(1, 0x1e293b, 1);
    statsPanel.drawRoundedRect(0, 0, width * 0.5 - 12, height - 24, 10);
    statsPanel.endFill();
    statsPanel.position.set(0, 0);
    this.addChild(statsPanel);

    const gearPanel = new PIXI.Graphics();
    gearPanel.beginFill(0x0b1220, 0.85);
    gearPanel.lineStyle(1, 0x1e293b, 1);
    gearPanel.drawRoundedRect(0, 0, width * 0.5 - 12, height - 24, 10);
    gearPanel.endFill();
    gearPanel.position.set(width * 0.5 + 12, 0);
    this.addChild(gearPanel);

    const headerStyle: Partial<PIXI.TextStyle> = {
      fill: 0xe2e8f0,
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "700",
    };

    const statsHeader = new PIXI.Text({ text: "Status", style: headerStyle });
    statsHeader.position.set(16, 12);
    this.addChild(statsHeader);

    this.statsText = new PIXI.Text({
      text:
        "HP  120 / 120\n" +
        "Attack  24\n" +
        "Defense  18\n" +
        "Focus  12\n" +
        "Dash  1.35x\n" +
        "Guard  1.15x\n",
      style: {
        fill: 0xcbd5f5,
        fontFamily: "Arial",
        fontSize: 13,
        lineHeight: 20,
      },
    });
    this.statsText.position.set(16, 44);
    this.addChild(this.statsText);

    const gearHeader = new PIXI.Text({ text: "Equipment", style: headerStyle });
    gearHeader.position.set(width * 0.5 + 28, 12);
    this.addChild(gearHeader);

    this.gearText = new PIXI.Text({
      text:
        "Weapon: Hexa Blade\n" +
        "Body: Prism Guard\n" +
        "Arms: Flux Bracers\n" +
        "Head: Neo Visor\n",
      style: {
        fill: 0xcbd5f5,
        fontFamily: "Arial",
        fontSize: 13,
        lineHeight: 20,
      },
    });
    this.gearText.position.set(width * 0.5 + 28, 44);
    this.addChild(this.gearText);
  }
}
