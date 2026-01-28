import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShareService {

  canNativeShare(): boolean {
    return typeof window !== 'undefined' && 'share' in navigator;
  }

  nativeShare(storyId: string): Promise<void> {
    if (!this.canNativeShare()) {
      return Promise.reject('Native share not supported');
    }

    return navigator.share({
      text: environment.shareText,
      url: `${window.location.origin}/voices-from-the-ground?storyId=${encodeURIComponent(storyId)}`
    });
  }
}

