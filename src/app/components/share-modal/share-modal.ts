import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './share-modal.html',
  styleUrl: './share-modal.css'
})
export class ShareModal  implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  shareLink = 'https://shikshagraha_dashboard.org/1+support+++';

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
    const text = encodeURIComponent('Check out this story');
  
    const shareUrls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      instagram: 'https://www.instagram.com/sharer/sharer.php?u=${url}'
    };
  
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    } else {
      alert('Instagram sharing is supported via the mobile app only.');
    }
  }
  
}
