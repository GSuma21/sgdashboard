import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { environment } from '../../../../environments/environment';
import { HEATMAP_THEME, THEMES_EMERGED } from '../../../constants/urlConstants';
import * as d3 from 'd3';

export interface HeatmapTheme {
  id: string;
  label: string;
  value: number;
  color: string;
  gridClass: string;
  icon?: string;
  list?: [];
}

export interface VoiceQuote {
  id: string;
  description: string;
  voice_by: string;
  themeId: string;
  color: string;
}

@Component({
  selector: 'app-heat-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heat-map.component.html',
  styleUrl: './heat-map.component.scss',
  animations: [
    trigger('voicesAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('10ms', [
            animate('100ms ease-out', style({ opacity: 1 }))
          ])
        ], { optional: true }),
        query(':leave', [
          animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
        ], { optional: true })
      ])
    ])
  ]
})
export class HeatMapComponent implements OnInit {
  themes: HeatmapTheme[] = [];
  heatmapThemes:any
  heatmapThemeConfig: Record<string, any> = {}

  activeThemeId: string | null = null;
  displayedVoices: VoiceQuote[] = [];


  ngOnInit(): void {
    this.getThemeData()
  }

  getThemeData() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${HEATMAP_THEME}`).then((data: any) => {
      this.heatmapThemeConfig = data
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
    if (this.heatmapThemeConfig) {
      d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${THEMES_EMERGED}`).then((data: any) => {
        this.themes = (data?.data ?? []).map((item: any) => ({
          id: item.id.split(' ')[0],
          label: item.label,
          value: Number(item.value),
          list: (item.list ?? []).map((listItem: any) => ({
            ...listItem,
            color: this.heatmapThemeConfig[item.id.split(' ')[0]]?.color ?? 'gray',
          })),

          color: this.heatmapThemeConfig[item.id.split(' ')[0]]?.color ?? 'gray',
          gridClass: this.heatmapThemeConfig[item.id.split(' ')[0]]?.gridClass ?? 'span-1-1',
          icon: this.heatmapThemeConfig[item.id.split(' ')[0]]?.icon ?? ''
        }));

        if (this.themes.length > 0) {
          this.setActiveTheme(this.themes[0].id);
        }
        // this.themes= data["data"];
      }).catch((error: any) => {
        console.error('Error loading page data:', error);
      });
    }

  }

  setActiveTheme(themeId: string): void {
    this.activeThemeId = themeId;
    const activeTheme = this.themes.find(t => t.id === themeId);
    this.displayedVoices = (activeTheme?.list ?? []).slice(0, 4);
  }
}
