import { ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { Router } from '@angular/router';
import { WorldMapComponent } from './world-map';

describe('WorldMapComponent', () => {
  let component: WorldMapComponent;
  let router: jasmine.SpyObj<Router>;

  const worldTopology = {
    type: 'Topology',
    objects: {
      countries: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Polygon', id: '356', properties: { name: 'india' }, arcs: [[0]] },
          { type: 'Polygon', id: '702', properties: { name: 'singapore' }, arcs: [[1]] },
          { type: 'Polygon', id: '840', properties: { name: 'usa' }, arcs: [[2]] },
          { type: 'Polygon', id: '826', properties: { name: 'united kingdom (uk)' }, arcs: [[3]] },
          { type: 'Polygon', id: '764', properties: { name: 'thailand' }, arcs: [[4]] },
        ],
      },
    },
    arcs: [
      [[68, 8], [29, 0], [0, 29], [-29, 0], [0, -29]],
      [[103, 1], [2, 0], [0, 2], [-2, 0], [0, -2]],
      [[-125, 25], [59, 0], [0, 24], [-59, 0], [0, -24]],
      [[-8, 50], [10, 0], [0, 9], [-10, 0], [0, -9]],
      [[97, 5], [9, 0], [0, 15], [-9, 0], [0, -15]],
    ],
  };

  const indiaTopology = {
    type: 'Topology',
    objects: {
      states: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Polygon',
            properties: { st_nm: 'Karnataka' },
            arcs: [[0]],
          },
        ],
      },
    },
    arcs: [
      [[74, 11], [4, 0], [0, 4], [-4, 0], [0, -4]],
    ],
  };

  const networkData = {
    partners: [
      {
        id: 'P_1.',
        coordinates: [20, 78],
        partnerState: 'Karnataka',
        countryName: 'India',
        category: 'momentum',
        website: 'https://example.org',
        src: 'a.png',
        name: 'Partner A',
      },
      {
        id: 'P2',
        coordinates: [1.3, 103.8],
        countryName: 'Singapore',
        category: 'strategic',
        src: 'b.png',
        name: 'Partner B',
      },
      {
        id: 'P3',
        coordinates: [37, -95],
        countryName: 'United States of America (USA)',
        category: 'collaborators',
        src: 'c.png',
        name: 'Partner C',
      },
      {
        id: 'P4',
        coordinates: [55, -3],
        countryName: 'United Kingdom (UK)',
        category: 'unknown',
        src: 'd.png',
        name: 'Partner D',
      },
      { id: 'BAD', coordinates: [1] as any, countryName: 'India' },
    ],
    impactData: [
      {
        source: { partner_id: [], icon: '', coords: [1.3, 103.8], countryName: 'singapore' },
        target: { partner_id: [], icon: '', coords: [37, -95], countryName: 'united states of america (usa)' },
        lineType: 'dotted',
        curvature: 0.5,
        color: '#111',
      },
      {
        source: { partner_id: [' p_1. '], icon: '', countryName: 'india', stateName: 'karnataka' },
        target: { partner_id: [], icon: '', coords: [20, 78] },
        lineType: 'dashed',
        curvature: 0.5,
        color: '#222',
      },
      {
        source: { partner_id: [], icon: '', stateName: 'Karnataka' },
        target: { partner_id: [], icon: '', countryName: 'usa' },
        lineType: 'multi-dash',
        curvature: 0.5,
        color: '#333',
      },
      {
        source: { partner_id: [], icon: '', countryName: 'usa' },
        target: { partner_id: [], icon: '', countryName: 'usa' },
        lineType: 'double-dash',
        curvature: 0.5,
        color: '#444',
      },
      {
        source: { partner_id: [], icon: '', coords: [37, -95], countryName: 'united states of america (usa)' },
        target: { partner_id: [], icon: '', coords: [55, -3], countryName: 'united kingdom (uk)' },
        lineType: 'custom',
        curvature: 0.5,
        color: '',
      },
      {
        source: { partner_id: [], icon: '' },
        target: { partner_id: [], icon: '', coords: [1, 1] },
        lineType: 'dotted',
        curvature: 0.5,
        color: '#555',
      },
    ],
  };

  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const jsonResponse = (data: any): Promise<Response> =>
    Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

  const setupDom = (wrapperWidth = 900) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'map-wrapper';
    const viewport = document.createElement('div');
    viewport.className = 'map-viewport';
    const map = document.createElement('div');
    map.className = 'map-container';

    wrapper.appendChild(viewport);
    viewport.appendChild(map);
    document.body.appendChild(wrapper);

    Object.defineProperty(wrapper, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: wrapperWidth, height: 500 }),
    });
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 400 });
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 200 });
    viewport.scrollLeft = 100;
    viewport.scrollTop = 50;
    (viewport as any).scrollTo = jasmine.createSpy('scrollTo');

    (component as any).mapContainer = new ElementRef(map);
    return { wrapper, viewport, map };
  };

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/world-map' });
    component = new WorldMapComponent(router);
  });

  afterEach(() => {
    document.querySelectorAll('.map-wrapper').forEach((node) => node.remove());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call createMap and checkIfMobile on ngOnInit', () => {
    const mapSpy = spyOn<any>(component, 'createMap');
    const mobileSpy = spyOn(component, 'checkIfMobile');
    component.ngOnInit();
    expect(mapSpy).toHaveBeenCalled();
    expect(mobileSpy).toHaveBeenCalled();
  });

  it('should create map, draw countries/states, lines and partners', async () => {
    const { map } = setupDom();
    spyOn(window, 'fetch').and.callFake((input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('countries-110m.json')) return jsonResponse(worldTopology) as any;
      if (url.endsWith('/india.json')) return jsonResponse(indiaTopology) as any;
      if (url.endsWith('/network-data.json')) return jsonResponse(networkData) as any;
      return Promise.reject(`unexpected:${url}`) as any;
    });

    (component as any).createMap();
    await flush();

    expect(map.querySelectorAll('svg').length).toBe(1);
    expect(document.querySelectorAll('.state').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.partner-icon').length).toBeGreaterThan(0);
    expect((component as any).isIndiaZoomed).toBeTrue();
  });

  it('should handle createMap data load error', async () => {
    setupDom();
    const errorSpy = spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject('map-failed') as any);

    (component as any).createMap();
    await flush();

    expect(errorSpy).toHaveBeenCalledWith('Data load error:', 'map-failed');
  });

  it('should support createMap when router url is not /world-map and no network data', async () => {
    const localRouter = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/other' });
    const localComponent = new WorldMapComponent(localRouter);
    const wrapper = document.createElement('div');
    const viewport = document.createElement('div');
    const map = document.createElement('div');
    wrapper.appendChild(viewport);
    viewport.appendChild(map);
    document.body.appendChild(wrapper);
    (localComponent as any).mapContainer = new ElementRef(map);
    (localComponent as any).countryTransforms.USA = {};
    (localComponent as any).countryTransforms.IND = {};
    spyOn(window, 'fetch').and.callFake((input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('countries-110m.json')) return jsonResponse(worldTopology) as any;
      if (url.endsWith('/india.json')) return jsonResponse(indiaTopology) as any;
      if (url.endsWith('/network-data.json')) return jsonResponse(null) as any;
      return Promise.reject(`unexpected:${url}`) as any;
    });

    (localComponent as any).createMap();
    await flush();

    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('should normalize ids', () => {
    const normalized = (component as any).normalizeId(' Ab_c.12-@# ');
    expect(normalized).toBe('abc12');
  });

  it('should draw partners and handle icon/map click behaviors', async () => {
    const { wrapper, map } = setupDom(460);
    (component as any).svg = d3.select(map).append('svg');
    (component as any).indiaGroup = (component as any).svg.append('g');
    (component as any).projection = d3.geoMercator().scale(150).translate([400, 250]);
    (component as any).path = d3.geoPath().projection((component as any).projection);
    (component as any).tooltip = d3.select(wrapper).append('div').attr('class', 'tooltip');

    const indiaFeature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[68, 8], [97, 8], [97, 37], [68, 37], [68, 8]]],
      },
      properties: { name: 'india' },
      id: '356',
    };

    (component as any).drawPartners(networkData, indiaFeature);
    const icons = Array.from(wrapper.querySelectorAll('.partner-icon'));
    expect(icons.length).toBeGreaterThan(0);

    component.showDetails = true;
    const tooltipEl = wrapper.querySelector('.tooltip') as HTMLElement;
    Object.defineProperty(tooltipEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 300, height: 600, left: 0, top: 0, right: 300, bottom: 600 }),
    });
    const momentumIcon = wrapper.querySelector('.partner-momentum') as HTMLElement;
    momentumIcon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 5 }));
    await flush();
    expect((component as any).tooltip.style('opacity')).toBeTruthy();

    component.showDetails = false;
    icons[0].dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 110, clientY: 110 }));
    map.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(router.navigate).toHaveBeenCalledWith(['/network-health']);

    component.showDetails = true;
    const outside = document.createElement('div');
    map.appendChild(outside);
    const transitionSpy = spyOn((component as any).tooltip, 'transition').and.callThrough();
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    expect(transitionSpy).toHaveBeenCalled();
  });

  it('should cover drawPartners early returns and secondary responsive branch', async () => {
    const { wrapper, map } = setupDom(700);
    (component as any).svg = d3.select(map).append('svg');
    (component as any).indiaGroup = (component as any).svg.append('g');
    (component as any).projection = d3.geoMercator().scale(150).translate([400, 250]);
    (component as any).path = d3.geoPath().projection((component as any).projection);
    (component as any).tooltip = d3.select(wrapper).append('div').attr('class', 'tooltip');

    (component as any).drawPartners(undefined, undefined);
    (component as any).drawPartners({ partners: [] }, undefined);

    const noProjectionData = { partners: [{ id: 'x', coordinates: [10, 20], category: 'strategic' }] };
    (component as any).projection = () => null;
    (component as any).drawPartners(noProjectionData, undefined);
    expect(wrapper.querySelectorAll('.partner-icon').length).toBe(0);

    (component as any).projection = d3.geoMercator().scale(150).translate([400, 250]);
    (component as any).drawPartners(
      { partners: [{ id: 'y', coordinates: [1.3, 103.8], category: 'collaborators', src: 'x', name: 'n' }] },
      undefined,
    );
    const icon = wrapper.querySelector('.partner-icon') as HTMLElement;
    expect(icon).toBeTruthy();
    component.showDetails = true;
    icon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 150, clientY: 150 }));
    await flush();
    expect((component as any).tooltip.style('opacity')).toBeTruthy();
  });

  it('should cover additional drawPartners fallback branches', async () => {
    const { map } = setupDom();
    (component as any).svg = d3.select(map).append('svg');
    (component as any).indiaGroup = (component as any).svg.append('g');
    (component as any).projection = d3.geoMercator().scale(150).translate([400, 250]);
    (component as any).path = d3.geoPath().projection((component as any).projection);
    (component as any).tooltip = d3.select(document.body).append('div').attr('class', 'tooltip');
    (component as any).countryTransforms.IND = {};
    component.showDetails = false;

    (component as any).drawPartners(
      {
        partners: [
          { id: 's1', coordinates: [1.3, 103.8], countryName: 'Singapore', src: '1' },
          { id: 'u1', coordinates: [37, -95], countryName: 'United States of America (USA)', src: '2' },
          { id: 'u2', coordinates: [55, -3], countryName: 'United Kingdom (UK)', src: '3' },
          { id: 'n1', coordinates: [10, 10], countryName: 'India', category: undefined, name: undefined, src: '4' },
        ],
      },
      undefined,
    );

    expect((map as HTMLElement).style.cursor).toBe('pointer');
    const icons = map.querySelectorAll('.partner-icon');
    expect(icons.length).toBe(4);
  });

  it('should use body fallback wrapper and tooltip empty-field fallbacks', async () => {
    const map = document.createElement('div');
    (component as any).mapContainer = new ElementRef(map);
    (component as any).svg = d3.select(map).append('svg');
    (component as any).indiaGroup = (component as any).svg.append('g');
    (component as any).projection = d3.geoMercator().scale(150).translate([400, 250]);
    (component as any).path = d3.geoPath().projection((component as any).projection);
    (component as any).tooltip = d3.select(document.body).append('div').attr('class', 'tooltip');
    component.showDetails = true;

    (component as any).drawPartners(
      {
        partners: [
          { id: 'e1', coordinates: [10, 10], category: undefined, countryName: undefined, partnerState: undefined, name: undefined, src: 'x' },
        ],
      },
      undefined,
    );

    const icon = map.querySelector('.partner-icon') as HTMLElement;
    const tooltipEl = document.body.querySelector('.tooltip') as HTMLElement;
    Object.defineProperty(tooltipEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 300, height: 50, left: 0, top: 0, right: 300, bottom: 50 }),
    });
    icon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1000, clientY: 100 }));
    await flush();
    expect((component as any).tooltip.html()).toContain('partner');
  });

  it('should cover website tooltip empty fallbacks and indiaTransform fallback in lines', async () => {
    const { map } = setupDom();
    (component as any).mapContainer = new ElementRef(map);
    (component as any).svg = d3.select(map).append('svg');
    (component as any).indiaGroup = (component as any).svg.append('g');
    (component as any).projection = d3.geoMercator().scale(150).translate([400, 250]);
    (component as any).path = d3.geoPath().projection((component as any).projection);
    (component as any).tooltip = d3.select(document.body).append('div').attr('class', 'tooltip');
    component.showDetails = true;

    (component as any).drawPartners(
      {
        partners: [
          { id: 'w1', coordinates: [10, 10], category: 'collaborators', website: 'https://x', countryName: undefined, partnerState: undefined, name: undefined, src: 'x' },
        ],
      },
      undefined,
    );
    const icon = map.querySelector('.partner-icon') as HTMLElement;
    icon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 30, clientY: 30 }));
    await flush();
    expect((component as any).tooltip.html()).toContain('<a href=');

    (component as any).countryTransforms.IND = undefined;
    (component as any).drawConnectionLines(
      {
        partners: [],
        impactData: [
          {
            source: { partner_id: [], icon: '', coords: [20, 78] },
            target: { partner_id: [], icon: '', coords: [21, 79] },
            lineType: 'dotted',
            curvature: 0,
            color: '#333',
          },
        ],
      },
      [],
      [],
      {
        type: 'Feature',
        properties: { name: 'india' },
        geometry: { type: 'Polygon', coordinates: [[[68, 8], [97, 8], [97, 37], [68, 37], [68, 8]]] },
      },
    );
    expect(map.querySelectorAll('.connection-lines path').length).toBeGreaterThan(0);
  });

  it('should draw connection lines and cover all line styles', () => {
    const { map } = setupDom();
    (component as any).svg = d3.select(map).append('svg');
    (component as any).projection = d3.geoMercator().scale(150).translate([400, 250]);
    (component as any).path = d3.geoPath().projection((component as any).projection);

    const countries = [
      { type: 'Feature', properties: { name: 'usa' }, geometry: { type: 'Polygon', coordinates: [[[-125, 25], [-66, 25], [-66, 49], [-125, 49], [-125, 25]]] } },
      { type: 'Feature', properties: { name: 'united kingdom (uk)' }, geometry: { type: 'Polygon', coordinates: [[[-8, 50], [2, 50], [2, 59], [-8, 59], [-8, 50]]] } },
      { type: 'Feature', properties: { name: 'singapore' }, geometry: { type: 'Polygon', coordinates: [[[103, 1], [105, 1], [105, 3], [103, 3], [103, 1]]] } },
    ];
    const states = [
      { type: 'Feature', properties: { st_nm: 'Karnataka' }, geometry: { type: 'Polygon', coordinates: [[[74, 11], [78, 11], [78, 15], [74, 15], [74, 11]]] } },
    ];
    const indiaFeature = {
      type: 'Feature',
      properties: { name: 'india' },
      geometry: { type: 'Polygon', coordinates: [[[68, 8], [97, 8], [97, 37], [68, 37], [68, 8]]] },
    };

    (component as any).drawConnectionLines(networkData, countries, states, indiaFeature);
    expect(map.querySelectorAll('.connection-lines path').length).toBeGreaterThan(0);

    (component as any).drawConnectionLines({ impactData: [], partners: [] }, countries, states, indiaFeature);
    expect(map.querySelectorAll('.connection-lines').length).toBe(1);
  });

  it('should cover drawConnectionLines fallback branches', () => {
    const { map } = setupDom();
    (component as any).svg = d3.select(map).append('svg');
    (component as any).projection = d3.geoMercator().scale(150).translate([400, 250]);
    (component as any).path = d3.geoPath().projection((component as any).projection);
    (component as any).countryTransforms.IND = {};
    (component as any).countryTransforms.USA = { scale: 2 };

    const countries = [
      { type: 'Feature', properties: { name: 'usa' }, geometry: { type: 'Polygon', coordinates: [[[-125, 25], [-66, 25], [-66, 49], [-125, 49], [-125, 25]]] } },
    ];
    const states = [
      { type: 'Feature', properties: { st_nm: 'Karnataka' }, geometry: { type: 'Polygon', coordinates: [[[74, 11], [78, 11], [78, 15], [74, 15], [74, 11]]] } },
    ];
    const indiaFeature = {
      type: 'Feature',
      properties: { name: 'india' },
      geometry: { type: 'Polygon', coordinates: [[[68, 8], [97, 8], [97, 37], [68, 37], [68, 8]]] },
    };

    (component as any).drawConnectionLines(
      {
        partners: [{ id: 'P. 1', coordinates: [20, 78] }],
        impactData: [
          {
            source: { partner_id: ['p1'], icon: '' },
            target: { partner_id: [], icon: '', countryName: 'usa' },
            lineType: 'dashed',
            curvature: 0,
            color: '#111',
          },
        ],
      },
      countries,
      states,
      indiaFeature,
    );

    (component as any).projection = () => null;
    (component as any).drawConnectionLines(
      {
        partners: [],
        impactData: [
          {
            source: { partner_id: [], icon: '', coords: [1, 1] },
            target: { partner_id: [], icon: '', coords: [2, 2] },
            lineType: 'dotted',
            curvature: 0,
            color: '#222',
          },
        ],
      },
      countries,
      states,
      indiaFeature,
    );

    expect(map.querySelectorAll('.connection-lines').length).toBeGreaterThan(0);
  });

  it('should reset zoom', () => {
    const transitionChain = {
      duration: jasmine.createSpy('duration').and.returnValue({
        attr: jasmine.createSpy('attr'),
      }),
    };
    (component as any).indiaGroup = {
      transition: jasmine.createSpy('transition').and.returnValue(transitionChain),
    };
    (component as any).isIndiaZoomed = true;

    component.resetZoom();

    expect((component as any).indiaGroup.transition).toHaveBeenCalled();
    expect((component as any).isIndiaZoomed).toBeFalse();
  });

  it('should check mobile on resize and direct call', () => {
    const widthSpy = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(768);
    component.checkIfMobile();
    expect(component.isMobile).toBeTrue();

    widthSpy.and.returnValue(1200);
    component.onResize();
    expect(component.isMobile).toBeFalse();
  });

  it('should zoom in/out and respect bounds', () => {
    const applySpy = spyOn(component, 'applyZoom');

    component.scale = 1;
    component.zoomIn();
    expect(component.scale).toBeCloseTo(1.2, 5);
    expect(applySpy).toHaveBeenCalledTimes(1);

    component.scale = component.maxScale;
    component.zoomIn();
    expect(applySpy).toHaveBeenCalledTimes(1);

    component.scale = 2;
    component.zoomOut();
    expect(component.scale).toBeCloseTo(1.8, 5);
    expect(applySpy).toHaveBeenCalledTimes(2);

    component.scale = component.minScale;
    component.zoomOut();
    expect(applySpy).toHaveBeenCalledTimes(2);
  });

  it('should apply zoom and preserve center, and return when viewport is missing', () => {
    const mapDetached = document.createElement('div');
    (component as any).mapContainer = new ElementRef(mapDetached);
    component.scale = 2;
    component.applyZoom();
    expect(mapDetached.style.transform).toBe('');

    const { map, viewport } = setupDom();
    map.style.transform = '';
    (component as any).mapContainer = new ElementRef(map);
    component.scale = 2;

    component.applyZoom();

    expect(map.style.transform).toBe('scale(2)');
    expect(map.style.transformOrigin).toContain('0');
    expect((viewport as any).scrollTo).toHaveBeenCalled();
  });

  it('should cover createMap wrapper fallback branches', async () => {
    const detached = document.createElement('div');
    (component as any).mapContainer = new ElementRef(detached);
    (router as any).url = '/other';

    spyOn(window, 'fetch').and.callFake((input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('countries-110m.json')) return jsonResponse({ ...worldTopology, objects: { countries: { type: 'GeometryCollection', geometries: [] } } }) as any;
      if (url.endsWith('/india.json')) return jsonResponse(indiaTopology) as any;
      if (url.endsWith('/network-data.json')) return jsonResponse(null) as any;
      return Promise.reject(`unexpected:${url}`) as any;
    });

    (component as any).createMap();
    await flush();
    expect(document.body.querySelector('.tooltip')).toBeTruthy();
  });

  it('should cover normalizeId fallback for empty input', () => {
    expect((component as any).normalizeId(undefined as any)).toBe('');
  });

  it('should hide tooltip on scroll only when tooltip exists', () => {
    component.onScroll();
    expect().nothing();

    const { wrapper } = setupDom();
    (component as any).tooltip = d3.select(wrapper).append('div').style('opacity', 1).style('pointer-events', 'auto');
    component.onScroll();
    expect((component as any).tooltip.style('opacity')).toBe('0');
    expect((component as any).tooltip.style('pointer-events')).toBe('none');
  });
});
