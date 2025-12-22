import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { StoryModel } from '../story-model/story-model';
import { ShareModal } from '../share-modal/share-modal';

@Component({
  selector: 'app-improvement-story',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './improvement-story.component.html',
  styleUrl: './improvement-story.component.scss'
})
export class ImprovementStoryComponent {
  @Input() story: any;
  @Input() storyOfWeek = false;

  constructor(private dialog: MatDialog) {}

  openStoryModal(): void {
    this.dialog.open(StoryModel, {
      width: '900px',
      panelClass: 'story-dialog',
      autoFocus: false
    });
  }

  openShareModal(): void {
    this.dialog.open(ShareModal, {
      width: '520px',
      panelClass: 'share-dialog',
      autoFocus: false
    });
  }
}
