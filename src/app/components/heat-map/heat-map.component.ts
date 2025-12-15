import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export interface HeatmapTheme {
  id: string;
  title: string;
  count: number;
  color: string; // CSS class or hex
  gridClass: string; // For grid layout positioning/sizing
  icon?: string; // Placeholder for icon name
}

export interface VoiceQuote {
  id: string;
  text: string;
  author: string;
  themeId: string;
  color: string; // To match the theme
}

@Component({
  selector: 'app-heat-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heat-map.component.html',
  styleUrl: './heat-map.component.scss',
  animations: [
    trigger('voicesAnimation', [
      transition('* => *', [ // Trigger when the list changes
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query(':leave', [
          animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
        ], { optional: true })
      ])
    ])
  ]
})
export class HeatMapComponent {
  @Input() themes: HeatmapTheme[] = [];
  @Input() allVoices: VoiceQuote[] = [];

  activeThemeId: string | null = null;
  displayedVoices: VoiceQuote[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['themes'] && this.themes.length > 0 && !this.activeThemeId) {
      // Default to the first theme if none selected
      this.setActiveTheme(this.themes[0].id);
    }
  }

  setActiveTheme(themeId: string): void {
    this.activeThemeId = themeId;
    this.displayedVoices = this.allVoices.filter(v => v.themeId === themeId);
  }
}
