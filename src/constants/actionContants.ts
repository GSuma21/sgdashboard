export const ACTIONS = {
    LIKE: "like",
    SHARE: "share",
    DOWNLOAD: "download"
  } as const;
  
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
  