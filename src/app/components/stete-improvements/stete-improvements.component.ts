import { CommonModule } from '@angular/common';
import { Component, OnInit,ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CountryView } from '../../pages/country-view/country-view';
import { CarouselComponent } from '../carousel/carousel';
import { IndicatorCardComponent } from '../indicator-card/indicator-card';
import { PartnerLogosComponent } from '../partner-logos/partner-logos';
import { LineChartComponent } from '../../components/line-chart/line-chart';
import { PieChartComponent } from '../../components/pie-chart/pie-chart';
import * as d3 from 'd3';
import { StateView } from '../../pages/state-view/state-view';
import { MetricsListComponent } from '../metrics-list/metrics-list';
import { environment } from '../../../../environments/environment';
import { STATE_DETAILS_PAGE } from '../../../constants/urlConstants';
import { ProgramsReportListComponent } from '../programs-report-list/programs-report-list.component';


@Component({
  selector: 'app-stete-improvements',
  standalone:true,
  imports:[CommonModule, RouterModule, IndicatorCardComponent, PartnerLogosComponent, CarouselComponent, LineChartComponent, PieChartComponent,CountryView, StateView, MetricsListComponent,ProgramsReportListComponent],
  templateUrl: './stete-improvements.component.html',
  styleUrls: ['./stete-improvements.component.css']
})
export class StateImprovementsComponent implements OnInit {
  pageData: any = {};
  stateName: string = "";
  stateCode: any
  baseUrl:any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`
  pageConfig:any;
  programsList:any = [];
  @ViewChild('programsSection', { read: ElementRef }) programsSection!: ElementRef;
  stateLedMission = 0

  constructor(private route: ActivatedRoute) {
    route.data.subscribe((data:any)=>{
      this.pageConfig = data
      console.log(this.pageConfig)
    })
  }

  scrollToPrograms() {
    if (this.programsSection) {
      this.programsSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnInit(): void {
    // Subscribe to route parameter changes to reload data when the state changes
    this.route.paramMap.subscribe(params => {
      this.stateName = params.get('state') || "";
      this.stateCode = params.get("code")
    });
     this.fetchPageData();
     this.getProgramsList();
  }

  fetchPageData(): void {
    if (!this.stateName) {
      console.error('State name is missing from the route.');
      return;
    }

     d3.json(`${this.baseUrl}/${this.pageConfig.jsonPath}`).then((data: any) => {
      this.pageData = data;
      this.prepareLogosForScrolling();
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

  getProgramsList() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/states/${this.stateCode}/${this.pageConfig.type == "communityDetails"? 'WLC':'state-program'}.json`).then((data: any) => {
      this.programsList= data
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

  getMetricsData(data:any){
    let stateLedProgramValue = data.find((item:any) => item.identifier == "slm")
    this.stateLedMission = stateLedProgramValue.value
  }


}
