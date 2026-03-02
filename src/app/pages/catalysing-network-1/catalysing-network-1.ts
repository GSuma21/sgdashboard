import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener, Input } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { INDIA, NETWORK_DATA } from '../../../constants/urlConstants';

@Component({
  selector: 'app-catalysing-network-1',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalysing-network-1.html',
  styleUrl: './catalysing-network-1.css'
})
export class CatalysingNetwork1 implements OnInit {
  @ViewChild('networkMapContainer') private mapContainer!: ElementRef;
  @Input() showDetails: boolean = false;
  @Input() isPartnerShowable: boolean = true;
  @Input() iconSize:number =18
  private isDrawing = false;
  baseUrl:any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`

  networkData: any
  partnersByState: { [key: string]: any[] } = {};
  markerConfigList: any = {
    momentum: { hqIcon: "./assets/marker-icons/momentum-partners.svg", icon: "./assets/marker-icons/momentum-partners.svg", color: "#572E91" },
    strategic: { hqIcon: "./assets/marker-icons/strategic-partners.svg", icon: "./assets/marker-icons/strategic-partners.svg", color: "orange" },
    collaborator: { hqIcon: "./assets/marker-icons/hq-triangle.svg", icon: "./assets/marker-icons/triangle.svg", color: "red" },
    anchor: { hqIcon: "./assets/marker-icons/hq-diamond.svg", icon: "./assets/marker-icons/diamond.svg", color: "pink" }
  }


   displayLegends = [
    // {
    //   type: 'line',
    //   label: 'Momentum Impact',
    //   class: 'momentum-line'
    // },
    {
      type: 'line',
      label: 'Strategy Impact',
      class: 'strategy-line'
    },
    {
      type: 'icon',
      label: 'Momentum Partners',
      icon: './assets/marker-icons/momentum-partners.svg'
    },
    {
      type: 'icon',
      label: 'Strategic Partners',
      icon: './assets/marker-icons/strategic-partners.svg'
    },
    {
      type: 'note',
      label: '*This map is a visual guide and not drawn to scale.'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.getNetworkData().then(() => {
      if (this.networkData) {
        this.drawMap();
      }
    });
  }

  goToNetworkPage() {
    if (!this.isPartnerShowable) {
      this.router.navigate(['/network-health']);
    }
  }

  getNetworkData(): Promise<void> {
    return d3.json(`${this.baseUrl}/${NETWORK_DATA}`)
      .then((networkData: any) => {
        this.networkData = networkData;
        const partnersWithCoords: any[] = [];
        const partnersByState: { [key: string]: any[] } = {};
        const countryLevelPartners: any[] = [];

        networkData.partners.forEach((p: any) => {
          if (p.coordinates && p.coordinates.length === 2 && p.coordinates[0] && p.coordinates[1]) {
            partnersWithCoords.push({ ...p, coordinates: [p.coordinates[1], p.coordinates[0]] });
          } else if (p.partnerState) {
            if (!partnersByState[p.partnerState]) {
              partnersByState[p.partnerState] = [];
            }
            partnersByState[p.partnerState].push(p);
          } else {
            // countryLevelPartners.push(p);
          }
        });

        this.networkData.partnersWithCoords = partnersWithCoords;
        this.partnersByState = partnersByState;
        this.networkData.countryLevelPartners = countryLevelPartners;
      })
      .catch((error: any) => {
        console.error('Error loading network data:', error);
      });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.drawMap();
  }

  private drawMap(): void {
    if (this.isDrawing) return;
    this.isDrawing = true;

    // Clear existing content to prevent multiple maps on resize
    d3.select(this.mapContainer.nativeElement).selectAll('*').remove();

    const container = this.mapContainer.nativeElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    d3.json(`${this.baseUrl}/${INDIA}`).then((india: any) => {
      const states = topojson.feature(india, india.objects.states) as any;

      const stateGeometries = states.features.map((f: any) => f.geometry);
      const partnerGeometries = this.networkData.partnersWithCoords.map((partner: any) => {
        return {
          type: 'Point',
          coordinates: partner.coordinates
        };
      });

      const allGeometries = {
        type: 'GeometryCollection',
        geometries: stateGeometries.concat(partnerGeometries)
      };

      const projection = d3.geoMercator().fitSize([containerWidth, containerHeight], allGeometries);
      const path = d3.geoPath().projection(projection);

      const svg = d3.select(this.mapContainer.nativeElement)
        .append('svg')
        .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'line-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');

      gradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(99, 172, 99, 0)');
      gradient.append('stop').attr('offset', '50%').attr('stop-color', 'green');
      gradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(0,255,0,0)');

      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-5 -5 10 10')
        .attr('refX', 5)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M 0,0 m -5,-5 L 5,0 L -5,5 Z')
        .attr('fill', 'purple');

      svg.selectAll('path')
        .data(states.features)
        .enter().append('path')
        .attr('d', path as any)
        .attr('fill', '#ffcc99')
        .attr('stroke', '#000')
        .attr('stroke-width', 0.3);

      const getCoords = (location: any) => {
        let locationName = location.stateName || location.countryName;
        if (locationName) {
          locationName = locationName.trim().toLowerCase();
          if (locationName === 'india') return d3.geoCentroid(states);

          const feature = states.features.find((f: any) =>
            f.properties && f.properties.st_nm && f.properties.st_nm.trim().toLowerCase() === locationName
          );
          if (feature) return d3.geoCentroid(feature);

          if (location.countryName) {
            return projection.invert ? projection.invert([containerWidth / 2, 0]) : [0, 0];
          }
        }
        console.warn(`Location not found for`, location);
        return null;
      };

      const tooltip = d3.select('#tooltip');
      svg.on('click', () => tooltip.style('display', 'none'));

      // Consolidated State Icons
      const stateIcons = Object.keys(this.partnersByState).map(stateName => {
        const partnersInState = this.partnersByState[stateName];
        const representativePartner = partnersInState[0]; // Take the first partner as representative
        const coords = getCoords({ stateName: stateName });
        if (coords && representativePartner) {
          return {
            iconUrl: this.markerConfigList.momentum.icon, // Always use momentum icon for state
            coordinates: coords,
            stateName: stateName,
            partners: partnersInState
          };
        }
        return null;
      }).filter(d => d !== null);

      // Use a modified getCoords for lines to ensure they connect to state icons
      const getLineCoords = (location: any) => {
        if (location.partner_id && location.partner_id.length > 0) {
            let partnerId = location.partner_id[0];
          const partner = this.networkData.partnersWithCoords.find((p: any) =>
            p.id?.toLowerCase().replace(/[\s_]/g, '') === partnerId?.toLowerCase().replace(/[\s_]/g, '')
          );

            if (partner) {
                return partner.coordinates;
            }
        }
        if (location.stateName) {
          const stateIcon = stateIcons.find(icon => icon.stateName.toLowerCase() === location.stateName.toLowerCase());
          if (stateIcon) return stateIcon.coordinates;
        }
        // Fallback to original getCoords if not a state or state icon not found
        return getCoords(location);
      };

      const lineGenerator = d3.line().curve(d3.curveBundle.beta(0.85));

      svg.selectAll('path.network-line')
        .data(this.networkData?.impactData.filter((d: any) => d.source && d.target))
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

      svg.selectAll('image.state-node-icon')
        .data(stateIcons)
        .enter().append('image')
        .attr('class', 'state-node-icon')
        .attr('xlink:href', (d: any) => d.iconUrl)
        .attr('x', (d: any) => {
          const projected = projection(d.coordinates);
          return projected ? projected[0] - (this.iconSize/2)  : -9999;
        })
        .attr('y', (d: any) => {
          const projected = projection(d.coordinates);
          return projected ? projected[1] - (this.iconSize/2) : -9999;
        })
        .attr('width', this.iconSize)
        .attr('height', this.iconSize)
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
        })
        .on('click', (event, d: any) => {
          if (this.isPartnerShowable) {
            event.stopPropagation();
            const partnersHtml = `
<div style="position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  width: 250px;
  border: 1px solid #000000ff;
  font-family: Arial, sans-serif;
  box-sizing: border-box;

  /* NEW SCROLL STYLES */
  max-height: 300px;   /* limit tooltip height */
  overflow-y: auto;    /* enable vertical scroll if content exceeds */
">
  <!-- Pointer arrow on left, near top -->
  <div style="
    position: absolute;
    left: -8px;
    top: 20px; /* adjust this value to move arrow up/down */
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid white;
    filter: drop-shadow(-1px 0px 1px rgba(0,0,0,0.05));
  "></div>

  ${d.partners.map((p: any, index: number) => `
    <a href="${p.website}" target="_blank" style="
      text-decoration: none;
      color: inherit;
      display: block;
    ">
      <div style="
        display: grid;
        grid-template-columns: 36px 1fr; /* fixed icon column + text column */
        align-items: center;
        padding: 8px 12px;
        ${index !== d.partners.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}
      ">
        <!-- fixed icon cell -->
        <div style="
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <img src="${p.src}" alt="${p.name}" style="
            display: block;
            width: 24px;        /* force same visible size */
            height: 24px;
            object-fit: contain;/* keeps logo aspect ratio and centers it */
          ">
        </div>

        <!-- text cell -->
        <div style="display: flex; flex-direction: column; justify-content: center; margin: 0; padding-left: 5px;">
          <div style="display: flex;text-align: left; font-weight: 600; font-size: 14px; color: #000; line-height: 1.2; margin: 0;">
            ${p.name}
          </div>
          <div style="display: flex; font-size: 12px; color: #777; line-height: 1.2; margin: 0;">
            ${p.category} partner
          </div>
        </div>
      </div>
    </a>
  `).join('')}
</div>
`;
            tooltip.style('display', 'block')
              .html(partnersHtml)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          }
        });

      const partnerIcons = this.networkData.partnersWithCoords.map((partner: any) => {
        let iconType = 'momentum'; // default
        if (partner.category) {
            let category = partner.category.trim().toLowerCase();
            if (category === 'strategic') {
                category = 'strategic';
            }
            if (this.markerConfigList[category]) {
                iconType = category;
            }
        }
        return {
            iconUrl: this.markerConfigList[iconType].icon,
            coordinates: partner.coordinates,
            partner: partner
        };
      });

      svg.selectAll('image.partner-node-icon')
        .data(partnerIcons)
        .enter().append('image')
        .attr('class', 'partner-node-icon')
        .attr('xlink:href', (d: any) => d.iconUrl)
        .attr('x', (d: any) => {
          const projected = projection(d.coordinates);
          return projected ? projected[0] - (this.iconSize/2)  : -9999;
        })
        .attr('y', (d: any) => {
          const projected = projection(d.coordinates);
          return projected ? projected[1] - (this.iconSize/2)  : -9999;
        })
        .attr('width', this.iconSize)
        .attr('height', this.iconSize)
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
        })
        .on('click', (event: any, d: any) => {
          if (this.isPartnerShowable) {
            event.stopPropagation();
            const p = d.partner;
            const partnersHtml = `
<div style="
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  width: 250px;
  border: 1px solid #000000ff;
  font-family: Arial, sans-serif;
  box-sizing: border-box;
">
  <!-- Pointer arrow on left, near top -->
  <div style="
    position: absolute;
    left: -8px;
    top: 20px; /* adjust this value to move arrow up/down */
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid white;
    filter: drop-shadow(-1px 0px 1px rgba(0,0,0,0.05));
  "></div>

    <a href="${p.website}" target="_blank" style="
      text-decoration: none;
      color: inherit;
      display: block;
    ">
      <div style="
        display: grid;
        grid-template-columns: 36px 1fr; /* fixed icon column + text column */
        align-items: center;
        padding: 8px 12px;
      ">
        <!-- fixed icon cell -->
        <div style="
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <img src="${p.src}" alt="${p.name}" style="
            display: block;
            width: 24px;        /* force same visible size */
            height: 24px;
            object-fit: contain;/* keeps logo aspect ratio and centers it */
          ">
        </div>

        <!-- text cell -->
        <div style="display: flex; flex-direction: column; justify-content: center; margin: 0; padding-left: 5px;">
          <div style="display: flex; text-align: left; font-weight: 600; font-size: 14px; color: #000; line-height: 1.2; margin: 0;">
            ${p.name}
          </div>
          <div style="display: flex; font-size: 12px; color: #777; line-height: 1.2; margin: 0;">
            ${p.category} partner
          </div>
        </div>
      </div>
    </a>
</div>
`;
            tooltip.style('display', 'block')
              .html(partnersHtml)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          }
        });

      if (this.networkData.countryLevelPartners.length > 0) {
        const countryIcon = {
          iconUrl: this.markerConfigList.strategic.icon, // Or some other icon
          coordinates: d3.geoCentroid(states),
          partners: this.networkData.countryLevelPartners
        };

        svg.selectAll('image.country-node-icon')
          .data([countryIcon])
          .enter().append('image')
          .attr('class', 'country-node-icon')
          .attr('xlink:href', (d: any) => d.iconUrl)
          .attr('x', (d: any) => {
            const projected = projection(d.coordinates);
            return projected ? projected[0] - (this.iconSize/2)  : -9999;
          })
          .attr('y', (d: any) => {
            const projected = projection(d.coordinates);
            return projected ? projected[1] - (this.iconSize/2)  : -9999;
          })
          .attr('width', this.iconSize)
          .attr('height', this.iconSize)
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
          })
          .on('click', (event, d: any) => {
            if (this.isPartnerShowable) {
              event.stopPropagation();
              const partnersHtml = `
<div style="
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  width: 250px;
  border: 1px solid #000000ff;
  font-family: Arial, sans-serif;
  box-sizing: border-box;
">
  <!-- Pointer arrow on left, near top -->
  <div style="
    position: absolute;
    left: -8px;
    top: 20px; /* adjust this value to move arrow up/down */
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid white;
    filter: drop-shadow(-1px 0px 1px rgba(0,0,0,0.05));
  "></div>

  ${d.partners.map((p: any, index: number) => `
    <a href="${p.website}" target="_blank" style="
      text-decoration: none;
      color: inherit;
      display: block;
    ">
      <div style="
        display: grid;
        text-align: left; 
        grid-template-columns: 36px 1fr; /* fixed icon column + text column */
        align-items: flex-start;  /* ✅ align content from top, not center */
        padding: 8px 12px;
        ${index !== d.partners.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}
      ">
        <!-- fixed icon cell -->
        <div style="
          width: 36px;
          display: flex;
          align-items: flex-start;  /* ✅ icon aligns top */
          justify-content: center;
          flex-shrink: 0;
        ">
          <img src="${p.src}" alt="${p.name}" style="
            display: block;
            width: 24px;        /* force same visible size */
            height: 24px;
            object-fit: contain;/* keeps logo aspect ratio and centers it */
          ">
        </div>

        <!-- text cell -->
        <div style="
          display: flex; 
          flex-direction: column; 
          justify-content: flex-start; /* ✅ text starts at top */
          margin: 0; 
          padding-left: 5px;
          text-align: left;           /* ✅ ensure left alignment */
        ">
          <div style=" display: flex;  text-align: left; font-weight: 600; font-size: 14px; color: #000; line-height: 1.3; margin: 0; word-break: break-word;">
            ${p.name}
          </div>
          <div style="font-size: 12px; color: #777; line-height: 1.2; margin: 0;">
            ${p.category} partner
          </div>
        </div>
      </div>
    </a>
  `).join('')}
</div>

`;
              tooltip.style('display', 'block')
                .html(partnersHtml)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            }
          });
      }

      this.isDrawing = false;
    }).catch((error: any) => {
      console.error('Error loading or processing the TopoJSON data:', error);
      this.isDrawing = false;
    });
  }

}
