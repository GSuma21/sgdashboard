import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CountryView } from '../../pages/country-view/country-view';
import { CarouselComponent } from '../carousel/carousel';
import { IndicatorCardComponent } from '../indicator-card/indicator-card';
import { PartnerLogosComponent } from '../partner-logos/partner-logos';
import { LineChartComponent } from '../../components/line-chart/line-chart';
import { PieChartComponent } from '../../components/pie-chart/pie-chart';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { COMMUNITY_LED_IMPROVEMENT } from '../../../constants/urlConstants';
import { ProgramsReportListComponent } from '../programs-report-list/programs-report-list.component';
import { LoaderRunnerService } from '../../services/loader-runner.service';

@Component({
  selector: 'app-district-improvements',
  standalone:true,
  imports:[CommonModule, RouterModule, IndicatorCardComponent, PartnerLogosComponent, CarouselComponent, LineChartComponent, PieChartComponent,CountryView, ProgramsReportListComponent],
  templateUrl: './district-improvements.component.html',
  styleUrls: ['./district-improvements.component.css']
})
export class DistrictImprovementsComponent implements OnInit {
  pageData: any = {};
  district:string = '';
  districtCode:string = '';
  metrics:any = [];
  pieChart:any = [];
  stateName:string ='';
  stateCode:string = '';
  programsList:any = [];
  pageConfig:any = '';
  lineChart:any = [];
  dashboard:any
  metricsMappingData = [
    { icon: "assets/icons/community_leaders.svg", identifier: 1 },
    { icon: "assets/icons/community_improvements.svg", identifier: 2 },
    { icon: "assets/icons/mountain.svg", identifier: 3 },
    { icon: "assets/icons/idea.svg", identifier: 4 },
    { icon: "assets/icons/local_solutions_implemented.svg", identifier: 5 }
  ]
  enableCommunityButton:boolean = false
  isCommunityFlow:boolean = false
  window: any = window;

  constructor(private route:ActivatedRoute, private loaderRunner: LoaderRunnerService) {
    this.route.paramMap.subscribe((params:any) => {
      this.district = params.get('district') || "";
      this.districtCode = params.get("dt-code")
      this.stateName = params.get('state');
      this.stateCode = params.get('st-code')
      this.dashboard = params.get('extra');
    });
    route.data.subscribe((data:any)=>{
      this.pageConfig = data
    })
  }

  ngOnInit(): void {
    if(this.pageConfig.type == "communityDetails"){
      this.enableCommunityButton = false
      this.isCommunityFlow = true
    }else{
      this.getCommunityMetrics()
    }
    this.getImprovementsData();
  }

  async getImprovementsData() {
    let metricsPath = "metrics.json"
    let pieChartPath = "pie-chart.json"
    let lineChartPath = "line-chart.json"
  
    if (this.isCommunityFlow) {
      metricsPath = "community-metrics.json"
      pieChartPath = "community-pie-chart.json"
    }
  
    await this.loaderRunner.run(async () => {
      try {
        const metricsRes: any = await d3.json(
          `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/${metricsPath}`
        );
        this.metrics = metricsRes?.metrics || [];
  
        try {
          const pieRes: any = await d3.json(
            `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/${pieChartPath}`
          );
          this.pieChart = pieRes?.data || [];
        } catch {
          this.pieChart = [];
        }
  
        try {
          const lineRes: any = await d3.json(
            `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/${lineChartPath}`
          );
          this.lineChart = lineRes?.data || [];
        } catch {
          this.lineChart = [];
        }
  
        await this.getProgramsList();
  
      } catch (error) {
        console.error('Error loading improvements data:', error);
        this.metrics = [];
        this.pieChart = [];
        this.lineChart = [];
        await this.getProgramsList();
      }
    });
  }
  

  async getProgramsList() {
    try {
      const data: any = await d3.json(
        `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/${this.isCommunityFlow ? 'WLC.json' : 'SLC.json'}`
      );
      this.programsList = data;
    } catch (error) {
      console.error('Error loading programs list:', error);
      this.programsList = [];
    }
  
    await this.fetchPageData();
  }
  

  async fetchPageData() {
    try {
      const data: any = await d3.json(
        `/assets/${this.pageConfig.type === 'communityDetails' ? 'community-led' : 'leaders'}-improvement-district-details.json`
      );
  
      this.pageData = data;
  
      this.pageData.forEach((element: any) => {
        if (element.type === 'data-indicators') {
          this.metrics.forEach((metric: any) => {
            if (this.isCommunityFlow) {
              const icon = this.metricsMappingData.find(i => i.identifier === metric.identifier);
              element.indicators.push({ icon: icon?.icon || '', ...metric });
            } else {
              const path = metric.label.toLowerCase().split(' ').join('_');
              element.indicators.push({
                icon: metric.label === 'Schools driving improvements'
                  ? `assets/icons/${path}.png`
                  : `assets/icons/${path}.svg`,
                ...metric
              });
            }
          });
        }
  
        if (element.type === 'pie-chart') {
          element.data = this.pieChart;
        }
      });
  
    } catch (error) {
      console.error('Error loading page config:', error);
    }
  }
  

  getCommunityMetrics(){
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/community-metrics.json`).then((data: any) => {
      this.enableCommunityButton = true
    }).catch((error: any) => {
      console.error('Error loading community metrics:', error);
    });
  }
}