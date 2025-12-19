import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { SgFirebaseService } from '../../../firebase/firestore-service';
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
  @Output() actionCompleted = new EventEmitter<any>();

  constructor(private sg:SgFirebaseService) {}

  async onAction(storyId: any, action: ActionType) {
    try {
      const res = await this.sg.updateAction(
        storyId,
        this.browserId,
        action
      );
      if(res?.status){
        this.actionCompleted.emit(res);
      }
  
    } catch (err) {
      console.error(err);
    }
  }
  
  
}
