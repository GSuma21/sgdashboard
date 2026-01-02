import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { firebaseService } from '../../../firebase/firestore-service';
import { ACTIONS, ActionType } from '../../../constants/actionConstants';
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
  ACTIONS = ACTIONS;
  @Input() browserId!: string;
  @Input() storyOfWeek:boolean = false;
  @Input() story: any;
  @Output() storyAction = new EventEmitter<any>();
  @Input() customClass: any;
  @Output() pauseCarousel = new EventEmitter<void>();
  @Output() resumeCarousel = new EventEmitter<void>();
  

  constructor(private sg:firebaseService,private dialog: MatDialog) {}

  async handleUserClick(story: any, action: ActionType) {
    this.pauseCarousel.emit();
  
    try {
      if (action === ACTIONS.SHARE) {
        this.openShareModal();
      }
  
      const res = await this.sg.updateRecord(
        action === ACTIONS.LIKE ? { ...story, like: story.like ? 0 : 1 } : story,
        this.browserId,
        action,
      );
  
      res?.status && this.storyAction.emit(res);
    } catch (err) {
      console.error(err);
    }
  }
  
  openStoryModal(): void {
    this.pauseCarousel.emit();
  
    const dialogRef = this.dialog.open(StoryModel, {
      width: '900px',
      panelClass: 'story-dialog',
      autoFocus: false,
      data: this.story,
    });
  
    dialogRef.afterClosed().subscribe(result => {
      this.resumeCarousel.emit();
  
      if (!result) return;
      this.storyAction.emit(result);
    });
  }
  
  openShareModal(): void {
    const dialogRef = this.dialog.open(ShareModal, {
      width: '520px',
      panelClass: 'share-dialog',
      autoFocus: false
    });
  
    dialogRef.afterClosed().subscribe(() => {
      this.resumeCarousel.emit();
    });
  }
}
