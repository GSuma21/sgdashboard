import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef , MatDialogModule} from '@angular/material/dialog';
import { ACTIONS,ActionType } from '../../../constants/actionConstants';
import { firebaseService } from '../../../firebase/firestore-service';
import { UtilsService } from '../../services/utils.services';
import { MatDialog } from '@angular/material/dialog';
import { ShareModal } from '../share-modal/share-modal';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, exhaustMap, groupBy, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-story-model',
  standalone: true,
  imports: [CommonModule, MatIconModule,MatDialogModule],
templateUrl: './story-model.html',
  styleUrl: './story-model.css'
})
export class StoryModel implements OnInit {
  ACTIONS = ACTIONS;
  isLangOn = false;
  storyLiked:any;
  currentStory: any;
  @Output() close = new EventEmitter<void>();
  private action$ = new Subject<{ story: any; action: ActionType }>();
  private actionSub!: Subscription;


  constructor(
    private dialogRef: MatDialogRef<StoryModel>,
    @Inject(MAT_DIALOG_DATA) public story: any,
    private sg:firebaseService,
    private util:UtilsService,
    private dialog: MatDialog
  ) {
    this.setStoryByLangIndex(0);
    this.actionSub = this.action$
    .pipe(
    groupBy(({ action }) => action),
    mergeMap((group$) =>
      group$.pipe(
      debounceTime(1000),
      exhaustMap(({ story, action }) =>
        this.processAction(story, action)
        )
      )
      )
    )
    .subscribe({
      next: (res:any) => {
        if (!res?.action || res.action === ACTIONS.LIKE ) return;


        if (res.action === ACTIONS.SHARE) {
          this.currentStory = {
            ...this.currentStory,
            shareCount: (this.currentStory.shareCount ?? 0) + res.diff
          };
        }
      },
      error: (err) => console.error('Action failed:', err)
    });
  }

  ngOnInit(): void {
    this.storyLiked = this.story?.like;
  }

  async handleUserClick(story:any,action: ActionType){
    if (action === ACTIONS.SHARE) {
      this.openShareModal();
      return;
    }

    if (action === ACTIONS.LIKE){
      this.updateLikeState(story);
    }

    this.action$.next({ story, action });
  }

  updateLikeState(story: any) {
    const nextLiked = !this.storyLiked;
    this.storyLiked = nextLiked;
    this.currentStory.like = Number(nextLiked);
    this.currentStory.likesCount = Math.max(
      (this.currentStory.likesCount ?? 0) + (nextLiked ? 1 : -1),
      0
    );
  }

  async processAction(story: any, action: ActionType) {
    return this.sg.updateRecord(
      story,
      this.util.getBrowserId(),
      action
    );
  }

  toggleLanguage() {
    this.isLangOn = !this.isLangOn
    const langIndex = this.isLangOn ? 1 : 0;
    this.setStoryByLangIndex(langIndex);
  }

  closeModal() {
    this.story = {
      ...this.story,
      likesCount:this.currentStory.likesCount,
      shareCount:this.currentStory.shareCount,
      like:this.currentStory.like
    }
    this.dialogRef.close(this.story);
  }

  setStoryByLangIndex(index: number) {
    const langObj = this.story?.lang?.[index];
    const lang = this.story?.lang?.[index === 0 ? 1 : 0];

    if (!langObj?.data) {
      console.warn('Language data not found for index:', index);
      this.currentStory = {
        ...this.story,
        activeLangCode: ''
      };
      return;
    }

    this.currentStory = {
      ...this.story,
      ...langObj.data,
      activeLangCode: lang?.code?.slice(0, 3) ?? ''
    };
  }

  openShareModal(): void {
    const dialogRef=this.dialog.open(ShareModal, {
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
          story: this.currentStory,
          action: ACTIONS.SHARE
        });
      }
    });
  }


  ngOnDestroy(): void {
    this.actionSub?.unsubscribe();
    this.action$.complete(); 
  }

}
