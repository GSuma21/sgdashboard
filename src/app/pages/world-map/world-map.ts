import { Component, OnInit, ElementRef, ViewChild, Input, HostListener } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FeatureCollection, Geometry } from 'geojson';
import { INDIA, NETWORK_DATA } from '../../../constants/urlConstants';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
  standalone: true,
  imports: [CommonModule],
  templateUrl: './world-map.html',
  styleUrls: ['./world-map.css']
})
export class WorldMapComponent implements OnInit {

  @ViewChild('map', { static: true }) private mapContainer!: ElementRef;
  @Input() showDetails: boolean = true;



    isMobile = false;
  scale = 1;
  readonly zoomStep = 0.2;
  readonly minScale = 1;
  readonly maxScale = 3;

  constructor(private router: Router) { }

  baseUrl: any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`;

  markerConfigList: any = {
    "momentum": { hqIcon: "./assets/marker-icons/momentum-partners.svg", icon: "./assets/marker-icons/momentum.svg", color: "#572E91" },
    "strategic": { hqIcon: "./assets/marker-icons/strategic-partners.svg", icon: "./assets/marker-icons/stategic.svg", color: "orange" },
    "collaborators": { hqIcon: "./assets/marker-icons/triangle.svg", icon: "./assets/marker-icons/collaborators.svg", color: "red" }
  };

  displayLegends = [
    // {
    //   type: 'line',
    //   label: 'Momentum Impact',
    //   class: 'momentum-line'
    // },
    // {
    //   type: 'line',
    //   label: 'Strategy Impact',
    //   class: 'strategy-line'
    // },
    {
      type: 'icon',
      label: 'Momentum partners',
      icon: './assets/marker-icons/momentum.svg'
    },
    {
      type: 'icon',
      label: 'Strategic partners',
      icon: './assets/marker-icons/stategic.svg'
    },
    {
      type: 'icon',
      label: 'Collaborators',
      icon: './assets/marker-icons/collaborators.svg'
    },
    {
      type: 'note',
      label: [
        '*Click icons on the map to know about the partners in different states.', 
        '*Not drawn to scale. For illustration purposes only.'
      ] 
    }
  ];

  private svg: any;
  private g: any;
  private indiaGroup: any;
  private partnersGroup: any;
  private projection: any;
  private path: any;
  private isIndiaZoomed: boolean = false;
  private tooltip: any;

  private width = 1500;
  private height = 800;

  private countryMap: Record<string, string> = {
    'IND': '356', // India

    // US
    'USA': '840', // United States

    // UK
    'GBR': '826', // United Kingdom

    // Europe
    'ALB': '008',  // Albania
    'AND': '020',  // Andorra
    // 'ARM': '051',  // Armenia
    'AUT': '040',  // Austria
    // 'AZE': '031',  // Azerbaijan
    'BLR': '112',  // Belarus
    'BEL': '056',  // Belgium
    'BIH': '070',  // Bosnia and Herzegovina
    'BGR': '100',  // Bulgaria
    'HRV': '191',  // Croatia
    'CYP': '196',  // Cyprus
    'CZE': '203',  // Czechia
    'DNK': '208',  // Denmark
    'EST': '233',  // Estonia
    'FIN': '246',  // Finland
    'FRA': '250',  // France
    // 'GEO': '268',  // Georgia
    'DEU': '276',  // Germany
    'GRC': '300',  // Greece
    'HUN': '348',  // Hungary
    'ISL': '352',  // Iceland
    'IRL': '372',  // Ireland
    'ITA': '380',  // Italy
    // 'KAZ': '398',  // Kazakhstan
    'LVA': '428',  // Latvia
    'LIE': '438',  // Liechtenstein
    'LTU': '440',  // Lithuania
    'LUX': '442',  // Luxembourg
    'MLT': '470',  // Malta
    'MDA': '498',  // Moldova, Republic of
    'MCO': '492',  // Monaco
    'MNE': '499',  // Montenegro
    'NLD': '528',  // Netherlands
    'MKD': '807',  // North Macedonia
    'NOR': '578',  // Norway
    'POL': '616',  // Poland
    'PRT': '620',  // Portugal
    'ROU': '642',  // Romania
    'SMR': '674',  // San Marino
    'SRB': '688',  // Serbia
    'SVK': '703',  // Slovakia
    'SVN': '705',  // Slovenia
    'ESP': '724',  // Spain
    'SWE': '752',  // Sweden
    'CHE': '756',  // Switzerland
    // 'TUR': '792',  // Turkey
    'UKR': '804',  // Ukraine
    'VAT': '336',  // Holy See (Vatican City State)

    // Africa
    'DZA': '012',  // Algeria
    'AGO': '024',  // Angola
    'BEN': '204',  // Benin
    'BWA': '072',  // Botswana
    'BFA': '854',  // Burkina Faso
    'BDI': '108',  // Burundi
    'CMR': '120',  // Cameroon
    'CPV': '132',  // Cabo Verde
    'CAF': '140',  // Central African Republic
    'TCD': '148',  // Chad
    'COM': '174',  // Comoros
    'COG': '178',  // Congo
    'COD': '180',  // Congo, The Democratic Republic of the
    'CIV': '384',  // Côte d'Ivoire
    'DJI': '262',  // Djibouti
    'EGY': '818',  // Egypt
    'GNQ': '226',  // Equatorial Guinea
    'ERI': '232',  // Eritrea
    'SWZ': '748',  // Eswatini
    'ETH': '231',  // Ethiopia
    'GAB': '266',  // Gabon
    'GMB': '270',  // Gambia
    'GHA': '288',  // Ghana
    'GIN': '324',  // Guinea
    'GNB': '624',  // Guinea‑Bissau
    'KEN': '404',  // Kenya
    'LSO': '426',  // Lesotho
    'LBR': '430',  // Liberia
    'LBY': '434',  // Libya
    'MDG': '450',  // Madagascar
    'MWI': '454',  // Malawi
    'MLI': '466',  // Mali
    'MRT': '478',  // Mauritania
    'MUS': '480',  // Mauritius
    'MYT': '175',  // Mayotte
    'MAR': '504',  // Morocco
    'MOZ': '508',  // Mozambique
    'NAM': '516',  // Namibia
    'NER': '562',  // Niger
    'NGA': '566',  // Nigeria
    'REU': '638',  // Réunion
    'RWA': '646',  // Rwanda
    'STP': '678',  // Sao Tome and Principe
    'SEN': '686',  // Senegal
    'SYC': '690',  // Seychelles
    'SLE': '694',  // Sierra Leone
    'SOM': '706',  // Somalia
    'ZAF': '710',  // South Africa
    'SSD': '728',  // South Sudan
    'SDN': '729',  // Sudan
    'TZA': '834',  // Tanzania, United Republic of
    'TGO': '768',  // Togo
    'TUN': '788',  // Tunisia
    'UGA': '800',  // Uganda
    'ESH': '732',  // Western Sahara
    'ZMB': '894',  // Zambia
    'ZWE': '716',  // Zimbabwe

    'SGP': '702',  // Singapore

    'AUS': '036',

    'THA': '764'  // Thailand
  };

  // Only for moving countries: left/right/up/down and scaling
  private countryTransforms: Record<string, { scale?: number; translate?: [number, number] }> = {
    'IND': { scale: 7, translate: [-20, 10] },
    'SGP': { scale: 0, translate: [250, 250] },
    'THA': { scale: 3, translate: [250, 220] },
    'USA': { scale: 0, translate: [-50, -80] },
    'GBR': { scale: 0, translate: [-90, 0] },
    'CAN': { scale: 0, translate: [0, -20] },
    'AUS': { scale: 0, translate: [350, 180] },

    // Add African countries with left shift (-250px)
    'DZA': { translate: [-250, 100] }, 'AGO': { translate: [-250, 100] }, 'BEN': { translate: [-250, 100] },
    'BWA': { translate: [-250, 100] }, 'BFA': { translate: [-250, 100] }, 'BDI': { translate: [-250, 100] },
    'CMR': { translate: [-250, 100] }, 'CPV': { translate: [-250, 100] }, 'CAF': { translate: [-250, 100] },
    'TCD': { translate: [-250, 100] }, 'COM': { translate: [-250, 100] }, 'COG': { translate: [-250, 100] },
    'COD': { translate: [-250, 100] }, 'CIV': { translate: [-250, 100] }, 'DJI': { translate: [-250, 100] },
    'EGY': { translate: [-250, 100] }, 'GNQ': { translate: [-250, 100] }, 'ERI': { translate: [-250, 100] },
    'SWZ': { translate: [-250, 100] }, 'ETH': { translate: [-250, 100] }, 'GAB': { translate: [-250, 100] },
    'GMB': { translate: [-250, 100] }, 'GHA': { translate: [-250, 100] }, 'GIN': { translate: [-250, 100] },
    'GNB': { translate: [-250, 100] }, 'KEN': { translate: [-250, 100] }, 'LSO': { translate: [-250, 100] },
    'LBR': { translate: [-250, 100] }, 'LBY': { translate: [-250, 100] }, 'MDG': { translate: [-250, 100] },
    'MWI': { translate: [-250, 100] }, 'MLI': { translate: [-250, 100] }, 'MRT': { translate: [-250, 100] },
    'MUS': { translate: [-250, 100] }, 'MYT': { translate: [-250, 100] }, 'MAR': { translate: [-250, 100] },
    'MOZ': { translate: [-250, 100] }, 'NAM': { translate: [-250, 100] }, 'NER': { translate: [-250, 100] },
    'NGA': { translate: [-250, 100] }, 'REU': { translate: [-250, 100] }, 'RWA': { translate: [-250, 100] },
    'STP': { translate: [-250, 100] }, 'SEN': { translate: [-250, 100] }, 'SYC': { translate: [-250, 100] },
    'SLE': { translate: [-250, 100] }, 'SOM': { translate: [-250, 100] }, 'ZAF': { translate: [-250, 100] },
    'SSD': { translate: [-250, 100] }, 'SDN': { translate: [-250, 100] }, 'TZA': { translate: [-250, 100] },
    'TGO': { translate: [-250, 100] }, 'TUN': { translate: [-250, 100] }, 'UGA': { translate: [-250, 100] },
    'ESH': { translate: [-250, 100] }, 'ZMB': { translate: [-250, 100] }, 'ZWE': { translate: [-250, 100] },

    // Europe countries with left shift (-150px)
    'ALB': { translate: [-200, 80] }, 'AND': { translate: [-200, 80] }, 'ARM': { translate: [-200, 80] },
    'AUT': { translate: [-200, 80] }, 'AZE': { translate: [-200, 80] }, 'BLR': { translate: [-200, 80] },
    'BEL': { translate: [-200, 80] }, 'BIH': { translate: [-200, 80] }, 'BGR': { translate: [-200, 80] },
    'HRV': { translate: [-200, 80] }, 'CYP': { translate: [-200, 80] }, 'CZE': { translate: [-200, 80] },
    'DNK': { translate: [-200, 80] }, 'EST': { translate: [-200, 80] }, 'FIN': { translate: [-200, 80] },
    'FRA': { translate: [-200, 80] }, 'GEO': { translate: [-200, 80] }, 'DEU': { translate: [-200, 80] },
    'GRC': { translate: [-200, 80] }, 'HUN': { translate: [-200, 80] }, 'ISL': { translate: [-200, 80] },
    'IRL': { translate: [-200, 80] }, 'ITA': { translate: [-200, 80] }, 'KAZ': { translate: [-200, 80] },
    'LVA': { translate: [-200, 80] }, 'LIE': { translate: [-200, 80] }, 'LTU': { translate: [-200, 80] },
    'LUX': { translate: [-200, 80] }, 'MLT': { translate: [-200, 80] }, 'MDA': { translate: [-200, 80] },
    'MCO': { translate: [-200, 80] }, 'MNE': { translate: [-200, 80] }, 'NLD': { translate: [-200, 80] },
    'MKD': { translate: [-200, 80] }, 'NOR': { translate: [-200, 80] }, 'POL': { translate: [-200, 80] },
    'PRT': { translate: [-200, 80] }, 'ROU': { translate: [-200, 80] }, 'SMR': { translate: [-200, 80] },
    'SRB': { translate: [-200, 80] }, 'SVK': { translate: [-200, 80] }, 'SVN': { translate: [-200, 80] },
    'ESP': { translate: [-200, 80] }, 'SWE': { translate: [-200, 80] }, 'CHE': { translate: [-200, 80] },
    'TUR': { translate: [-200, 80] }, 'UKR': { translate: [-200, 80] }, 'VAT': { translate: [-200, 80] }
  };

  ngOnInit(): void {
    this.createMap();
    this.checkIfMobile();
  }

  private createMap(): void {
    const element = this.mapContainer.nativeElement;
    const mapEl = this.mapContainer.nativeElement as HTMLElement;
    const mapWrapperEl = mapEl.closest('.map-wrapper') || mapEl.parentElement?.parentElement || document.body;

    this.svg = d3.select(this.mapContainer.nativeElement)
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', () => this.router.url === '/world-map' ? '98vh' : null)

    this.tooltip = d3.select(mapWrapperEl)
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    this.g = this.svg.append('g').attr('class', 'world');
    this.indiaGroup = this.svg.append('g').attr('class', 'india');

    this.projection = d3.geoMercator()
      .scale(150)
      .translate([this.width / 2 - 150, this.height / 2]);

    this.path = d3.geoPath().projection(this.projection);

    Promise.all([
      d3.json<any>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json'),
      d3.json<any>(`${this.baseUrl}/${INDIA}`),
      d3.json<NetworkData>(`${this.baseUrl}/${NETWORK_DATA}`)
    ]).then(([topology, indiaTopology, networkData]) => {
      const countries = topojson.feature(topology, topology.objects.countries) as unknown as FeatureCollection<Geometry, any>;
      const states = topojson.feature(indiaTopology, indiaTopology.objects.states) as unknown as FeatureCollection<Geometry, any>;

      const filteredCountries = countries.features.filter(f =>
        f.id !== undefined && Object.values(this.countryMap).includes(String(f.id))
      );

      // Draw countries (except India)
      filteredCountries.filter(f => String(f.id) !== this.countryMap['IND']).forEach(f => {
        const code = Object.keys(this.countryMap).find(k => this.countryMap[k] === String(f.id));
        if (!code) return;

        const group = this.g.append('g').attr('class', `country-${code.toLowerCase()}`);
        group.append('path')
          .datum(f)
          .attr('d', this.path)
          .attr('fill', '#e0e0e0ff')
          .attr('stroke', '#ffffffff')
          .attr('stroke-width', 0.5);

        // Apply only left/right/up/down and scale
        const transform = this.countryTransforms[code];
        if (transform) {
          const scale = transform.scale || 1;
          const translate = transform.translate || [0, 0];
          const centroid = this.path.centroid(f);
          group.attr('transform',
            `translate(${centroid[0] + translate[0]},${centroid[1] + translate[1]}) scale(${scale}) translate(${-centroid[0]},${-centroid[1]})`
          );
        }
      });

      const indiaData = filteredCountries.find(f => String(f.id) === this.countryMap['IND']);
      if (indiaData) {
        // Draw India states
        this.indiaGroup.selectAll('.state')
          .data(states.features)
          .enter()
          .append('path')
          .attr('class', 'state')
          .attr('d', this.path)
          .attr('fill', '#ffcc99')
          .attr('stroke', '#000000ff')
          .attr('stroke-width', 0.04);

        // Apply India transform
        const transform = this.countryTransforms['IND'];
        if (transform) {
          const scale = transform.scale || 1;
          const translate = transform.translate || [0, 0];
          const centroid = this.path.centroid(indiaData);
          this.indiaGroup.attr('transform',
            `translate(${centroid[0] + translate[0]},${centroid[1] + translate[1]}) scale(${scale}) translate(${-centroid[0]},${-centroid[1]})`
          );
          this.isIndiaZoomed = true;
        }
      }

      if (networkData) {
        this.drawConnectionLines(networkData, filteredCountries, states.features, indiaData);
        this.drawPartners(networkData, indiaData);
      }
    }).catch(err => console.error('Data load error:', err));
  }

  // --- Partners and connection lines remain unchanged ---
  private normalizeId(id: string): string {
    return (id || '')
      .toLowerCase()
      .replace(/[\s_\.]/g, '') // remove spaces, underscores, periods
      .replace(/[^a-z0-9]/g, ''); // remove any remaining non-alphanumeric chars
  }

 private drawPartners(networkData: NetworkData, indiaData: any): void {
  if (!networkData?.partners?.length) return;

  if (!this.partnersGroup) {
    this.partnersGroup = this.svg.append('g').attr('class', 'partners');
  }

  const indiaScale = this.countryTransforms['IND']?.scale ?? 4;
  const iconSize = 14;

  networkData.partners.forEach((partner: Partner) => {
    if (!partner?.coordinates || partner.coordinates.length !== 2) return;

    const categoryKey = (partner.category || '').trim().toLowerCase();
    const iconConfig = this.markerConfigList?.[categoryKey];
    const iconPath = iconConfig?.icon ?? 'circle.svg';

    // NOTE: D3 projection expects [longitude, latitude]
    const [lat, lon] = partner.coordinates;
    let projected = this.projection?.([lon, lat]);
    if (!projected) return;

    const isInsideIndia = indiaData ? d3.geoContains(indiaData, [lon, lat]) : false;
    const targetGroup = isInsideIndia ? this.indiaGroup : this.partnersGroup;

    // Shift specific countries
    const country = partner.countryName?.toLowerCase() ?? '';
    if (!isInsideIndia) {
      if (country === 'singapore') {
        projected = [projected[0] + 250, projected[1] + 250];
      } else if (country === 'united states of america (usa)') {
        projected = [projected[0] - 50, projected[1] - 80];
      } else if (country === 'united kingdom (uk)') {
        projected = [projected[0] - 100, projected[1] - 20];
      }
    }

    const size = isInsideIndia ? iconSize / indiaScale : iconSize;
    const offset = size / 2;

    const icon = targetGroup.append('image')
      .style('cursor', 'pointer')
      .attr('class', `partner-icon partner-${categoryKey}`)
      .attr('xlink:href', iconPath)
      .attr('x', projected[0] - offset)
      .attr('y', projected[1] - offset)
      .attr('width', size)
      .attr('height', size);

    icon.on('click', (event: MouseEvent) => {
  if (!this.showDetails) return;
  event.stopPropagation();

  // wrapper element (same place where tooltip was appended)
  const mapEl = this.mapContainer.nativeElement as HTMLElement;
  const viewportEl = mapEl.parentElement as HTMLElement;
  const mapWrapperEl = viewportEl?.parentElement as HTMLElement || document.body;
  const mapWrapperRect = mapWrapperEl.getBoundingClientRect();

  // Responsive tooltip sizing (no scale math)
  let tooltipMaxWidth = 250;
  let tooltipFontSize = 14;
  let smallFontSize = 12;
  let imageSize = 40;
  let paddingY = 8;
  let paddingX = 12;
  let padding = 8;
  const ARROW_TIP_OFFSET = 10;

  if (mapWrapperRect.width < 480) {
    tooltipMaxWidth = 180;
    tooltipFontSize = 12;
    smallFontSize = 10;
    imageSize = 32;
    paddingY = 4;
    paddingX = 4;
    padding = 0;
  } else if (mapWrapperRect.width < 768) {
    tooltipMaxWidth = 220;
    tooltipFontSize = 13;
    smallFontSize = 11;
    imageSize = 36;
    paddingY = 8;
    paddingX = 12;
    padding = 8;
  }

  const categorySuffix =
    partner.category?.toLowerCase() === 'collaborators'
      ? `${partner.category ?? ''}`
      : `${partner.category ?? ''} partner`;

  // Use the non-scaled sizes here (tooltipMaxWidth, tooltipFontSize etc.)
  const partnerHtml = `
    <div style="
      position: relative;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: ${padding}px 0;
      width: auto;
      max-width: ${tooltipMaxWidth}px;
      min-width: fit-content;
      border: 1px solid #000;
      font-family: Arial, sans-serif;
      max-height: 70vh;
      overflow-y: auto;
      overflow-x: hidden;
      white-space: normal;
      word-break: break-word;
      box-sizing: border-box;
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
      ${
        partner.website
          ? `<a href="${partner.website}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
              <div style="display: grid; grid-template-columns: ${imageSize}px 1fr; align-items: center; padding: ${paddingY}px ${paddingX}px;">
                <div style="width: ${imageSize}px; height: ${imageSize}px; display: flex; align-items: center; justify-content: center;">
                  <img src="${partner.src}" alt="${partner.name}" style="width: ${imageSize}px; height: ${imageSize}px; object-fit: contain;">
                </div>
                <div style="display: flex; flex-direction: column; padding-left: 5px;">
                  <div style="font-size: ${smallFontSize}px; color: #555;">${partner.countryName || ''}</div>
                  <div style="font-size: ${smallFontSize}px; color: #555;">${partner.partnerState || ''}</div>
                  <div style="font-weight: 600; font-size: ${tooltipFontSize}px; color: #000;">${partner.name || ''}</div>
                  <div style="font-size: ${smallFontSize}px; color: #777;">${categorySuffix}</div>
                </div>
              </div>
            </a>`
          : `<div style="display: grid; grid-template-columns: ${imageSize}px 1fr; align-items: center; padding: ${paddingY}px ${paddingX}px;">
              <div style="width: ${imageSize}px; height: ${imageSize}px; display: flex; align-items: center; justify-content: center;">
                <img src="${partner.src}" alt="${partner.name}" style="width: ${imageSize}px; height: ${imageSize}px; object-fit: contain;">
              </div>
              <div style="display: flex; flex-direction: column; padding-left: 5px;">
                <div style="font-size: ${smallFontSize}px; color: #555;">${partner.countryName || ''}</div>
                <div style="font-size: ${smallFontSize}px; color: #555;">${partner.partnerState || ''}</div>
                <div style="font-weight: 600; font-size: ${tooltipFontSize}px; color: #000;">${partner.name || ''}</div>
                <div style="font-size: ${smallFontSize}px; color: #777;">${categorySuffix}</div>
              </div>
            </div>`
      }
    </div>`;

  // render then measure (no transforms)
  this.tooltip.html(partnerHtml)
    .style('opacity', 0)
    .style('pointer-events', 'none')
    .style('transform', 'none')
    .style('left', '0px')
    .style('top', '0px');

  const tooltipNode = this.tooltip.node() as HTMLElement;
  const tooltipRect = tooltipNode.getBoundingClientRect();
  const tooltipWidth = Math.min(tooltipRect.width, tooltipMaxWidth);
  const tooltipHeight = tooltipRect.height;

  const screenX = event.clientX;
  const screenY = event.clientY;

  // compute position relative to the wrapper (tooltip is a child of wrapper)
  let left = screenX - mapWrapperRect.left - tooltipWidth - ARROW_TIP_OFFSET;
  let top = screenY - mapWrapperRect.top - tooltipHeight - ARROW_TIP_OFFSET;

  // horizontal clamp: prefer to place tooltip to left, otherwise to right
  if (left < ARROW_TIP_OFFSET) {
    left = screenX - mapWrapperRect.left + ARROW_TIP_OFFSET;
  }
  if (left + tooltipWidth > mapWrapperRect.width - ARROW_TIP_OFFSET) {
    left = mapWrapperRect.width - tooltipWidth - ARROW_TIP_OFFSET;
  }

  // vertical clamp: prefer above pointer, otherwise below
  if (top < ARROW_TIP_OFFSET) {
    top = screenY - mapWrapperRect.top + ARROW_TIP_OFFSET;
    if (top + tooltipHeight > mapWrapperRect.height - ARROW_TIP_OFFSET) {
      top = mapWrapperRect.height - tooltipHeight - ARROW_TIP_OFFSET;
    }
  }

  // apply final positioning
  this.tooltip
    .style('left', `${left}px`)
    .style('top', `${top}px`)
    .style('pointer-events', 'auto')
    .transition()
    .duration(200)
    .style('opacity', 1);
});

  });

  const mapEl = d3.select(this.mapContainer.nativeElement);
  mapEl.style('cursor', this.showDetails ? 'default' : 'pointer');

  mapEl.on('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!this.showDetails) {
      if (!target.closest('.partner-icon') && !target.closest('.tooltip')) {
        this.router.navigate(['/network-health']);
      }
    } else {
      if (!target.closest('.partner-icon')) {
        this.tooltip.transition().duration(200)
          .style('opacity', 0)
          .style('pointer-events', 'none');
      }
    }
  });
}


  private drawConnectionLines(networkData: NetworkData, countries: any[], states: any[], indiaData?: any): void {
    if (!networkData?.impactData?.length) return;

    const linesGroup = this.svg.append('g').attr('class', 'connection-lines');

    // Helper: compute final screen coordinates for a location
    const getScreenPosition = (location: any): [number, number] | null => {
      let coords: [number, number] | null = null;

      // 1️⃣ Direct coordinates
      if (location.coords && location.coords.length === 2) {
        coords = [location.coords[1], location.coords[0]]; // [lon, lat]
      }

      // // 2️⃣ Partner coordinates (from partner list)
      // if (!coords && location.partner_id?.length) {
      //   const partner = networkData.partners.find(p => this.normalizeId(p.id) === this.normalizeId(location.partner_id[0]));
      //   if (partner?.coordinates) coords = [partner.coordinates[1], partner.coordinates[0]];
      // }

      // 2️⃣ Partner coordinates (from partner list)
if (!coords && location.partner_id?.length) {
  const partner = networkData.partners.find(p => {
    const sameId = this.normalizeId(p.id) === this.normalizeId(location.partner_id[0]);
    const sameCountry = location.countryName
      ? (p.countryName && p.countryName.toLowerCase() === location.countryName.toLowerCase())
      : true; // ignore if not provided

    const sameState = location.stateName
      ? (p.partnerState && p.partnerState.toLowerCase() === location.stateName.toLowerCase())
      : true; // ignore if not provided

    return sameId && sameCountry && sameState;
  });

  if (partner?.coordinates) {
    coords = [partner.coordinates[1], partner.coordinates[0]];
  }
}


      // 3️⃣ State centroid
      if (!coords && location.stateName) {
        const state = states.find((s: any) => s.properties.st_nm.toLowerCase() === location.stateName.toLowerCase());
        if (state) coords = d3.geoCentroid(state);
      }

      // 4️⃣ Country centroid
      if (!coords && location.countryName) {
        const country = countries.find((c: any) => c.properties.name.toLowerCase() === location.countryName.toLowerCase());
        if (country) coords = d3.geoCentroid(country);
      }

      if (!coords) return null;

      // Project coordinates
      let projected = this.projection(coords);
      if (!projected) return null;

      // Apply India zoom if inside India
      if (indiaData && d3.geoContains(indiaData, coords)) {
        const indiaTransform = this.countryTransforms['IND'] || { scale: 1, translate: [0, 0] };
        const scale = indiaTransform.scale || 1;
        const translate = indiaTransform.translate || [0, 0];
        const centroid = this.path.centroid(indiaData);
        projected = [
          (projected[0] - centroid[0]) * scale + centroid[0] + translate[0],
          (projected[1] - centroid[1]) * scale + centroid[1] + translate[1]
        ];
      }

      // Apply custom transforms for other countries (left/right/up/down, scale)
      if (location.countryName) {
        const cTransform = this.countryTransforms[location.countryName.toUpperCase()];
        if (cTransform) {
          const scale = cTransform.scale || 1;
          const translate = cTransform.translate || [0, 0];
          const country = countries.find((c: any) => c.properties.name.toLowerCase() === location.countryName.toLowerCase());
          if (country) {
            const centroid = this.path.centroid(country);
            projected = [
              (projected[0] - centroid[0]) * scale + centroid[0] + translate[0],
              (projected[1] - centroid[1]) * scale + centroid[1] + translate[1]
            ];
          }
        }
      }

      // Singapore cluster adjustment
      const name = (location.countryName || '').toLowerCase();
      const singaporeCluster = ['singapore', 'malaysia', 'indonesia', 'thailand'];
      if (singaporeCluster.includes(name)) {
        projected = [projected[0] + 250, projected[1] + 250];
      }

      if (name === 'united states of america (usa)') {
        projected = [projected[0] - 50, projected[1] - 80];
      }

      if (name === 'united kingdom (uk)') {
        projected = [projected[0] - 100, projected[1] - 20];
      }

      return projected as [number, number];
    };

    networkData.impactData.forEach(item => {
      const sourcePos = getScreenPosition(item.source);
      const targetPos = getScreenPosition(item.target);

      if (!sourcePos || !targetPos) return;

      // Curved line using control point
      const midX = (sourcePos[0] + targetPos[0]) / 2;
      const midY = (sourcePos[1] + targetPos[1]) / 2 - 50; // curvature
      const lineGenerator = d3.line().curve(d3.curveBundle.beta(1.5));
      const pathData = lineGenerator([sourcePos, [midX, midY], targetPos]);

      if (!pathData) return;

      const path = linesGroup.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', item.color || '#000')
        .attr('stroke-width', item.lineType === 'dashed' ? 1.5 : 2)
        .attr('opacity', 0.4)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-dasharray', (() => {
          switch (item.lineType) {
            case 'dotted': return '2,6';
            case 'dashed': return '8,6';
            case 'multi-dash': return '20, 5, 10, 5';
            case 'double-dash': return '15,3,3,3';
            default: return '6,6';
          }
        })());

      // Animate dash offset
      d3.timer(elapsed => path.attr('stroke-dashoffset', -elapsed / 40));
    });
  }

  resetZoom(): void {
    this.indiaGroup.transition().duration(1000).attr('transform', 'translate(0,0) scale(1)');
    this.isIndiaZoomed = false;
  }


    @HostListener('window:resize')
  onResize() {
    this.checkIfMobile();
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  zoomIn() {
    if (this.scale < this.maxScale) {
      this.scale += this.zoomStep;
      this.applyZoom();
    }
  }

  zoomOut() {
    if (this.scale > this.minScale) {
      this.scale -= this.zoomStep;
      this.applyZoom();
    }
  }

applyZoom() {
  const mapEl = this.mapContainer.nativeElement as HTMLElement;
  const viewportEl = mapEl.parentElement as HTMLElement; // Assuming map-container is directly inside map-viewport

  if (!mapEl || !viewportEl) return;

  const oldScale = parseFloat(mapEl.style.transform.replace('scale(', '').replace(')', '')) || 1;
  const newScale = this.scale;
  const scaleRatio = newScale / oldScale;

  // 1. Get the current center point of the viewport relative to the map content
  const centerX = viewportEl.scrollLeft + viewportEl.clientWidth / 2;
  const centerY = viewportEl.scrollTop + viewportEl.clientHeight / 2;

  // 2. Apply the new scale transformation to the map container
  mapEl.style.transform = `scale(${newScale})`;
  mapEl.style.transformOrigin = '0 0'; // Crucial: ensure scaling is applied from top-left (0 0)
                                      // so that the calculation below works predictably.
  mapEl.style.transition = 'transform 0.3s ease';

  // 3. Calculate the new scroll position to keep the center fixed
  // The map dimensions have effectively grown by scaleRatio.
  // The new scroll position should be the center point scaled, minus half the viewport size.
  const newScrollLeft = centerX * scaleRatio - viewportEl.clientWidth / 2;
  const newScrollTop = centerY * scaleRatio - viewportEl.clientHeight / 2;

  // 4. Apply the new scroll position (with smooth transition for a nicer effect)
  viewportEl.scrollTo({
    left: newScrollLeft,
    top: newScrollTop,
    behavior: 'smooth'
  });
}

}
