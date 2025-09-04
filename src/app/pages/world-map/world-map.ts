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
  private height = 600;

   private countryMap: Record<string, string> = {
    'IND': '356', // India

// US
  'USA': '840', // United States

  // UK
  'GBR': '826', // United Kingdom

  // Europe
  'ALB': '008',  // Albania
  'AND': '020',  // Andorra
  'ARM': '051',  // Armenia
  'AUT': '040',  // Austria
  'AZE': '031',  // Azerbaijan
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
  'GEO': '268',  // Georgia
  'DEU': '276',  // Germany
  'GRC': '300',  // Greece
  'HUN': '348',  // Hungary
  'ISL': '352',  // Iceland
  'IRL': '372',  // Ireland
  'ITA': '380',  // Italy
  'KAZ': '398',  // Kazakhstan
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
  'TUR': '792',  // Turkey
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


   // Singapore
  'SGP': '702',  // Singapore


   'AUS': '036',

   'THA': '764'  // Thailand
  };

  // private countryMap: Record<string, string> = {
  //   'IND': '356',
  //   'USA': '840', 'GBR': '826', 'CAN': '124',
  //   'FRA': '250', 'DEU': '276', 'ITA': '380', 'ESP': '724', 'NLD': '528', 'BEL': '056', 'CHE': '756', 'SWE': '752', 'NOR': '578', 'DNK': '208',
  //   'ZAF': '710', 'EGY': '818', 'NGA': '566', 'KEN': '404', 'DZA': '012', 'MAR': '504', 'TUN': '788',
  //   'SGP': '702'
  // };

  // Only for moving countries: left/right/up/down and scaling
  private countryTransforms: Record<string, { scale?: number; translate?: [number, number] }> = {
    'IND': { scale: 6, translate: [50, 10] },
    'SGP': {scale: 0, translate: [200, 30] },
    'THA': {scale: 3, translate: [250, 50] },
    'USA': { scale: 0,translate: [-50, -80] },
    'GBR': { scale: 0,translate: [0, 20] },
    'CAN': {scale: 0, translate: [0, -20] },
    'AUS': {scale: 0, translate: [300, 20]},


// Add African countries with left shift (-200px)
'DZA': { translate: [-200, 0] }, 'AGO': { translate: [-200, 0] }, 'BEN': { translate: [-200, 0] },
'BWA': { translate: [-200, 0] }, 'BFA': { translate: [-200, 0] }, 'BDI': { translate: [-200, 0] },
'CMR': { translate: [-200, 0] }, 'CPV': { translate: [-200, 0] }, 'CAF': { translate: [-200, 0] },
'TCD': { translate: [-200, 0] }, 'COM': { translate: [-200, 0] }, 'COG': { translate: [-200, 0] },
'COD': { translate: [-200, 0] }, 'CIV': { translate: [-200, 0] }, 'DJI': { translate: [-200, 0] },
'EGY': { translate: [-200, 0] }, 'GNQ': { translate: [-200, 0] }, 'ERI': { translate: [-200, 0] },
'SWZ': { translate: [-200, 0] }, 'ETH': { translate: [-200, 0] }, 'GAB': { translate: [-200, 0] },
'GMB': { translate: [-200, 0] }, 'GHA': { translate: [-200, 0] }, 'GIN': { translate: [-200, 0] },
'GNB': { translate: [-200, 0] }, 'KEN': { translate: [-200, 0] }, 'LSO': { translate: [-200, 0] },
'LBR': { translate: [-200, 0] }, 'LBY': { translate: [-200, 0] }, 'MDG': { translate: [-200, 0] },
'MWI': { translate: [-200, 0] }, 'MLI': { translate: [-200, 0] }, 'MRT': { translate: [-200, 0] },
'MUS': { translate: [-200, 0] }, 'MYT': { translate: [-200, 0] }, 'MAR': { translate: [-200, 0] },
'MOZ': { translate: [-200, 0] }, 'NAM': { translate: [-200, 0] }, 'NER': { translate: [-200, 0] },
'NGA': { translate: [-200, 0] }, 'REU': { translate: [-200, 0] }, 'RWA': { translate: [-200, 0] },
'STP': { translate: [-200, 0] }, 'SEN': { translate: [-200, 0] }, 'SYC': { translate: [-200, 0] },
'SLE': { translate: [-200, 0] }, 'SOM': { translate: [-200, 0] }, 'ZAF': { translate: [-200, 0] },
'SSD': { translate: [-200, 0] }, 'SDN': { translate: [-200, 0] }, 'TZA': { translate: [-200, 0] },
'TGO': { translate: [-200, 0] }, 'TUN': { translate: [-200, 0] }, 'UGA': { translate: [-200, 0] },
'ESH': { translate: [-200, 0] }, 'ZMB': { translate: [-200, 0] }, 'ZWE': { translate: [-200, 0] },



// Europe countries with left shift (-150px)
'ALB': { translate: [-150, 0] }, 'AND': { translate: [-150, 0] }, 'ARM': { translate: [-150, 0] },
'AUT': { translate: [-150, 0] }, 'AZE': { translate: [-150, 0] }, 'BLR': { translate: [-150, 0] },
'BEL': { translate: [-150, 0] }, 'BIH': { translate: [-150, 0] }, 'BGR': { translate: [-150, 0] },
'HRV': { translate: [-150, 0] }, 'CYP': { translate: [-150, 0] }, 'CZE': { translate: [-150, 0] },
'DNK': { translate: [-150, 0] }, 'EST': { translate: [-150, 0] }, 'FIN': { translate: [-150, 0] },
'FRA': { translate: [-150, 0] }, 'GEO': { translate: [-150, 0] }, 'DEU': { translate: [-150, 0] },
'GRC': { translate: [-150, 0] }, 'HUN': { translate: [-150, 0] }, 'ISL': { translate: [-150, 0] },
'IRL': { translate: [-150, 0] }, 'ITA': { translate: [-150, 0] }, 'KAZ': { translate: [-150, 0] },
'LVA': { translate: [-150, 0] }, 'LIE': { translate: [-150, 0] }, 'LTU': { translate: [-150, 0] },
'LUX': { translate: [-150, 0] }, 'MLT': { translate: [-150, 0] }, 'MDA': { translate: [-150, 0] },
'MCO': { translate: [-150, 0] }, 'MNE': { translate: [-150, 0] }, 'NLD': { translate: [-150, 0] },
'MKD': { translate: [-150, 0] }, 'NOR': { translate: [-150, 0] }, 'POL': { translate: [-150, 0] },
'PRT': { translate: [-150, 0] }, 'ROU': { translate: [-150, 0] }, 'SMR': { translate: [-150, 0] },
'SRB': { translate: [-150, 0] }, 'SVK': { translate: [-150, 0] }, 'SVN': { translate: [-150, 0] },
'ESP': { translate: [-150, 0] }, 'SWE': { translate: [-150, 0] }, 'CHE': { translate: [-150, 0] },
'TUR': { translate: [-150, 0] }, 'UKR': { translate: [-150, 0] }, 'VAT': { translate: [-150, 0] }


  };

  ngOnInit(): void {
    this.createMap();
  }

  private createMap(): void {
    const element = this.mapContainer.nativeElement;

    this.svg = d3.select(element)
      .append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

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
      filteredCountries.filter(f => String(f.id) !== this.countryMap['IND']).forEach(f => {
        const code = Object.keys(this.countryMap).find(k => this.countryMap[k] === String(f.id));
        if (!code) return;

        const group = this.g.append('g').attr('class', `country-${code.toLowerCase()}`);
        group.append('path')
          .datum(f)
          .attr('d', this.path)
          .attr('fill', '#abb6c2')
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
          .attr('fill', '#fdd1a5')
          .attr('stroke', '#3a3a3aff')
          .attr('stroke-width', 0.2);

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
  private normalizeId(id: string) { return id.toLowerCase().replace(/[\s_]/g, ''); }

  private drawPartners(networkData: NetworkData, indiaData: any): void {
  if (!networkData?.partners?.length) return;

  if (!this.partnersGroup) {
    this.partnersGroup = this.svg.append('g').attr('class', 'partners');
  }

  const indiaScale = this.countryTransforms['IND']?.scale ? this.countryTransforms['IND']?.scale :4;
  const iconSize = 18;

  networkData.partners.forEach((partner: Partner) => {
    if (!partner.coordinates || partner.coordinates.length !== 2) return;

    const categoryKey = (partner.category || '').trim().toLowerCase();
    const iconConfig = this.markerConfigList[categoryKey];
    const iconPath = iconConfig ? iconConfig.icon : 'circle.svg';

    const lon = partner.coordinates[1];
    const lat = partner.coordinates[0];
    let projected = this.projection([lon, lat]);
    if (!projected) return;

    const isInsideIndia = indiaData && d3.geoContains(indiaData, [lon, lat]);
    const targetGroup = isInsideIndia ? this.indiaGroup : this.partnersGroup;

    // --- Only shift Singapore / cluster countries ---
    if (!isInsideIndia && partner.countryName?.toLowerCase() === 'singapore') {
      projected = [projected[0] + 200, projected[1] + 30];
    }

    const size = isInsideIndia ? iconSize / indiaScale : iconSize;
    const offset = size / 2;

    // Append partner icon
    const icon = targetGroup.append('image')
      .attr('class', `partner-icon partner-${categoryKey}`)
      .attr('xlink:href', iconPath)
      .attr('x', projected[0] - offset)
      .attr('y', projected[1] - offset)
      .attr('width', size)
      .attr('height', size);

    // Tooltip for all partners
    icon.on('click', (event: any) => {
      event.stopPropagation();

      const partnerHtml = `
<div style="position: relative; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px 0; width: 250px; border: 1px solid #000; font-family: Arial, sans-serif; max-height: 300px; overflow-y: auto;">
  <div style="position: absolute; left: -8px; top: 20px; width: 0; height: 0; border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-right: 8px solid white; filter: drop-shadow(-1px 0px 1px rgba(0,0,0,0.05));"></div>
  <a href="${partner.website}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
    <div style="display: grid; grid-template-columns: 36px 1fr; align-items: center; padding: 8px 12px;">
      <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <img src="${partner.src}" alt="${partner.name}" style="width: 24px; height: 24px; object-fit: contain;">
      </div>
      <div style="display: flex; flex-direction: column; padding-left: 5px;">
        <div style="font-weight: 600; font-size: 14px; color: #000;">${partner.name}</div>
        <div style="font-size: 12px; color: #777;">${partner.category} partner</div>
        <div style="font-size: 12px; color: #555;">${partner.partnerState || partner.countryName || ''}</div>
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

  // Hide tooltip on body click
  d3.select('body').on('click', () => {
    this.tooltip.transition().duration(200).style('opacity', 0);
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

    // 2️⃣ Partner coordinates (from partner list)
    if (!coords && location.partner_id?.length) {
      const partner = networkData.partners.find(p => this.normalizeId(p.id) === this.normalizeId(location.partner_id[0]));
      if (partner?.coordinates) coords = [partner.coordinates[1], partner.coordinates[0]];
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
      projected = [projected[0] + 200, projected[1] + 30];
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
    const lineGenerator = d3.line().curve(d3.curveBundle.beta(item.curvature || 0.5));
    const pathData = lineGenerator([sourcePos, [midX, midY], targetPos]);

    if (!pathData) return;

    const path = linesGroup.append('path')
      .attr('d', pathData)
      .attr('fill', 'none')
      .attr('stroke', item.color || '#000')
      .attr('stroke-width', item.lineType === 'dashed' ? 1.5 : 2)
      .attr('opacity', 0.9)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-dasharray', (() => {
        switch (item.lineType) {
          case 'dotted': return '2,6';
          case 'dashed': return '8,6';
          case 'multi-dash': return '12,4,4,4';
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
}
