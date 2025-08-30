import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener, Input, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { IndicatorCardComponent } from '../../components/indicator-card/indicator-card';
import { MiniIndicatorCardComponent } from '../../components/mini-indicator-card/mini-indicator-card';
import { Router } from '@angular/router'; // Import Router
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { DISTRICT_VIEW_INDICATORS, INDIA } from '../../../constants/urlConstants';


@Component({
  selector: 'app-country-view',
  standalone: true,
  imports: [CommonModule, MiniIndicatorCardComponent, KeyValuePipe, MatSelectModule, FormsModule, ReactiveFormsModule],
  templateUrl: './country-view.html',
  styleUrls: ['./country-view.css']
})
export class CountryView implements OnInit, AfterViewInit {
  @ViewChild('indiaMapContainer') private mapContainer!: ElementRef;
  @Input() showDetails: boolean = false;
  @Input() showVariations: boolean = false;
  @Input() legends:any = [];
  @Input() selections: any = [];
  @Output() stateSelected = new EventEmitter<string>();
  @Input() resourcePath:string = '';
  @Input() redirectPath?:any = ''
  @Input() notes:any = [];
  selectedIndicator: string = 'Micro Improvements Initiated';
  hoveredState: string = ""

  indicatorData: { value: number | string; label: string }[] = [];
  baseUrl:any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`
  displayLegends:any = []

  constructor(private router: Router) { } // Inject Router

  ngOnInit(): void {
    this.fetchIndicatorData();
  }

  fetchIndicatorData(stateCode?: string, forTooltip: boolean = false): Promise<any> {
    return d3.json(this.resourcePath.length > 0 ? this.resourcePath.includes('https://') ? this.resourcePath : `${this.baseUrl}/${this.resourcePath}` :`${this.baseUrl}/${DISTRICT_VIEW_INDICATORS}`).then((data: any) => {
      const statesData = data.result.states;
      const labels = data.result.meta?.labels || {};
      // this.notes = data.result.meta?.notes || [];
      let details = (stateCode && statesData[stateCode]) ? statesData[stateCode].details : data.result.overview.details;
      let processedData: { value: number | string; label: string }[] = [];
      this.hoveredState = stateCode? statesData[stateCode].label : ""

      if (details) {
        if (forTooltip && this.showVariations && this.selectedIndicator) {
          const filteredDetails = details.filter((item: any) => labels[item.code] === this.selectedIndicator);
          processedData = filteredDetails.map((item: any) => ({
            value: item.value,
            label: labels[item.code]
          }));
        } else {
          processedData = details.map((item: any) => ({
            value: item.value,
            label: labels[item.code] ?? item.code
          }));
        }
      }

      if (!forTooltip) {
        this.indicatorData = processedData;
      }
      return processedData;
    }).catch((error: any) => {
      console.error('Error loading indicator data:', error);
      if (!forTooltip) {
        this.indicatorData = [];
      }
      return [];
    });
  }

  ngAfterViewInit(): void {
    this.drawMap();
  }

  private resizeTimeout: any;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.drawMap(), 200);
  }

  private drawMap(): void {
    d3.select('#india-map-container svg').remove();

    const container = this.mapContainer.nativeElement;
    const containerWidth = container.offsetWidth;
    const height = containerWidth * 0.8;

    const tooltip = d3.select("#map-tooltip");

    Promise.all([
      d3.json(`${this.baseUrl}/${INDIA}`),
      d3.json(this.resourcePath.length > 0 ? (this.resourcePath.includes('https://') ? this.resourcePath : `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${this.resourcePath}`) :`${this.baseUrl}/${DISTRICT_VIEW_INDICATORS}`)
    ]).then(([india, indicatorData]: [any, any]) => {
      const statesData = indicatorData.result.states;
      const labels = indicatorData.result.meta.labels;
      const legends = indicatorData.result.meta.legends;
      this.legends = legends;
      this.displayLegends = Object.values(legends).map((item:any) => ({
        label: item.label,
        color: item.color
      }));
      const activeStates = indicatorData.result.overview;
      const states = topojson.feature(india, india.objects.states) as any;
      const districts = topojson.feature(india, india.objects.districts) as any;

      const projection = d3.geoMercator().fitSize([containerWidth, height], states);
      const path = d3.geoPath().projection(projection);

      const svg = d3.select('#india-map-container')
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', height)
        .attr('viewBox', `0 0 ${containerWidth} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      svg.selectAll('.state-path')
        .data(states.features)
        .enter().append('path')
        .attr('class', 'state-path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          if (stateInfo) {
            return legends[stateInfo.type]?.color || '#fff';
          } else {
            return '#fff';
          }
        })
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .style('cursor', (d: any) => {
          const stateCode = d.properties.st_code;
          return statesData[stateCode] ? 'pointer' : 'default';
        })
        .on('mouseover', (event: any, d: any) => {
          const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          if (stateInfo) {
            if (this.showDetails) {
              this.fetchIndicatorData(stateCode);
            }
            if (this.showVariations) {
              const selectedDetail = stateInfo.details.find((detail: any) => {
                const detailCode = detail.code?.toLowerCase().replace(/\s+/g, ''); // removes spaces & \n
                const selectedCode = this.selectedIndicator?.toLowerCase().replace(/\s+/g, '');
                return detailCode === selectedCode;
              });
              if (selectedDetail) {
                tooltip.transition().duration(200).style("opacity", .9);
                // let tooltipHtml = `<strong>${stateInfo.label}</strong><br/>`;
                // let tooltipHtml = `${labels[selectedDetail.code]}: ${selectedDetail.value}`;
                let tooltipHtml = `<div style="padding: 8px 12px;border-radius: 6px;text-align: center;">
                <div style="font-size: 14px; color: #333; font-weight: 500; text-transform:capitalize">${selectedDetail.code || ''}</div>
                <div style="font-size: 20px; color: #e6007a; font-weight: bold;">${selectedDetail.value}</div></div>`;
                tooltip.html(tooltipHtml)
              } else {
                tooltip.transition().duration(500).style("opacity", 0); // Hide tooltip if data not found
              }
            }
          }
        })
        .on('mousemove', (event: any) => {
          if (this.showVariations) {
            tooltip.style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          }
        })
        .on('mouseout', () => {
          if (this.showDetails) {
            this.fetchIndicatorData(); // Reset right panel to default
          }
          if (this.showVariations) {
            tooltip.transition().duration(500).style("opacity", 0);
          }
        })
        .on('click', (event: any, d: any) => {
          const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          if (this.showDetails && stateInfo) {
            this.fetchIndicatorData(stateCode);
            const stateName = stateInfo.label;
            if (stateName) {
              let path = this.redirectPath ? this.redirectPath : "state-view"
              this.stateSelected.emit(stateInfo.label);
              this.router.navigate([path, stateName, stateCode]);
            }
          }else if(!this.showDetails){
            this.stateSelected.emit(stateInfo.label);
            this.router.navigate(['/dashboard']);
          }
        });

      svg.append('path')
        .datum(districts)
        .attr('class', 'district-outline')
        .attr('d', path as any);
    }).catch((error: any) => {
      console.error('Error loading or processing data:', error);
    });
  }
}
