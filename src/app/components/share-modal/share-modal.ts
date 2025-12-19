import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './share-modal.html',
  styleUrl: './share-modal.css'
})
export class ShareModal  implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  shareLink = environment.shareLink;
  shareText = `Hello everyone, I really appreciated this story and wanted to share it with you.
  Do take a moment to read it and help spread the word.`;
  
  ngOnInit() {
    document.body.classList.add('modal-open');
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }

  closeModal() {
    this.close.emit();
  }

  async copyLink(input: HTMLInputElement) {
    try {
      await navigator.clipboard.writeText(input.value);
      this.showCopySuccess();
    } catch (error) {
      this.showCopyError();
    }
  }

  showCopySuccess() {
    alert('Link copied to clipboard');
  }
  
  showCopyError() {
    alert('Failed to copy link. Please copy manually.');
  }
  
  share(platform: 'linkedin' | 'whatsapp' | 'facebook' | 'instagram') {
    const url = encodeURIComponent(this.shareLink);
    const text = encodeURIComponent(this.shareText);
  
    const shareUrls: Record<string, string> = {
      linkedin: environment.linkedin + `${url}`,
      whatsapp: environment.whatsapp + `${url}`,
      facebook: environment.facebook + `${url}`
    };
  
    if (platform === 'instagram') {
      alert('Instagram sharing works only via mobile app. Please copy the link.');
      return;
    }
  
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
  }
  
}
