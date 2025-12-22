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
          // Generates or retrieves a UUID used as a unique browser identifier for tracking purposes.
          id = uuidv4();
          localStorage.setItem("browserId", id);
        }
    
        return id;
    }

    updateStoryCounts(list: any[],data:any): any[] {
      return list.map((slide: any) => {

        if (slide.storyId !== data.storyId) {
          return slide;
        }
    
        switch (data.action) {
          case ACTIONS.LIKE:
            return {
              ...slide,
              likesCount: slide.likesCount + data.diff
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
 
}
