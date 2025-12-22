import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { firebaseService } from '../../../firebase/firestore-service';
import { ACTIONS, ActionType } from '../../../constants/actionConstants';
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
  @Input() browserId!: string;
  @Input() storyOfWeek:boolean = false;
  @Output() actionProcessed = new EventEmitter<any>();

  constructor(private sg:firebaseService) {}

  async handleUserClick(story: any, action: ActionType) { 
    try {
      const res = await this.sg.updateRecord(
        action === ACTIONS.LIKE? { ...story, like: story.like ? 0 : 1 }: story,
        this.browserId,
        action,
      );
  
      res?.status && this.actionProcessed.emit(res);
    } catch (err) {
      console.error(err);
    }
  }
  
  
}
