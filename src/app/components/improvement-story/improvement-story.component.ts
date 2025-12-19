import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { StoryModel } from '../story-model/story-model';

@Component({
  selector: 'app-improvement-story',
  standalone: true,
  imports: [CommonModule, StoryModel],
  templateUrl: './improvement-story.component.html',
  styleUrl: './improvement-story.component.scss'
})
export class ImprovementStoryComponent {

  @Input() story:any = [];
  @Input() storyOfWeek:boolean = false;
  showModal = false;

}
