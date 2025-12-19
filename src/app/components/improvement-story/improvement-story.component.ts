import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { StoryModel } from '../story-model/story-model';
import { ShareModal } from '../share-modal/share-modal';

@Component({
  selector: 'app-improvement-story',
  standalone: true,
  imports: [CommonModule, StoryModel, ShareModal],
  templateUrl: './improvement-story.component.html',
  styleUrl: './improvement-story.component.scss'
})
export class ImprovementStoryComponent {
  @Input() story:any = [];
  @Input() storyOfWeek:boolean = false;
  showStoryModal = false;
  showShareModal = false;
}
