import { Component, OnInit, ElementRef, ViewChild } from '@angular/core'; 
import * as d3 from 'd3'; 
import * as topojson from 'topojson-client'; 
import { FeatureCollection, Geometry } from 'geojson'; 
import { INDIA } from '../../../constants/urlConstants'; 
import { environment } from '../../../../environments/environment'; 

interface ImpactDataItem {
  source: {
    partner_id: string[];
    icon: string;
    stateName?: string;
    countryName?: string;
    coords?: [number, number];
  };
  target: {
    partner_id: string[];
    icon: string;
    stateName?: string;
    countryName?: string;
    coords?: [number, number];
  };
  lineType: string;
  curvature: number;
  color: string;
}

interface Partner {
  id: string;
  coordinates?: [number, number]; // [lat, lon]
  partnerState?: string;
  countryName?: string;
  category?: string;
  website?: string;
  src?: string;
  name?: string;
}

interface NetworkData {
  impactData: ImpactDataItem[];
  partners: Partner[];
}

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.html',
  styleUrls: ['./world-map.css']
})
export class WorldMapComponent implements OnInit {

  @ViewChild('map', { static: true }) private mapContainer!: ElementRef;

  baseUrl: any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`;

  markerConfigList: any = {
    "momentum": { hqIcon: "./assets/marker-icons/momentum-partners.svg", icon: "./assets/marker-icons/momentum.svg", color: "#572E91" },
    "stategic": { hqIcon: "./assets/marker-icons/strategic-partners.svg", icon: "./assets/marker-icons/stategic.svg", color: "orange" },
    "collaborators": { hqIcon: "./assets/marker-icons/triangle.svg", icon: "./assets/marker-icons/collaborators.svg", color: "red" }
  };

  private svg: any;
  private g: any;
  private indiaGroup: any;
  private partnersGroup: any;
  private projection: any;
  private path: any;
  private isIndiaZoomed: boolean = false;
  private tooltip: any;

  private width = 1000;
  private height = 500;

  private countryMap: Record<string, string> = {
    'IND': '356',
    'USA': '840', 'GBR': '826', 'CAN': '124',
    'FRA': '250', 'DEU': '276', 'ITA': '380', 'ESP': '724', 'NLD': '528', 'BEL': '056', 'CHE': '756', 'SWE': '752', 'NOR': '578', 'DNK': '208',
    'ZAF': '710', 'EGY': '818', 'NGA': '566', 'KEN': '404', 'DZA': '012', 'MAR': '504', 'TUN': '788',
    // 'AUS': '036', 'NZL': '554', 'FJI': '242', 'PNG': '598',
    'SGP': '702'
  };

  ngOnInit(): void {
    this.createMap();
  }

  /** Create world map, India map, and render partners/lines */
  private createMap(): void {
    const element = this.mapContainer.nativeElement;

    this.svg = d3.select(element)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // Tooltip container
    this.tooltip = d3.select(element)
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('opacity', 0);

    this.g = this.svg.append('g').attr('class', 'world');
    this.indiaGroup = this.svg.append('g').attr('class', 'india');

    this.projection = d3.geoMercator()
      .scale(150)
      .translate([this.width / 2, this.height / 1.5]);

    this.path = d3.geoPath().projection(this.projection);

    // Load world map, India map, and partner data
    Promise.all([
      d3.json<any>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json'),
      d3.json<any>(`${this.baseUrl}/${INDIA}`),
      d3.json<NetworkData>('./assets/network-data.json')
    ]).then(([topology, indiaTopology, networkData]) => {
      const countries = topojson.feature(topology, topology.objects.countries) as unknown as FeatureCollection<Geometry, any>;
      const states = topojson.feature(indiaTopology, indiaTopology.objects.states) as unknown as FeatureCollection<Geometry, any>;

      const filteredCountries = countries.features.filter(f =>
        f.id !== undefined && Object.values(this.countryMap).includes(String(f.id))
      );

      // Draw countries (except India)
      this.g.selectAll('path')
        .data(filteredCountries.filter(f => String(f.id) !== this.countryMap['IND']))
        .enter()
        .append('path')
        .attr('d', this.path)
        .attr('fill', '#abb6c2')
        .attr('stroke', '#ffffffff')
        .attr('stroke-width', 0.5);

      const indiaData = filteredCountries.find(f => String(f.id) === this.countryMap['IND']);
      if (indiaData) {
        // Draw India states
        this.indiaGroup.selectAll('.state')
          .data(states.features)
          .enter()
          .append('path')
          .attr('class', 'state')
          .attr('d', this.path)
          .attr('fill', '#fdd1a5')
          .attr('stroke', '#3a3a3aff')
          .attr('stroke-width', 0.2);

        // Permanently zoom into India
        this.zoomIndiaPermanently(this.indiaGroup, indiaData);
      }

      if (networkData) {
        this.drawConnectionLines(networkData, filteredCountries, states.features, indiaData);
        this.drawPartners(networkData, indiaData);
      }
    }).catch(err => console.error('Data load error:', err));
  }

  private normalizeId(id: string) {
    return id.toLowerCase().replace(/[\s_]/g, '');
  }

  /** Apply zoom effect for partners inside India */
  private applyIndiaZoom(point: [number, number], indiaData: any, scale: number = 4): [number, number] {
    if (!this.isIndiaZoomed || !indiaData) return point;

    const centroid = this.path.centroid(indiaData);
    const x = (point[0] - centroid[0]) * scale + centroid[0];
    const y = (point[1] - centroid[1]) * scale + centroid[1];

    return [x, y];
  }

  /** Render partner icons and interactive tooltip */
  private drawPartners(networkData: NetworkData, indiaData: any): void {
    if (!networkData?.partners?.length) return;

    if (!this.partnersGroup) {
      this.partnersGroup = this.svg.append('g').attr('class', 'partners');
    }

    const indiaScale = 4;
    const iconSize = 18;

    networkData.partners.forEach((partner: Partner) => {
      if (!partner.coordinates || partner.coordinates.length !== 2) return;

      const categoryKey = (partner.category || '').trim().toLowerCase();
      const iconConfig = this.markerConfigList[categoryKey];
      const iconPath = iconConfig ? iconConfig.icon : 'circle.svg';

      const lon = partner.coordinates[1];
      const lat = partner.coordinates[0];
      const projected = this.projection([lon, lat]);
      if (!projected) return;

      const isInsideIndia = indiaData && d3.geoContains(indiaData, [lon, lat]);
      const targetGroup = isInsideIndia ? this.indiaGroup : this.partnersGroup;

      const size = isInsideIndia ? iconSize / indiaScale : iconSize;
      const offset = size / 2;

      const icon = targetGroup.append('image')
        .attr('class', `partner-icon partner-${categoryKey}`)
        .attr('xlink:href', iconPath)
        .attr('x', projected[0] - offset)
        .attr('y', projected[1] - offset)
        .attr('width', size)
        .attr('height', size);

      // --- Tooltip on click instead of hover ---
      icon.on('click', (event: any) => {
        event.stopPropagation(); // prevent closing when clicking on icon itself

        // Tooltip HTML
        const partnerHtml = `
<div style="position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  width: 250px;
  border: 1px solid #000000ff;
  font-family: Arial, sans-serif;
  max-height: 300px;
  overflow-y: auto;
">
  <div style="
    position: absolute;
    left: -8px;
    top: 20px;
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid white;
    filter: drop-shadow(-1px 0px 1px rgba(0,0,0,0.05));
  "></div>

  <a href="${partner.website}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
    <div style="display: grid; grid-template-columns: 36px 1fr; align-items: center; padding: 8px 12px;">
      <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <img src="${partner.src}" alt="${partner.name}" style="width: 24px; height: 24px; object-fit: contain;">
      </div>
      <div style="display: flex; flex-direction: column; padding-left: 5px;">
        <div style="font-weight: 600; font-size: 14px; color: #000;">${partner.name}</div>
        <div style="font-size: 12px; color: #777;">${partner.category} partner</div>
        <div style="font-size: 12px; color: #555;">${partner.partnerState}</div>
      </div>
    </div>
  </a>
</div>`;

        this.tooltip
          .html(partnerHtml)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px')
          .transition().duration(200).style('opacity', 1);
      });
    });

    // Hide tooltip when clicking outside
    d3.select('body').on('click', () => {
      this.tooltip.transition().duration(200).style('opacity', 0);
    });
  }

  /** Draw animated curved connection lines between partners */
  private drawConnectionLines(networkData: NetworkData, countries: any[], states: any[], indiaData?: any): void {
    const getCoords = (location: any): [number, number] | null => {
      if (location.coords && location.coords.length === 2) {
        return [location.coords[1], location.coords[0]];
      }

      if (location.partner_id?.length) {
        const partner = networkData.partners.find(
          p => this.normalizeId(p.id) === this.normalizeId(location.partner_id[0])
        );
        if (partner?.coordinates) {
          return [partner.coordinates[1], partner.coordinates[0]];
        }
      }

      if (location.stateName) {
        const state = states.find(
          (s: any) => s.properties.st_nm.toLowerCase() === location.stateName.toLowerCase()
        );
        if (state) return d3.geoCentroid(state);
      }

      if (location.countryName) {
        const country = countries.find(
          (c: any) => c.properties.name.toLowerCase() === location.countryName.toLowerCase()
        );
        if (country) return d3.geoCentroid(country);
      }

      return null;
    };

    const lines = this.svg.append('g').attr('class', 'connection-lines');

    networkData.impactData.forEach(d => {
      const sourceCoords = getCoords(d.source);
      const targetCoords = getCoords(d.target);

      if (!sourceCoords || !targetCoords) return;

      let projectedSource = this.projection(sourceCoords) as [number, number];
      let projectedTarget = this.projection(targetCoords) as [number, number];

      if (indiaData && d3.geoContains(indiaData, sourceCoords)) {
        projectedSource = this.applyIndiaZoom(projectedSource, indiaData);
      }
      if (indiaData && d3.geoContains(indiaData, targetCoords)) {
        projectedTarget = this.applyIndiaZoom(projectedTarget, indiaData);
      }

      const midX = (projectedSource[0] + projectedTarget[0]) / 2;
      const midY = (projectedSource[1] + projectedTarget[1]) / 2;
      const controlPoint: [number, number] = [midX, midY - 50];

      const lineGenerator = d3.line().curve(d3.curveBundle.beta(d.curvature || 0.5));
      const pathData = lineGenerator([projectedSource, controlPoint, projectedTarget]);

      if (pathData) {
        const path = lines.append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', d.color || '#000')
          .attr('stroke-width', 2)
          .attr('opacity', 0.9)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('stroke-dasharray', (() => {
            switch (d.lineType) {
              case 'dotted': return '2,6';
              case 'dashed': return '8,6';
              case 'multi-dash': return '12,4,4,4';
              case 'double-dash': return '15,3,3,3';
              default: return '6,6';
            }
          })());

        // Animate line flow
        d3.timer((elapsed) => {
          path.attr('stroke-dashoffset', -elapsed / 40);
        });

        // path.on('mouseover', (event: any) => {
        //   this.tooltip.transition().duration(200).style('opacity', 1);
        //   this.tooltip.html(`Source: ${d.source.partner_id[0]}<br>Target: ${d.target.partner_id[0]}`)
        //     .style('left', (event.pageX + 10) + 'px')
        //     .style('top', (event.pageY - 20) + 'px');
        // }).on('mousemove', (event: any) => {
        //   this.tooltip
        //     .style('left', (event.pageX + 10) + 'px')
        //     .style('top', (event.pageY - 20) + 'px');
        // }).on('mouseout', () => {
        //   this.tooltip.transition().duration(200).style('opacity', 0);
        // });
      }
    });
  }

  /** Keep India permanently zoomed */
  zoomIndiaPermanently(indiaGroup: any, indiaData: any): void {
    const centroid = this.path.centroid(indiaData);
    indiaGroup.attr('transform', `translate(${centroid[0]},${centroid[1]}) scale(4) translate(${-centroid[0]},${-centroid[1]})`);
    this.isIndiaZoomed = true;
  }

  resetZoom(): void {
    this.indiaGroup
      .transition().duration(1000)
      .attr('transform', 'translate(0,0) scale(1)');
    this.isIndiaZoomed = false;
  }
}
