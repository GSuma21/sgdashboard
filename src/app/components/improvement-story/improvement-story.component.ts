import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { firebaseService } from '../../../firebase/firestore-service';
import { ACTIONS, ActionType } from '../../../constants/actionConstants';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StoryModel } from '../story-model/story-model';
import { ShareModal } from '../share-modal/share-modal';
import { Subject } from 'rxjs';
import { debounceTime, exhaustMap  } from 'rxjs/operators';

@Component({
  selector: 'app-improvement-story',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './improvement-story.component.html',
  styleUrl: './improvement-story.component.scss'
})
export class ImprovementStoryComponent {
  private action$ = new Subject<{ story: any; action: ActionType }>();
  ACTIONS = ACTIONS;
  @Input() browserId!: string;
  @Input() storyOfWeek:boolean = false;
  @Input() story: any;
  @Output() storyAction = new EventEmitter<any>();
  @Input() customClass: any;
  @Output() pauseCarousel = new EventEmitter<boolean>();
  @Output() resumeCarousel = new EventEmitter<boolean>();


  constructor(private sg:firebaseService,private dialog: MatDialog) {
    this.action$
    .pipe(
      debounceTime(1000),
      exhaustMap(({ story, action }) => this.processAction(story, action))
    )
    .subscribe({
      next: (res) => res?.status && this.storyAction.emit(res),
      error: (err) => console.error('Action failed:', err)
    });
  }

  async handleUserClick(story: any, action: ActionType) {
    this.pauseCarousel.emit(false);

      if (action === ACTIONS.SHARE) {
        this.openShareModal();
        return;
      }

      this.action$.next({ story, action });
  }

  async processAction(story: any, action: ActionType) {
    return this.sg.updateRecord(
      action === ACTIONS.LIKE
        ? { ...story, like: story.like ? 0 : 1 }
        : story,
      this.browserId,
      action
    );
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
        this.action$.next({
          story: this.story,
          action: ACTIONS.SHARE
        });
      }
      this.resumeCarousel.emit();
    });
  }
}
