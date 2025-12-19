import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ACTIONS, BrowserId } from '../../constants/actionConstants';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {

    constructor() {}

    getBrowserId():BrowserId {
        let id = localStorage.getItem("browserId");
    
        if (!id) {
          id = uuidv4();
          localStorage.setItem("browserId", id);
        }
    
        return id;
    }

    updateStoryCounts(list: any[],event:any): any[] {
      return list.map((slide: any) => {
        if (String(slide.storyId) !== String(event.storyId)) {
          return slide;
        }
    
        switch (event.action) {
          case ACTIONS.LIKE:
            return {
              ...slide,
              likesCount: slide.likesCount + event.diff
            };
    
          case ACTIONS.SHARE:
            return {
              ...slide,
              shareCount: slide.shareCount + 1
            };
    
          case ACTIONS.DOWNLOAD:
            return {
              ...slide,
              downloadCount: slide.downloadCount + 1
            };
    
          default:
            return slide;
        }
      });
    }


    applyCountsToList(
      list: any[],
      countsArray: any[]
    ): any[] {
      const countsMap = new Map(
        countsArray.map(item => [item.storyId, item])
      );
    
      return list.map(item => {
        const counts = countsMap.get(item.storyId);
    
        return {
          ...item,
          likesCount: counts?.likesCount ?? 0,
          shareCount: counts?.shareCount ?? 0,
          downloadCount: counts?.downloadCount ?? 0
        };
      });
    }
    
    


 
}
