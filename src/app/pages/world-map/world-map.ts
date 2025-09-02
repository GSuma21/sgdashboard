import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.html',
  styleUrls: ['./world-map.css']
})
export class WorldMapComponent implements OnInit, OnDestroy {

  @ViewChild('map', { static: true }) private mapContainer!: ElementRef;

  private svg: any;
  private g: any;             // group for world countries
  private indiaGroup: any;    // group for India only
  private projection: any;
  private path: any;

  private width = 960;
  private height = 600;

  private europeanCountries = [
    'ALB','AND','AUT','BLR','BEL','BIH','BGR','HRV','CYP','CZE','DNK','EST','FIN','FRA','DEU',
    'GRC','HUN','ISL','IRL','ITA','LVA','LIE','LTU','LUX','MLT','MDA','MCO','MNE','NLD','MKD',
    'NOR','POL','PRT','ROU','SMR','SRB','SVK','SVN','ESP','SWE','CHE','UKR','VAT'
  ];

  private africanCountries = [
    'DZA','AGO','BEN','BWA','BFA','BDI','CPV','CMR','CAF','TCD','COM','COD','COG','CIV','DJI',
    'EGY','GNQ','ERI','SWZ','ETH','GAB','GMB','GHA','GIN','GNB','KEN','LSO','LBR','LBY','MDG',
    'MWI','MLI','MRT','MUS','MAR','MOZ','NAM','NER','NGA','RWA','STP','SEN','SYC','SLE','SOM',
    'ZAF','SSD','SDN','TZA','TGO','TUN','UGA','ZMB','ZWE'
  ];

  private otherCountries = ['USA','SGP','GBR','BRA','AUS'];

  constructor() {}

  ngOnInit(): void {
    this.createMap();
  }

  ngOnDestroy(): void {}

  private createMap(): void {
    const element = this.mapContainer.nativeElement;

    this.svg = d3.select(element)
      .attr('width', this.width)
      .attr('height', this.height);

    // groups
    this.g = this.svg.append('g').attr('class', 'world');
    this.indiaGroup = this.svg.append('g').attr('class', 'india');

    // base projection
    this.projection = d3.geoMercator()
      .scale(150)
      .translate([this.width / 2, this.height / 2]);

    this.path = d3.geoPath().projection(this.projection);

    d3.json('/assets/countries.geojson').then((data: any) => {
      const countriesToShow = ['IND', ...this.europeanCountries, ...this.africanCountries, ...this.otherCountries];
      const filteredFeatures = data.features.filter((feature: any) =>
        countriesToShow.includes(feature.properties['ISO3166-1-Alpha-3']) || feature.properties.name === 'France'
      );

      // draw other countries
      this.g.selectAll('path')
        .data(filteredFeatures.filter((d: any) => d.properties['ISO3166-1-Alpha-3'] !== 'IND'))
        .enter().append('path')
        .attr('d', this.path)
        .attr('fill', (d: any) => {
          const isoCode = d.properties['ISO3166-1-Alpha-3'];
          const countryName = d.properties.name;
          switch (isoCode) {
            case 'USA': return 'yellow';
            case 'SGP': return 'blue';
            case 'BRA': return 'maroon';
            case 'AUS': return 'black';
            case 'GBR':return 'brown'
            default: return 'grey';
          }
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);

      // draw India separately
      this.indiaGroup.selectAll('path')
        .data(filteredFeatures.filter((d: any) => d.properties['ISO3166-1-Alpha-3'] === 'IND'))
        .enter().append('path')
        .attr('d', this.path)
        .attr('fill', 'blue')
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .each((d: any, i: number, nodes: any) => {
          this.zoomIndia(d3.select(nodes[i]), d);
        });
    });
  }

  /** Scale only India around its centroid */
  zoomIndia(india: any, indiaData: any): void {
    const centroid = this.path.centroid(indiaData);

    india.transition().duration(1200)
      .attr('transform', `translate(${centroid[0]},${centroid[1]}) scale(4) translate(${-centroid[0]},${-centroid[1]})`);
  }

  resetZoom(): void {
    this.indiaGroup.selectAll('path')
      .transition().duration(1000)
      .attr('transform', 'translate(0,0) scale(1)');
  }
}
