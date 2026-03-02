import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CommonModule } from '@angular/common';
import { MiniIndicatorCardComponent } from '../../components/mini-indicator-card/mini-indicator-card';
import { DISTRICT_VIEW_INDICATORS } from '../../../constants/urlConstants';
import { environment } from '../../../../environments/environment';
import { LoaderRunnerService } from '../../services/loader-runner.service';

@Component({
  selector: 'app-district-view',
  standalone: true,
  imports: [CommonModule, MiniIndicatorCardComponent],
  templateUrl: './district-view.html',
  styleUrls: ['./district-view.css']
})
export class DistrictView implements OnInit, AfterViewInit {
  @ViewChild('districtMapContainer') private mapContainer!: ElementRef;
  stateName: string | null = null;

  indicatorData: { value: number | string; label: string }[] = [];

  constructor(private route: ActivatedRoute ,private loaderRunner: LoaderRunnerService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.stateName = params.get('district'); // 'district' is the parameter name in app.routes.ts
      if (this.stateName) {
        this.fetchIndicatorData();
      }
    });
  }

  async fetchIndicatorData() {
    await this.loaderRunner.run(async () => {
    return d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${DISTRICT_VIEW_INDICATORS}`).then((data: any) => {
      if (this.stateName && data.result[this.stateName]) {
        this.indicatorData = data.result[this.stateName];
      } else {
        this.indicatorData = data.result.Default;
      }
    }).catch((error: any) => {
      console.error('Error loading indicator data:', error);
    });
  });

  }

  ngAfterViewInit(): void {
    if (this.stateName) {
      this.drawDistrictMap(this.stateName);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (!(window.innerWidth <= 768) && this.stateName) {
      this.drawDistrictMap(this.stateName);
    }
  }

  private drawDistrictMap(stateName: string): void {
    d3.select('#district-map-container svg').remove();

    const width = 960;
    const height = 600;

    const svg = d3.select('#district-map-container')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const projection = d3.geoMercator();
    const path = d3.geoPath().projection(projection);

    const fileName = stateName.toLowerCase().replace(/ /g, '-');
    d3.json(`/assets/districts/${fileName}.json`).then((stateDistricts: any) => {
      const districts = topojson.feature(stateDistricts, stateDistricts.objects.districts) as any;
      const filteredDistricts = districts.features;

      if (filteredDistricts.length === 0) {
        return;
      }

      projection.fitSize([width, height], { type: 'FeatureCollection', features: filteredDistricts });

      svg.selectAll('path')
        .data(filteredDistricts)
        .enter().append('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          if (d.properties.district === 'Pathanamthitta') {
            return '#572e91';
          } else {
            return '#ccc';
          }
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);
    }).catch((error: any) => {
      console.error('Error loading or processing the TopoJSON district data:', error);
    });
  }
}