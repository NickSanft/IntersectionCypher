export interface DialogChoice {
  text: string;
  next?: string;
  call?: string;
}

export interface DialogNode {
  text: string;
  next?: string;
  choices?: DialogChoice[];
}

export interface DialogData {
  start: string;
  nodes: Record<string, DialogNode>;
}

export type DialogCallMap = Record<string, () => void>;

export class DialogEngine {
  private data: DialogData;
  private callMap: DialogCallMap;
  private currentId: string | null = null;

  constructor(data: DialogData, callMap: DialogCallMap) {
    this.data = data;
    this.callMap = callMap;
  }

  public get isOpen(): boolean {
    return this.currentId !== null;
  }

  public get currentNodeId(): string | null {
    return this.currentId;
  }

  public get currentNode(): DialogNode | null {
    if (!this.currentId) {
      return null;
    }
    return this.data.nodes[this.currentId] ?? null;
  }

  public start(): void {
    this.currentId = this.data.start;
  }

  public close(): void {
    this.currentId = null;
  }

  public advance(): void {
    const node = this.currentNode;
    if (!node) {
      this.close();
      return;
    }
    if (node.next) {
      this.currentId = node.next;
    } else {
      this.close();
    }
  }

  public choose(index: number): void {
    const node = this.currentNode;
    if (!node || !node.choices || !node.choices[index]) {
      return;
    }

    const choice = node.choices[index];
    if (choice.call && this.callMap[choice.call]) {
      this.callMap[choice.call]();
    }

    if (choice.next) {
      this.currentId = choice.next;
    } else {
      this.close();
    }
  }
}
