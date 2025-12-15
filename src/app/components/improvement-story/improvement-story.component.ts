import { Component, Input, input } from '@angular/core';

@Component({
  selector: 'app-improvement-story',
  standalone: true,
  imports: [],
  templateUrl: './improvement-story.component.html',
  styleUrl: './improvement-story.component.scss'
})
export class ImprovementStoryComponent {

  @Input() story:any = [];

}
