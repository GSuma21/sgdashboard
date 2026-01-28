import { Component, Inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
type SharePlatform = 'linkedin' | 'whatsapp' | 'facebook' | 'instagram';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './share-modal.html',
  styleUrl: './share-modal.css'
})
export class ShareModal {
  @ViewChild('dialogToast', { static: true })
  dialogToast!: TemplateRef<any>;
  shareLink = '';
  shareText = environment.shareText

  constructor(
    private dialogRef: MatDialogRef<ShareModal>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {
    this.shareLink =
      `${window.location.origin}/voices-from-the-ground?storyId=${this.data.storyId}`;
  }

  closeModal() {
    this.dialogRef.close();
  }

async copyText() {
  const textToCopy = `${environment.shareText}\n\n${this.shareLink}`;

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

  share(platform: SharePlatform) {
    const url = encodeURIComponent(this.shareLink);
    const text = encodeURIComponent(this.shareText);
  
    const shareUrls: Record<string, string> = {
      linkedin: environment.linkedin + `${url}`,
      whatsapp: environment.whatsapp + `text=${text}%0A%0A` + `${url}`,
      facebook: environment.facebook + `${url}`,
      instagram: environment.instagram,
    };
  
    this.dialogRef.close('ok');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
    if (platform === 'instagram') {
      if (isMobile) {
        window.location.href = 'instagram://app';

        setTimeout(() => {
          window.open(environment.instagram, '_blank', 'noopener,noreferrer');
        }, 1500);
      } else {
        window.open(environment.instagram, '_blank', 'noopener,noreferrer');
      }
      return;
    }
  
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
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
    if (!this.dialogToast) {
      console.error('dialogToast template not found');
      return;
    }

    const position: any = {};
    position[verticalPosition] = '16px';

    if (horizontalPosition === 'center') {
      position.left = '50%';
    } else {
      position[horizontalPosition] = '16px';
    }

    // 🔹 Open a dialog on top of the existing dialog
    const dialogRef = this.dialog.open(this.dialogToast, {
      data: message,           // pass message directly
      panelClass: 'toast-dialog',
      hasBackdrop: false,      // no backdrop
      disableClose: true,
      position,
      width: 'auto',
      maxWidth: '90vw'
    });

    // 🔹 Close this toast dialog only
    setTimeout(() => dialogRef.close(), duration);
  }
}