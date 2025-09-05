import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IndicatorCardComponent } from '../../components/indicator-card/indicator-card';
import * as d3 from 'd3';

import { PartnerLogosComponent } from '../../components/partner-logos/partner-logos';
import { CarouselComponent } from '../../components/carousel/carousel';
import { LineChartComponent } from '../../components/line-chart/line-chart';
import { PieChartComponent } from '../../components/pie-chart/pie-chart';
import { CountryView } from '../country-view/country-view';
import { SliderCarouselComponent } from '../../components/slider-carousel/slider-carousel';
import { CatalysingNetwork1 } from '../catalysing-network-1/catalysing-network-1';
import { NETWORK_HEALTH_PAGE } from '../../../constants/urlConstants';
import { environment } from '../../../../environments/environment';
import { WorldMapComponent } from '../world-map/world-map';

@Component({
  selector: 'app-network-health',
  standalone:true,
  imports:[CommonModule, RouterModule, IndicatorCardComponent, PartnerLogosComponent, CarouselComponent, LineChartComponent, PieChartComponent,CountryView, SliderCarouselComponent, CatalysingNetwork1, WorldMapComponent],
  templateUrl: './network-health.html',
  styleUrls: ['./network-health.css']
})
export class NetworkHealth implements OnInit {

  pageData: any = {};
  baseUrl:any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`

  constructor() { }

  ngOnInit(): void {
    this.fetchPageData();
  }

  fetchPageData(): void {
    d3.json(`${this.baseUrl}/${NETWORK_HEALTH_PAGE}`).then((data: any) => {
      this.pageData = data;
      this.prepareLogosForScrolling();
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

  prepareLogosForScrolling(): void {
    const partnerLogosSection = this.pageData.sections.find((s:any) => s.type === 'partner-logos');
    if (partnerLogosSection && partnerLogosSection.partners) {
      this.pageData.allLogos = partnerLogosSection.partners.flatMap((p:any) => p.logos);
    }
  }

}
