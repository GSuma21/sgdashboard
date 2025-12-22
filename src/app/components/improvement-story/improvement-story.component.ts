import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { StoryModel } from '../story-model/story-model';
import { ShareModal } from '../share-modal/share-modal';
import { MatIconModule } from '@angular/material/icon';

type ModalType = 'story' | 'share';
@Component({
  selector: 'app-improvement-story',
  standalone: true,
  imports: [CommonModule, StoryModel, ShareModal, MatIconModule],
  templateUrl: './improvement-story.component.html',
  styleUrl: './improvement-story.component.scss'
})
export class ImprovementStoryComponent {
  @Input() story:any = [];
  @Input() storyOfWeek:boolean = false;

  modals:any = {
    story: false,
    share: false
  };

  toggleModal(type: ModalType, state: boolean): void {
    this.modals[type] = state;
  }
}
