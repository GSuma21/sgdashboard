export const ACTIONS = {
    LIKE: "like",
    SHARE: "share",
    DOWNLOAD: "download"
  } as const;

export const FIREBASE_PATHS = {
    ROOT: "sg-dashboard",
    SUB_COLLECTION: "browsers"
  } as const;

export type BrowserId = string;
  
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
  