import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShareService {

  private isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  canNativeShare(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'share' in navigator &&
      this.isMobileDevice()
    );
  }

  nativeShare(storyId: string): Promise<void> {
    if (!this.canNativeShare()) {
      return Promise.reject(
        new Error('Native share is not supported on this platform')
      );
    }

    return navigator.share({
      text: environment.shareText,
      url: `${window.location.origin}/voices-from-the-ground?storyId=${encodeURIComponent(
        storyId
      )}`,
    });
  }
}
