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
  @Output() pauseCarousel = new EventEmitter<boolean>();
  @Output() resumeCarousel = new EventEmitter<boolean>();


  constructor(private sg:firebaseService,private dialog: MatDialog) {}

  async handleUserClick(story: any, action: ActionType) {
    this.pauseCarousel.emit(false);

    try {
      if (action === ACTIONS.SHARE) {
        this.openShareModal();
        return;
      }

      const res = await this.sg.updateRecord(
        { ...story,
          like: story.like ? 0 : 1
        },
        this.browserId,
        action,
      );

      res?.status && this.storyAction.emit(res);
    } catch (err) {
      console.error(err);
    }
  }

  openStoryModal(): void {
    this.pauseCarousel.emit(true);

    const dialogRef = this.dialog.open(StoryModel, {
      width: '900px',
      panelClass: 'story-dialog',
      autoFocus: false,
      data: this.story,
    });

    dialogRef.afterClosed().subscribe(result => {
      this.resumeCarousel.emit(true);

      if (!result) return;
      this.storyAction.emit(result);
    });
  }

  openShareModal(): void {
    this.pauseCarousel.emit(true);
    const dialogRef = this.dialog.open(ShareModal, {
      width: '520px',
      panelClass: 'share-dialog',
      autoFocus: false,
      data:{
        storyId:this.story.id
      }
    });

    dialogRef.afterClosed().subscribe(async (res) => {
      this.resumeCarousel.emit(true);
      if(res === 'ok'){
        try {
          const res = await this.sg.updateRecord(
            this.story,
            this.browserId,
            ACTIONS.SHARE,
          );
          this.storyAction.emit(res);
        } catch (error) {
          console.error('Failed to update share count:', error);
        }
      }
    });
  }
}
