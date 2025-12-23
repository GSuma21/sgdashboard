export const ACTIONS = {
    LIKE: "like",
    SHARE: "share",
    DOWNLOAD: "download"
  } as const;


  export const APP_LIMITS = {
    STORY_ID_QUERY_LIMIT: 100
  } as const;

export type BrowserId = string;
  
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
  