import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IndicatorCardComponent } from '../../components/indicator-card/indicator-card';
import * as d3 from 'd3';

import { PartnerLogosComponent } from '../../components/partner-logos/partner-logos';
import { CarouselComponent } from '../../components/carousel/carousel';
import { LineChartComponent } from '../../components/line-chart/line-chart';
import { PieChartComponent } from '../../components/pie-chart/pie-chart';
import { CountryView } from '../country-view/country-view';
import { DASHBOARD_PAGE } from '../../../constants/urlConstants';
import { environment } from '../../../../environments/environment';
import { LoaderRunnerService } from '../../services/loader-runner.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IndicatorCardComponent, PartnerLogosComponent, CarouselComponent, LineChartComponent, PieChartComponent,CountryView],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  pageData: any = {};
  window: any = window;
  selectedState: string | null = null;

  constructor(private router: Router, private loaderRunner: LoaderRunnerService) { }

  ngOnInit(): void {
    this.fetchPageData();
  }

  async fetchPageData() {
    await this.loaderRunner.run(async () => {
    return d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${DASHBOARD_PAGE}`).then((data: any) => {
      this.pageData = data;
      this.prepareLogosForScrolling();
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  });
  }

  openCommunityDetails() {
    this.router.navigate(['/community-led-improvements']);
  }

  prepareLogosForScrolling(): void {
    const partnerLogosSection = this.pageData.sections.find((s:any) => s.type === 'partner-logos');
    if (partnerLogosSection && partnerLogosSection.partners) {
      this.pageData.allLogos = partnerLogosSection.partners.flatMap((p:any) => p.logos);
    }
  }

  onStateSelected(state: string): void {
    this.router.navigate(['/state-view', state]);
  }
}
