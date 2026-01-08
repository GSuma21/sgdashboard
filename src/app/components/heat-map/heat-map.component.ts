import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { environment } from '../../../../environments/environment';
import { HEATMAP_THEME, THEMES_EMERGED } from '../../../constants/urlConstants';
import * as d3 from 'd3';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  imports: [CommonModule, MatTooltipModule],
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
  heatmapData: Record<string, any> = {}

  activeThemeId: string | null = null;
  displayedVoices: VoiceQuote[] = [];


  ngOnInit(): void {
    this.getThemeData()
  }

getThemeData() {
  d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${HEATMAP_THEME}`)
    .then((heatmapData: any) => {
      this.heatmapData = heatmapData;
      console.log(heatmapData)
      return d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${THEMES_EMERGED}`);
    })
    .then((data: any) => {
      console.log(data)
       const sortedData = data.data

  const heatmapConfigs = Object.values(this.heatmapData);

  this.themes = sortedData.map((item: any, index: number) => {
    const id = item.id.split(' ')[0];

    // icon strictly by id
    const icon = this.heatmapData[id]?.icon ?? '';

    // color & layout by sorted position
    const heatmapByOrder = heatmapConfigs[index] ?? {};

    return {
      id,
      label: item.label,
      value: Number(item.value),
      list: (item.list ?? []).map((listItem: any) => ({
        ...listItem,
        color: heatmapByOrder.color ?? 'gray',
      })),
      color: heatmapByOrder.color ?? 'gray',
      gridClass: heatmapByOrder.gridClass ?? 'span-1-1',
      icon
    };
  });

  this.heatmapThemeConfig = this.heatmapData;

  if (this.themes.length > 0) {
    this.setActiveTheme(this.themes[0].id);
  }
    })
    .catch((error: any) => {
      console.error('Error loading page data:', error);
    });
}


  setActiveTheme(themeId: string): void {
    this.activeThemeId = themeId;
    const activeTheme = this.themes.find(t => t.id === themeId);
    this.displayedVoices = (activeTheme?.list ?? []).slice(0, 4);
  }
}