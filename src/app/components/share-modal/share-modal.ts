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

  copyLink(input: HTMLInputElement) {
    input.select();
    document.execCommand('copy');
  }
}
