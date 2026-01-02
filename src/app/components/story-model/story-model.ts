import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef , MatDialogModule} from '@angular/material/dialog';
import { ACTIONS,ActionType } from '../../../constants/actionConstants';
import { firebaseService } from '../../../firebase/firestore-service';
import { UtilsService } from '../../services/utils.services';
import { MatDialog } from '@angular/material/dialog';
import { ShareModal } from '../share-modal/share-modal';

@Component({
  selector: 'app-story-model',
  standalone: true,
  imports: [CommonModule, MatIconModule,MatDialogModule],
templateUrl: './story-model.html',
  styleUrl: './story-model.css'
})
export class StoryModel {
  ACTIONS = ACTIONS;
  isLangOn = false;
  currentStory: any;
  @Output() close = new EventEmitter<void>();

  constructor(
    private dialogRef: MatDialogRef<StoryModel>,
    @Inject(MAT_DIALOG_DATA) public story: any,
    private sg:firebaseService,
    private util:UtilsService,
    private dialog: MatDialog
  ) {
    this.setStoryByLangIndex(0);
  }

  async handleUserClick(story:any,action: ActionType){
    try{
      if (action === ACTIONS.SHARE) {
        this.openShareModal();
      }
      
    const res = await this.sg.updateRecord(
      action === ACTIONS.LIKE? { ...story, like: story.like ? 0 : 1 }: story,
      this.util.getBrowserId(),
      action,
    );

    if (!res || !res.action) {
      console.warn('updateRecord returned invalid response:', res);
      return;
    }
    
    this.currentStory = {
      ...this.currentStory,
      ...(res.action === ACTIONS.LIKE && {
        likesCount: (this.currentStory.likesCount ?? 0) + res.diff,
        like: !this.currentStory.like
      }),
      ...(res.action === ACTIONS.SHARE && {
        shareCount: (this.currentStory.shareCount ?? 0) + res.diff
      })
    };
    }catch (err) {
      console.error(err);
    }
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
    this.dialog.open(ShareModal, {
      width: '520px',
      panelClass: 'share-dialog',
      autoFocus: false
    });
  }
}
