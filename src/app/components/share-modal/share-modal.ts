import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './share-modal.html',
  styleUrl: './share-modal.css'
})
export class ShareModal {

  shareLink = '';
  shareText = `This story really stayed with me, and I wanted to share it with you. Do take a moment to read it and help amplify these voices from the ground.`;

  constructor(
    private dialogRef: MatDialogRef<ShareModal>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {
    this.shareLink =
      `${window.location.origin}/voices-from-the-ground?storyId=${this.data.storyId}`;
  }

  closeModal() {
    this.dialogRef.close();
  }

async copyText() {
  const textToCopy = `${this.shareText}\n\n${this.shareLink}`;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
      this.showSnackBar('Link & text copied to clipboard');
      this.dialogRef.close('ok');
      return;
    }

    const el = document.createElement('textarea');
    el.value = textToCopy;
    document.body.appendChild(el);
    el.select();

    const success = document.execCommand('copy');
    document.body.removeChild(el);

    if (!success) {
      throw new Error('execCommand failed');
    }

    this.showSnackBar('Link & text copied to clipboard');
    this.dialogRef.close('ok');

  } catch {
    this.showSnackBar('Failed to copy link & text. Please copy manually.');
  }
}


  share(platform: 'linkedin' | 'whatsapp' | 'facebook' | 'instagram') {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && 'share' in navigator) {
      this.shareNative();
      return;
    }

    const url = encodeURIComponent(this.shareLink);
    const text = encodeURIComponent(this.shareText);

    const shareUrls: Record<string, string> = {
      linkedin: environment.linkedin + url,
      whatsapp: environment.whatsapp + `text=${text}%0A%0A${url}`,
      facebook: environment.facebook + url,
      instagram: environment.instagram,
    };

    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
    this.dialogRef.close('ok');
  }

  private shareNative(): void {
    if (!('share' in navigator)) {
      return;
    }

    navigator.share({
      title: 'Voices from the Ground',
      text: this.shareText,
      url: this.shareLink,
    }).then(() => {
      this.dialogRef.close('ok');
    }).catch(() => {
      this.showSnackBar('Sharing cancelled');
    });
  }

  showSnackBar(
    message: string,
    duration: number = 3000,
    horizontalPosition: 'left' | 'center' | 'right' = 'right',
    verticalPosition: 'top' | 'bottom' = 'top'
  ) {
    this.snackBar.open(message, '', {
      duration,
      horizontalPosition,
      verticalPosition,
    });
  }
}