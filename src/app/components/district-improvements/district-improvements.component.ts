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
  metricsMappingData = [
    { icon: "assets/icons/community_leaders.svg", identifier: 1 },
    { icon: "assets/icons/community_improvements.svg", identifier: 2 },
    { icon: "assets/icons/mountain.svg", identifier: 3 },
    { icon: "assets/icons/idea.svg", identifier: 4 }
  ]
  enableCommunityButton:boolean = false
  isCommunityFlow:boolean = false

  constructor(private route:ActivatedRoute) {
    this.route.paramMap.subscribe((params:any) => {
      this.district = params.get('district') || "";
      this.districtCode = params.get("dt-code")
      this.stateName = params.get('state');
      this.stateCode = params.get('st-code')
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

  getImprovementsData() {
    let metricsPath = "metrics.json"
    let pieChartPath = "pie-chart.json"
    if(this.isCommunityFlow){
      metricsPath = "community-metrics.json"
      pieChartPath = "community-pie-chart.json"
    }
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/${metricsPath}`).then((data: any) => {
      this.metrics = data.metrics
      d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/${pieChartPath}`).then((data: any) => {
        this.pieChart = data.data;
        this.getProgramsList()
      }).catch((error: any) => {
        console.error('Error loading page data:', error);
      });
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

  getProgramsList() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/${this.isCommunityFlow ? 'WLC.json':'SLC.json'}`).then((data: any) => {
      this.programsList = data;
      this.fetchPageData();
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
      this.fetchPageData()
    });
  }

  fetchPageData(): void {
    d3.json('/assets/leaders-improvement-district-details.json').then((data: any) => {
      this.pageData = data;
      this.pageData.forEach((element:any) => {
        if(element.type == "data-indicators") {
          if(this.isCommunityFlow){
            this.metrics.map((metric:any) => {
              let icon:any = this.metricsMappingData.find(iconItem => iconItem.identifier === metric.identifier);
              element.indicators.push(
                { icon: icon?.icon || "",...metric}
              )
            })
          }else{
            this.metrics.map((metric:any) => {
              let data =metric.label.split(" ")
              let path =data.map((word:any) => word.toLowerCase()).join("_")
              element.indicators.push(
                {...{"icon":metric.label === 'Schools driving improvements' ?`assets/icons/${path}.png`:`assets/icons/${path}.svg`},...metric}
              )
            })
          }
        }
        if(element.type == "pie-chart") {
          element.data = this.pieChart
        }
      });
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

  getCommunityMetrics(){
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/districts/${this.districtCode}/community-metrics.json`).then((data: any) => {
      this.enableCommunityButton = true
    }).catch((error: any) => {
      console.error('Error loading community metrics:', error);
    });
  }
}
