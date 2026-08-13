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
import { WorldMapComponent } from '../world-map/world-map';
import { ChangeDetectorRef } from '@angular/core';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { OutcomesModelComponent } from '../../components/outcomes-model/outcomes-model.component';
import { SAMPLE_PROGRAM_OUTCOME_DATA } from '../../components/outcomes-model/outcomes-model.config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, IndicatorCardComponent, PartnerLogosComponent, CarouselComponent, CountryView, CatalysingNetwork1, GlobalMap2, WorldMapComponent, OutcomesModelComponent],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css'],
 animations: [
  trigger('fade', [
    state('visible', style({ opacity: 1, pointerEvents: 'auto', transform: 'scale(1)' })),
    state('hidden', style({ opacity: 0, pointerEvents: 'none', transform: 'scale(0.95)' })),
    transition('visible <=> hidden', [animate('800ms ease-in-out')]),
  ])
]
})
export class LandingComponent implements OnInit, AfterViewInit {

  pageData: any = [];
  window: any = window;
  isGlobalMapVisible = true; 

  programData: any = SAMPLE_PROGRAM_OUTCOME_DATA;

  constructor(private cdr: ChangeDetectorRef, private loaderRunner: LoaderRunnerService) { }

  ngOnInit(): void {
    this.fetchPageData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.isGlobalMapVisible = false;
    }, 1200); 
  }

  async fetchPageData() {
    await this.loaderRunner.run(async () => {
      return d3
        .json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${LANDING_PAGE}`)
        .then((data: any) => {
          this.pageData = data;
          this.cdr.detectChanges();
        })
        .catch((error: any) => {
          console.error('Error loading page data:', error);
        });
    });
  }
  

}
