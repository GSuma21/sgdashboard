import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { SgFirebaseService } from '../../../firebase/firestore-service';
import { v4 as uuidv4 } from 'uuid'
import { ACTIONS, ActionType } from '../../../constants/actionContants';

@Component({
  selector: 'app-improvement-story',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './improvement-story.component.html',
  styleUrl: './improvement-story.component.scss'
})
export class ImprovementStoryComponent {
  ACTIONS = ACTIONS;
  @Input() story:any = [];
  @Input() storyOfWeek:boolean = false;

  constructor(private sg:SgFirebaseService) {}

  getBrowserId() {
    let id = localStorage.getItem("browserId");
  
    if (!id) {
      id = uuidv4();
      localStorage.setItem("browserId", id);
    }
  
    return id;
  }

  async onAction(storyId: any, action: ActionType) {

    const browserId = this.getBrowserId();
    const record: any = await this.sg.getRecord(storyId, browserId);
  
    if (!record) {
      await this.sg.createRecord(storyId, browserId, {
        like: action === ACTIONS.LIKE ? 1 : 0,
        share: action === ACTIONS.SHARE ? 1 : 0,
        download: action === ACTIONS.DOWNLOAD ? 1 : 0
      });
      return;
    }
  
    const oldValue = record[action] || 0;
  
    const newValue =
      action === ACTIONS.LIKE
        ? oldValue === 1 ? 0 : 1  
        : oldValue + 1; 
  
    await this.sg.updateRecord(storyId, browserId, {
      [action]: newValue
    });
  }
  
  
}
