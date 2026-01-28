import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface NativeShareData {
  storyId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShareService {

  isMobile(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

 canNativeShare(): boolean {
  return typeof window !== 'undefined' && 'share' in navigator;
}


  nativeShare(storyId: NativeShareData): Promise<void> {
    if (!this.canNativeShare()) {
      return Promise.reject('Native share not supported');
    }

    return navigator.share({
      text: environment.shareText,
      url: 
      `${window.location.origin}/voices-from-the-ground?storyId=${storyId}`
    });
  }
}
