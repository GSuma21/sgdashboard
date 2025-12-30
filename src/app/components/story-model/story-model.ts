import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef , MatDialogModule} from '@angular/material/dialog';
import { ACTIONS,ActionType } from '../../../constants/actionConstants';
import { firebaseService } from '../../../firebase/firestore-service';
import { UtilsService } from '../../services/utils.services';

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
  @Output() close = new EventEmitter<void>();

  constructor(
    private dialogRef: MatDialogRef<StoryModel>,
    @Inject(MAT_DIALOG_DATA) public story: any,
    private sg:firebaseService,
    private util:UtilsService,
  ) {
  }

  async handleUserClick(story:any,action: ActionType){
    const res = await this.sg.updateRecord(
      action === ACTIONS.LIKE? { ...story, like: story.like ? 0 : 1 }: story,
      this.util.getBrowserId(),
      action,
    );

    if (!res || !res.action) {
      console.warn('updateRecord returned invalid response:', res);
      return;
    }
    
    this.story = {
      ...this.story,
      ...(res.action === ACTIONS.LIKE && {
        likesCount: (this.story.likesCount ?? 0) + res.diff,
        like: !this.story.like
      }),
      ...(res.action === ACTIONS.SHARE && {
        shareCount: (this.story.shareCount ?? 0) + res.diff
      })
    };
  }

  toggleLanguage() {
    this.isLangOn = !this.isLangOn;

    const activeLangCode = this.isLangOn
    ? this.story.lang[1]?.code
    : this.story.lang[0]?.code;

  }

  closeModal() {
    this.dialogRef.close(this.story);
  }
}
