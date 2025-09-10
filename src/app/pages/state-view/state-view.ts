import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { MiniIndicatorCardComponent } from '../../components/mini-indicator-card/mini-indicator-card';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { INDIA } from '../../../constants/urlConstants';

@Component({
  selector: 'app-state-view',
  imports: [CommonModule, MiniIndicatorCardComponent, KeyValuePipe, MatSelectModule, FormsModule, ReactiveFormsModule],
  templateUrl: './state-view.html',
  styleUrls: ['./state-view.css']
})
export class StateView implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('stateMapContainer') private mapContainer!: ElementRef;
  @Input() showDetails: boolean = true;
  @Input() showVariations: boolean = false;
  @Input() selectedState: string = '';
  @Input() selections: any = [];
  @Input() legends: any = {};
  @Input() path: any;
  @Input() replaceCode?: any;
  @Input() notes?: any = [];
  @Input() pageConfig: any = '';
  @Input() stateLedMission?: any = 0;
  selectedIndicator: string = 'Micro Improvements Initiated';
  hoveredDistrict: string = '';
  indicatorData: { value: number | string; label: string }[] = [];
  baseUrl: any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`;
  country: string = 'India';
  dataFetchPath: any;
  communityDataFetchPath: any = '/states/{code}/community-map.json';
  displayLegends: any = [];
  communityJson: any = {
    "result": {
      "districts": {}
    }
  };

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.dataFetchPath = this.replaceCode ? this.path.replace('{code}', this.replaceCode.toString()) : this.path;
    this.communityDataFetchPath = this.replaceCode ? this.communityDataFetchPath.replace('{code}', this.replaceCode.toString()) : this.path;
    this.fetchCommunityData();
    this.displayLegends = Object.values(this.legends).map((item: any) => ({
      label: item.label,
      color: item.color,
      icon: item.icon
    }));
    this.fetchIndicatorData();
  }

  fetchCommunityData() {
    d3.json(`${this.baseUrl}${this.communityDataFetchPath}`).then((data: any) => {
      this.communityJson = data;
      console.log(data);
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

  fetchIndicatorData(districtCode?: string, forTooltip: boolean = false): Promise<any> {
    return d3.json(`${this.baseUrl}${this.dataFetchPath}`).then((data: any) => {
      const districtsData = data.result.districts || {};
      const labels = data.result.meta?.labels || {};
      let details = (districtCode && districtsData[districtCode]) ? districtsData[districtCode].details : data.result.overview.details;
      let processedData: { value: number | string; label: string }[] = [];
      this.hoveredDistrict = districtCode ? districtsData[districtCode].label : '';

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

  ngOnChanges(changes: any) {
    if (changes?.stateLedMission?.currentValue) {
      this.stateLedMission = changes?.stateLedMission?.currentValue;
    }
  }

  private resizeTimeout: any;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.drawMap(), 200);
  }

  private drawMap(): void {
    d3.select('#state-map-container svg').remove();

    const container = this.mapContainer.nativeElement;
    const containerWidth = container.offsetWidth;
    const height = containerWidth * 0.6;

    const tooltip = d3.select('#map-tooltip');

    Promise.all([
      d3.json(`${this.baseUrl}/${INDIA}`),
      d3.json(`${this.baseUrl}${this.dataFetchPath}`)
    ]).then(([india, indicatorData]: [any, any]) => {
      const districtsData = indicatorData.result.districts || {};
      const iconDistrictsData = this.communityJson.result.districts || {}; // Use communityJson for icons only
      const states = topojson.feature(india, india.objects.states) as any;
      const districts = topojson.feature(india, india.objects.districts) as any;

      // Find the selected state
      const selectedStateFeature = states.features.find((state: any) =>
        state.properties.st_nm?.toLowerCase() === this.selectedState?.toLowerCase()
      );

      if (!selectedStateFeature) {
        console.error(`State ${this.selectedState} not found`);
        return;
      }

      const selecteddistrictCode = selectedStateFeature.properties.st_code;

      // Filter districts that belong to the selected state
      const stateDistricts = districts.features.filter((district: any) =>
        district.properties.st_code === selecteddistrictCode
      );

      // Create a feature collection for the selected state districts
      const stateDistrictsFeature: any = {
        type: 'FeatureCollection',
        features: stateDistricts
      };

      const projection = d3.geoMercator().fitSize([containerWidth, height], stateDistrictsFeature);
      const path = d3.geoPath().projection(projection);

      const svg = d3.select('#state-map-container')
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', height)
        .attr('viewBox', `0 0 ${containerWidth} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      // Draw state boundary
      svg.append('path')
        .datum(selectedStateFeature)
        .attr('class', 'state-boundary')
        .attr('d', path as any)
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('stroke-width', 2);

      // Draw districts with original color logic
      svg.selectAll('.district-path')
        .data(stateDistricts)
        .enter().append('path')
        .attr('class', 'district-path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const districtCode = d.properties.dt_code;
          const districtInfo = districtsData[districtCode];
          if (districtInfo) {
            return this.legends[districtInfo.type]?.color || '#fff';
          } else {
            return this.stateLedMission > 0 ? this.legends['category_2']?.color : '#fff';
          }
        })
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .style('cursor', (d: any) => {
          const districtCode = d.properties.dt_code;
          return districtsData[districtCode] ? 'pointer' : 'default';
        })
        .on('mouseover', (event: any, d: any) => {
          const districtCode = d.properties.dt_code;
          const districtInfo = districtsData[districtCode];
          const districtName = d.properties.district || 'Unknown District'; // Fallback to district name from topojson
          if (districtInfo) {
            if (this.showDetails) {
              this.fetchIndicatorData(districtCode);
            }
            const selectedDetail = districtInfo.details.find((detail: any) => {
              const detailCode = detail.code?.toLowerCase().replace(/\s+/g, '');
              const selectedCode = this.selectedIndicator?.toLowerCase().replace(/\s+/g, '');
              return detailCode === selectedCode;
            });
            if (selectedDetail) {
              tooltip.transition().duration(200).style('opacity', .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${districtInfo.label || 'Unknown District'}</div>
                <div style="font-size: 14px; color: #333; font-weight: 500; text-transform: capitalize;">${selectedDetail.code || ''}</div>
                <div style="font-size: 20px; color: #e6007a; font-weight: bold;">${selectedDetail.value}</div>
              </div>`;
              tooltip.html(tooltipHtml);
            } else {
              tooltip.transition().duration(200).style('opacity', .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${districtInfo.label || 'Unknown District'}</div>
              </div>`;
              tooltip.html(tooltipHtml);
            }
          } else {
            // Show tooltip for districts without data
            tooltip.transition().duration(200).style('opacity', .9);
            let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${districtName}</div>
            </div>`;
            tooltip.html(tooltipHtml);
          }
        })
        .on('mousemove', (event: any) => {
          tooltip.style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
          if (this.showDetails) {
            this.fetchIndicatorData();
          }
          tooltip.transition().duration(500).style('opacity', 0);
        })
        .on('click', (event: any, d: any) => {
          const districtCode = d.properties.dt_code;
          const distInfo = districtsData[districtCode];
          if (this.showDetails && distInfo) {
            this.fetchIndicatorData(districtCode);
            const stateName = distInfo.label;
            if (stateName) {
              if(this.pageConfig.type == 'communityDashboard'){
                this.router.navigate(['/community-led-district-improvements/', d.properties.st_nm, d.properties.st_code, d.properties.district, d.properties.dt_code,'state'])
              }
              else if (this.pageConfig.type == 'communityDetails') {
                this.router.navigate(['/community-led-district-improvements/', d.properties.st_nm, d.properties.st_code, d.properties.district, d.properties.dt_code]);
              }
              else {
                this.router.navigate(['/state-led-district-improvements', d.properties.st_nm, d.properties.st_code, d.properties.district, d.properties.dt_code]);
              }
            }
          } else if (!this.showDetails) {
            this.router.navigate(['/dashboard']);
          }
        });

      // Add SVG icons only for districts in communityJson
      svg.selectAll('.district-icon')
        .data(stateDistricts.filter((d: any) => iconDistrictsData[d.properties.dt_code]))
        .enter()
        .append('image')
        .attr('class', 'district-icon')
        .attr('x', (d: any) => {
          const centroid = path.centroid(d);
          return centroid[0] - 10; // Adjust x to center the 20x20 icon
        })
        .attr('y', (d: any) => {
          const centroid = path.centroid(d);
          return centroid[1] - 18; // Adjust y to center the 20x20 icon
        })
        .attr('width', 20) // Icon width
        .attr('height', 20) // Icon height
        .attr('xlink:href', 'assets/icons/community_map_icon.svg') // Path to the SVG icon
        .style('cursor', (d: any) => {
          const districtCode = d.properties.dt_code;
          return iconDistrictsData[districtCode] ? 'pointer' : 'default';
        })
        .on('mouseover', (event: any, d: any) => {
          const districtCode = d.properties.dt_code;
          const districtInfo = districtsData[districtCode];
          const districtName = d.properties.district || 'Unknown District'; // Fallback to district name from topojson
          if (districtInfo) {
            if (this.showDetails) {
              this.fetchIndicatorData(districtCode);
            }
            const selectedDetail = districtInfo.details.find((detail: any) => {
              const detailCode = detail.code?.toLowerCase().replace(/\s+/g, '');
              const selectedCode = this.selectedIndicator?.toLowerCase().replace(/\s+/g, '');
              return detailCode === selectedCode;
            });
            if (selectedDetail) {
              tooltip.transition().duration(200).style('opacity', .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${districtInfo.label || 'Unknown District'}</div>
                <div style="font-size: 14px; color: #333; font-weight: 500; text-transform: capitalize;">${selectedDetail.code || ''}</div>
                <div style="font-size: 20px; color: #e6007a; font-weight: bold;">${selectedDetail.value}</div>
              </div>`;
              tooltip.html(tooltipHtml);
            } else {
              tooltip.transition().duration(200).style('opacity', .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${districtInfo.label || 'Unknown District'}</div>
              </div>`;
              tooltip.html(tooltipHtml);
            }
          } else {
            // Show tooltip for districts without data
            tooltip.transition().duration(200).style('opacity', .9);
            let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${districtName}</div>
            </div>`;
            tooltip.html(tooltipHtml);
          }
        })
        .on('mousemove', (event: any) => {
          tooltip.style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
          if (this.showDetails) {
            this.fetchIndicatorData();
          }
          tooltip.transition().duration(500).style('opacity', 0);
        })
        .on('click', (event: any, d: any) => {
          const districtCode = d.properties.dt_code;
          const distInfo = districtsData[districtCode];
          if (this.showDetails && distInfo) {
            this.fetchIndicatorData(districtCode);
            const stateName = distInfo.label;
            if (stateName) {
                            if(this.pageConfig.type == 'communityDashboard'){
                this.router.navigate(['/community-led-district-improvements/', d.properties.st_nm, d.properties.st_code, d.properties.district, d.properties.dt_code,'state'])
              }
              else if (this.pageConfig.type == 'communityDetails') {
                this.router.navigate(['/community-led-district-improvements/', d.properties.st_nm, d.properties.st_code, d.properties.district, d.properties.dt_code]);
              }
              else {
                if("category_1" == districtsData.find((element:any) => element.label == stateName).type) {
                  this.router.navigate(['/state-led-district-improvements', d.properties.st_nm, d.properties.st_code, d.properties.district, d.properties.dt_code]);
                }
              }
            }
          } else if (!this.showDetails) {
            this.router.navigate(['/dashboard']);
          }
        });

    }).catch((error: any) => {
      console.error('Error loading or processing data:', error);
    });
  }
}
