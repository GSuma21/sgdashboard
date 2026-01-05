import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './share-modal.html',
  styleUrl: './share-modal.css'
})
export class ShareModal {
  shareLink = environment.shareLink;
  shareText = `Hello everyone, I really appreciated this story and wanted to share it with you.
Do take a moment to read it and help spread the word.`;

  constructor(
    private dialogRef: MatDialogRef<ShareModal>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  closeModal() {
    this.dialogRef.close();
  }

  async copyLink(input: HTMLInputElement | HTMLTextAreaElement) {
    try {
      await navigator.clipboard.writeText(input.value);
      this.dialogRef.close('ok')
      alert('Link & text copied to clipboard');
    } catch {
      alert('Failed to copy link & text. Please copy manually.');
    }
  }

  share(platform: 'linkedin' | 'whatsapp' | 'facebook' | 'instagram') {
    const url = encodeURIComponent(this.shareLink);
    const text = encodeURIComponent(this.shareText);

    const shareUrls: Record<string, string> = {
      linkedin: environment.linkedin + `${url}`,
      whatsapp: environment.whatsapp + `text=${text}%0A%0A` +`${url}`,
      facebook: environment.facebook + `${url}`
    };

    if (platform === 'instagram') {
      alert('Instagram sharing works only via mobile app. Please copy the link.');
      return;
    }
    this.dialogRef.close('ok')
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
  }
}
