import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { NETWORK_DATA, INDIA } from '../../../constants/urlConstants';

interface Partner {
  id: string;
  src: string;
  alt: string;
  name: string;
  type: string;
  website: string;
  partnerState?: string;
  countryName?: string;
  coordinates?: [number, number];
}

interface ImpactDataItem {
  source: {
    partner_id: string[];
    icon: string;
    stateName?: string;
    countryName?: string;
    coords: [number, number];
  };
  target: {
    partner_id: string[];
    icon: string;
    stateName?: string;
    countryName?: string;
    coords: [number, number];
  };
  lineType: string;
  curvature: number;
  color: string;
}

interface NetworkData {
  impactData: ImpactDataItem[];
  partners: Partner[];
  partnersWithCoords?: any[];
  partnersByState?: { [key: string]: any[] };
  partnersByCountry?: { [key: string]: any[] };
}

@Component({
  selector: 'app-global-map-2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-map-2.html',
  styleUrls: ['./global-map-2.css']
})
export class GlobalMap2 implements OnInit {
  @ViewChild('mapContainer') private mapContainer!: ElementRef;
  networkData: NetworkData | undefined;
  isLoading = true;
  loadError: string | null = null;
  partnersWithCoords: any[] = [];
  partnersByState: { [key: string]: any[] } = {};
  partnersByCountry: { [key: string]: any[] } = {};
  markerConfigList: any = {
    momentum: { hqIcon: "./assets/marker-icons/momentum-partners.svg", icon: "./assets/marker-icons/momentum-partners.svg", color: "#572E91" },
    strategic: { hqIcon: "./assets/marker-icons/strategic-partners.svg", icon: "./assets/marker-icons/strategic-partners.svg", color: "orange" },
    collaborator: { hqIcon: "./assets/marker-icons/hq-triangle.svg", icon: "./assets/marker-icons/triangle.svg", color: "red" },
    anchor: { hqIcon: "./assets/marker-icons/hq-diamond.svg", icon: "./assets/marker-icons/diamond.svg", color: "pink" }
  }

  constructor() { }
  ngOnInit(): void {
    this.getNetworkData()
  }

  getNetworkData() {
    d3.json<NetworkData>(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${NETWORK_DATA}`).then((networkData: NetworkData | undefined) => {
      this.networkData = networkData;

      if (this.networkData && this.networkData.partners) {
        const partnersWithCoords: any[] = [];
        const partnersByState: { [key: string]: any[] } = {};
        const partnersByCountry: { [key: string]: any[] } = {};

        this.networkData.partners.forEach((p: any) => {
          if (
            Array.isArray(p.coordinates) &&
            p.coordinates.length === 2 &&
            Number.isFinite(p.coordinates[0]) &&
            Number.isFinite(p.coordinates[1])
          ) {
            partnersWithCoords.push({ ...p, coordinates: [p.coordinates[1], p.coordinates[0]] });
          } else if (p.partnerState) {
            if (!partnersByState[p.partnerState]) {
              partnersByState[p.partnerState] = [];
            }
            partnersByState[p.partnerState].push(p);
          } else if (p.countryName) {
            if (!partnersByCountry[p.countryName]) {
              partnersByCountry[p.countryName] = [];
            }
            partnersByCountry[p.countryName].push(p);
          }
        });

        this.partnersWithCoords = partnersWithCoords;
        this.partnersByState = partnersByState;
        this.partnersByCountry = partnersByCountry;

        this.drawChoroplethMap();
      }
    }).catch((error: any) => {
      console.error('Error loading network data:', error);
      this.loadError = 'Failed to load network data. Please try again later.';
    }).finally(() => {
      this.isLoading = false;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.drawChoroplethMap();
  }

  private drawChoroplethMap(): void {
    if (!this.networkData) return;

    d3.select('#map-container-2 svg').remove();
    d3.select(this.mapContainer.nativeElement).select('svg').remove();

    const container = this.mapContainer.nativeElement;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    if (width === 0 || height === 0) return;

    const svg = d3.select('#map-container-2')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    const projection = d3.geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    Promise.all([
      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
      d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${INDIA}`)
    ]).then(([world, india]) => {
      // @ts-ignore
      const countries = topojson.feature(world, world.objects.countries).features;
      // @ts-ignore
      const states = topojson.feature(india, india.objects.states).features;

      g.append('g')
        .selectAll('path')
        .data(countries)
        .enter().append('path')
        .attr('class', 'country')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          if (d.properties.name === 'India') {
            return '#ffcc99'; // Highlight color for India
          }
          return '#e6e3e3ff'; // Grey color for all other countries
        });

      const getCoords = (location: any) => {
        if (location.stateName) {
          const locationName = location.stateName.trim().toLowerCase();
          const feature = states.find((f: any) =>
            f.properties && f.properties.st_nm && f.properties.st_nm.trim().toLowerCase() === locationName
          );
          if (feature) {
            return d3.geoCentroid(feature);
          }
        }
        if (location.countryName) {
            const locationName = location.countryName.trim().toLowerCase();
            const feature = countries.find((c: any) => c.properties.name.toLowerCase() === locationName);
            if(feature){
                return d3.geoCentroid(feature);
            }
        }
        return null;
      };

      const stateIcons = Object.keys(this.partnersByState).map(stateName => {
        const partnersInState = this.partnersByState[stateName];
        const representativePartner = partnersInState[0];
        const coords = getCoords({ stateName: stateName });
        if (coords && representativePartner) {
          return {
            iconUrl: this.markerConfigList.momentum.icon,
            coordinates: coords,
            stateName: stateName,
            partners: partnersInState
          };
        }
        return null;
      }).filter(d => d !== null);

      const countryIcons = Object.keys(this.partnersByCountry).map(countryName => {
        const partnersInCountry = this.partnersByCountry[countryName];
        const representativePartner = partnersInCountry[0];
        const coords = getCoords({ countryName: countryName });
        if (coords && representativePartner) {
          return {
            iconUrl: this.markerConfigList.strategic.icon, // Or some other icon
            coordinates: coords,
            countryName: countryName,
            partners: partnersInCountry
          };
        }
        return null;
      }).filter(d => d !== null);

      const getLineCoords = (location: any) => {
        if (location.partner_id && location.partner_id.length > 0) {
          let partnerId = location.partner_id[0];
          const partner = this.partnersWithCoords?.find((p: any) =>
            p.id?.toLowerCase().replace(/[\s_]/g, '') === partnerId?.toLowerCase().replace(/[\s_]/g, '')
          );

          if (partner) {
            return partner.coordinates;
          }
        }
        if (location.stateName) {
          const stateIcon = stateIcons.find(icon => icon && icon.stateName.toLowerCase() === location.stateName.toLowerCase());
          if (stateIcon) return stateIcon.coordinates;
        }
        if (location.countryName) {
            const countryIcon = countryIcons.find(icon => icon && icon.countryName.toLowerCase() === location.countryName.toLowerCase());
            if (countryIcon) return countryIcon.coordinates;
        }
        return getCoords(location);
      };

      const lineGenerator = d3.line().curve(d3.curveBundle.beta(0.85));

      g.selectAll('path.network-line')
        .data((this.networkData?.impactData || []).filter((d: any) => d.source && d.target))
        .enter().append('path')
        .attr('class', 'network-line')
        .attr('d', (d: any) => {
          const sourceCoords = getLineCoords(d.source);
          const targetCoords = getLineCoords(d.target);
          if (!sourceCoords || !targetCoords) return null;

          const projectedSource = projection(sourceCoords);
          const projectedTarget = projection(targetCoords);
          if (!projectedSource || !projectedTarget) return null;
          
          const midX = (projectedSource[0] + projectedTarget[0]) / 2;
          const midY = (projectedSource[1] + projectedTarget[1]) / 2;

          let controlPoint: [number, number];
          const currentCurvature = d.curvature !== undefined ? d.curvature : 0.3;

          if (currentCurvature === 0) {
            controlPoint = [midX, midY];
          } else {
            const dx = projectedTarget[0] - projectedSource[0];
            const dy = projectedTarget[1] - projectedSource[1];
            controlPoint = [midX, midY - Math.abs(dy) * currentCurvature];
          }

          return lineGenerator([projectedSource, controlPoint, projectedTarget]);
        })
        .attr('fill', 'none')
        .attr('stroke', (d: any) => d.color)
        .attr('stroke-width', 1)
        .attr('opacity', 0.9)
        .attr('stroke-dasharray', (d: any) => {
          if (d.lineType === 'dotted' || d.lineType === 'arrowhead') return '10,10';
          else if (d.lineType === 'multi-dash') return '20, 5, 10, 5';
          else return '0,0';
        })
        .attr('marker-end', (d: any) => d.lineType === 'arrowhead' ? 'url(#arrowhead)' : '')
        .each(function (d: any) {
          if (d.lineType === 'dotted' || d.lineType === 'arrowhead') {
            const totalLength = (this as SVGPathElement).getTotalLength();
            const pathElement = d3.select(this);

            function repeat() {
              pathElement
                .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                .attr('stroke-dashoffset', totalLength)
                .transition().duration(15000).ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0)
                .on('end', repeat);
            }
            repeat();
          } else if (d.lineType === 'glow') {
            const originalPath = d3.select(this);
            function repeat() {
              originalPath
                .attr('stroke-width', 1).attr('opacity', 0.9)
                .transition().duration(15000).ease(d3.easeLinear)
                .attr('stroke-width', 1).attr('opacity', 0.9)
                .transition().duration(15000).ease(d3.easeLinear)
                .attr('stroke-width', 1).attr('opacity', 0.9)
                .on('end', repeat);
            }
            repeat();
          } else if (d.lineType === 'multi-dash') {
            const totalLength = (this as SVGPathElement).getTotalLength();
            const pathElement = d3.select(this);
            function repeat() {
              pathElement
                .attr('stroke-dashoffset', totalLength)
                .transition().duration(15000).ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0)
                .on('end', repeat);
            }
            repeat();
          }
        });

      const partnerIcons = (this.partnersWithCoords || []).map((partner: any) => {
        let iconType = 'momentum'; // default
        if (partner.category) {
          let category = partner.category.trim().toLowerCase();
          if (category === 'stategic') {
            category = 'strategic';
          }
          if (this.markerConfigList[category]) {
            iconType = category;
          }
        }
        return {
          iconUrl: this.markerConfigList[iconType].icon,
          coordinates: partner.coordinates,
          partner: partner,
          partnerIds: [partner.id]
        };
      });

      const allIconsData = [
        ...stateIcons.map(d => ({ ...d, partnerIds: d!.partners.map(p => p.id) })),
        ...countryIcons.map(d => ({ ...d, partnerIds: d!.partners.map(p => p.id) })),
        ...partnerIcons
      ];
      
      g.selectAll('image.node-icon')
        .data(allIconsData)
        .enter().append('image')
        .attr('class', 'node-icon')
        .attr('xlink:href', (d: any) => d.iconUrl)
        .attr('x', (d: any) => {
          const projected = projection(d.coordinates);
          return projected ? projected[0] - 2 : -9999;
        })
        .attr('y', (d: any) => {
          const projected = projection(d.coordinates);
          return projected ? projected[1] - 2 : -9999;
        })
        .attr('width', 4)
        .attr('height', 4)
        .each(function (d: any) {
          const icon = d3.select(this);
          const projected = projection(d.coordinates);
          if (!projected) return;
          const x = projected[0];
          const y = projected[1];

          function rotate() {
            icon.transition()
              .duration(2000)
              .ease(d3.easeLinear)
              .attrTween('transform', () => {
                const i = d3.interpolate(0, 360);
                return (t) => `rotate(${i(t)}, ${x}, ${y})`;
              })
              .on('end', rotate);
          }
          rotate();
        });

      const indiaCountry = countries.find((d: any) => d.properties.name === 'India');
      if (indiaCountry) {
        // @ts-ignore
        const bounds = path.bounds(indiaCountry as any) as [[number, number], [number, number]];
        const dx = bounds[1][0] - bounds[0][0];
        const dy = bounds[1][1] - bounds[0][1];
        const x = (bounds[0][0] + bounds[1][0]) / 2;
        const y = (bounds[0][1] + bounds[1][1]) / 2;
        const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        g.transition()
          .duration(2000)
          .attr('transform', `translate(${translate}) scale(${scale})`);
      }

    }).catch(err => console.error('Error loading data:', err));
  }
}
