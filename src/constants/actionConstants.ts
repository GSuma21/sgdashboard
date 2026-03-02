export const ACTIONS = {
    LIKE: "like",
    SHARE: "share",
    DOWNLOAD: "download"
  } as const;


  export const APP_LIMITS = {
    STORY_ID_QUERY_LIMIT: 100
  } as const;

export const SVG_COLORS = [
    '#5A4591',
    '#9A4F9A',
    '#FD9A2E',
    '#962316',
    '#D23B43',
    '#EF5588'
];

export type BrowserId = string;
  
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
  