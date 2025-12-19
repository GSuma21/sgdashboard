import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-story-model',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-model.html',
  styleUrl: './story-model.css'
})
export class StoryModel {

  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
