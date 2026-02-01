export interface QuestReward {
  upgradeId: string;
}

export const questUpgradeRewards: Record<string, QuestReward> = {
  "console-activated": { upgradeId: "rhythm-window-1" },
  "checkpoint-1": { upgradeId: "stat-speed-1" },
};
