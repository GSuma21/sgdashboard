import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IndicatorCardComponent } from '../../components/indicator-card/indicator-card';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { LANDING_PAGE } from '../../../constants/urlConstants';

import { PartnerLogosComponent } from '../../components/partner-logos/partner-logos';
import { CarouselComponent } from '../../components/carousel/carousel';
import { CountryView } from '../country-view/country-view';
import { CatalysingNetwork1 } from '../catalysing-network-1/catalysing-network-1';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { GlobalMap2 } from '../global-map-2/global-map-2';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, IndicatorCardComponent, PartnerLogosComponent, CarouselComponent, CountryView, CatalysingNetwork1, GlobalMap2],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css'],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', [animate('800ms ease-in-out')]),
    ])
  ]
})
export class LandingComponent implements OnInit, AfterViewInit {

  pageData: any = [];
  window: any = window;
  isGlobalMapVisible = true; 

  constructor() { }

  ngOnInit(): void {
    this.fetchPageData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.isGlobalMapVisible = false;
    }, 1000); 
  }

  fetchPageData(): void {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${LANDING_PAGE}`).then((data: any) => {
      this.pageData = data;
      console.log(data)
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

}
