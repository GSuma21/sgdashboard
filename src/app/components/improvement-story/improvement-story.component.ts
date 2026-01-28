import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { firebaseService } from '../../../firebase/firestore-service';
import { ACTIONS, ActionType } from '../../../constants/actionConstants';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StoryModel } from '../story-model/story-model';
import { ShareModal } from '../share-modal/share-modal';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, exhaustMap  } from 'rxjs/operators';
import { ShareService } from '../../services/share.service';

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
   private actionSub!: Subscription;


  constructor(private sg:firebaseService,private dialog: MatDialog, private shareService: ShareService) {
    this.actionSub = this.action$
    .pipe(
      debounceTime(1000),
      exhaustMap(({ story, action }) => this.processAction(story, action))
    )
    .subscribe({
      next: (res) => res?.action === ACTIONS.SHARE && this.storyAction.emit(res),
      error: (err) => console.error('Action failed:', err)
    });
  }

  async handleUserClick(story: any, action: ActionType) {
    this.pauseCarousel.emit(false);

      if (action === ACTIONS.SHARE) {
        this.openShareModal();
        return;
      }

      this.updateLikeState(story);
      

      this.action$.next({ story, action });
  }

  async processAction(story: any, action: ActionType) {
    return this.sg.updateRecord(
      story,
      this.browserId,
      action
    );
  }

  updateLikeState(story: any) {
    story.like = Number(!story.like);
    story.likesCount = Math.max(
      (story.likesCount ?? 0) + (story.like ? 1 : -1),
      0
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

      if (this.shareService.canNativeShare()) {
    this.shareService.nativeShare({
      storyId: this.story.id
    }).catch(() => {});

    return;
  }
  
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
      if(res === 'ok'){
        this.action$.next({
          story: this.story,
          action: ACTIONS.SHARE
        });
      }
      this.resumeCarousel.emit(true);
    });
  }

  ngOnDestroy(): void {
    this.actionSub?.unsubscribe();
    this.action$.complete(); 
  }

}
