import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';

import { GlobalMap2 } from './global-map-2';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { INDIA, NETWORK_DATA } from '../../../constants/urlConstants';

describe('GlobalMap2', () => {
  let component: GlobalMap2;
  let fixture: ComponentFixture<GlobalMap2>;
  let loaderRunnerMock: { run: jasmine.Spy };
  let originalFetch: typeof fetch;

  const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const asJsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  const worldTopology = {
    type: 'Topology',
    objects: {
      countries: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Polygon', id: '356', properties: { name: 'India' }, arcs: [[0]] },
          { type: 'Polygon', id: '250', properties: { name: 'France' }, arcs: [[1]] },
          { type: 'Polygon', id: '840', properties: { name: 'United States' }, arcs: [[2]] }
        ]
      }
    },
    arcs: [
      [[68, 8], [29, 0], [0, 29], [-29, 0], [0, -29]],
      [[-5, 42], [13, 0], [0, 8], [-13, 0], [0, -8]],
      [[-125, 25], [59, 0], [0, 24], [-59, 0], [0, -24]]
    ]
  };

  const indiaTopology = {
    type: 'Topology',
    objects: {
      states: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Polygon',
            arcs: [[0]],
            properties: { st_nm: 'Maharashtra' }
          }
        ]
      }
    },
    arcs: [[[70, 15], [5, 0], [0, 5], [-5, 0], [0, -5]]]
  };

  const networkPayload = {
    partners: [
      {
        id: 'partner_1',
        name: 'Partner One',
        coordinates: [19.076, 72.877],
        category: 'strategic',
        website: 'https://p1.example.com',
        src: 'p1.svg'
      },
      {
        id: 'partner 2',
        name: 'Partner Two',
        coordinates: [13.0827, 80.2707],
        category: 'collaborators',
        website: 'https://p2.example.com',
        src: 'p2.svg'
      },
      {
        id: 'state_partner',
        name: 'State Partner',
        partnerState: 'Maharashtra',
        website: 'https://s.example.com',
        src: 's.svg'
      },
      {
        id: 'country_partner',
        name: 'Country Partner',
        countryName: 'France',
        website: 'https://c.example.com',
        src: 'c.svg'
      },
      {
        id: 'bad_partner',
        name: 'Bad Partner',
        coordinates: [1] as any,
        src: 'bad.svg'
      }
    ],
    impactData: [
      {
        source: { partner_id: ['partner_1'], icon: '', coords: [72.877, 19.076] as [number, number], countryName: 'India' },
        target: { partner_id: ['partner 2'], icon: '', coords: [80.2707, 13.0827] as [number, number] },
        lineType: 'dotted',
        curvature: 0,
        color: '#111111'
      },
      {
        source: { partner_id: [' partner_1 '], icon: '', stateName: 'Maharashtra', coords: [72.877, 19.076] as [number, number] },
        target: { partner_id: ['country_partner'], icon: '', countryName: 'France', coords: [2.2, 46.2] as [number, number] },
        lineType: 'arrowhead',
        curvature: 0.4,
        color: '#222222'
      },
      {
        source: { partner_id: [], icon: '', stateName: 'Maharashtra', coords: [73, 19] as [number, number] },
        target: { partner_id: [], icon: '', countryName: 'France', coords: [2, 46] as [number, number] },
        lineType: 'glow',
        curvature: 0.2,
        color: '#333333'
      },
      {
        source: { partner_id: [], icon: '', countryName: 'France', coords: [2.2, 46.2] as [number, number] },
        target: { partner_id: [], icon: '', countryName: 'United States', coords: [-95, 37] as [number, number] },
        lineType: 'multi-dash',
        curvature: 0.5,
        color: '#444444'
      },
      {
        source: { partner_id: [], icon: '', countryName: 'India', coords: [78, 22] as [number, number] },
        target: { partner_id: [], icon: '', countryName: 'France', coords: [2.2, 46.2] as [number, number] },
        lineType: 'solid',
        color: '#555555'
      },
      {
        source: { partner_id: [], icon: '', countryName: 'Nowhere' },
        target: { partner_id: [], icon: '', countryName: 'AlsoNowhere' },
        lineType: 'dotted',
        curvature: 0.3,
        color: '#666666'
      }
    ]
  };

  const setMapContainer = (width = 900, height = 420) => {
    const root = document.createElement('div');
    root.className = 'global-map-container';

    const map = document.createElement('div');
    map.id = 'map-container-2';
    root.appendChild(map);
    document.body.appendChild(root);

    Object.defineProperty(map, 'offsetWidth', { configurable: true, get: () => width });
    Object.defineProperty(map, 'offsetHeight', { configurable: true, get: () => height });

    (component as any).mapContainer = new ElementRef(map);
    return { root, map };
  };

  beforeEach(async () => {
    loaderRunnerMock = {
      run: jasmine.createSpy('run').and.callFake(async (cb: () => Promise<any>) => cb())
    };

    await TestBed.configureTestingModule({
      imports: [GlobalMap2],
      providers: [{ provide: LoaderRunnerService, useValue: loaderRunnerMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalMap2);
    component = fixture.componentInstance;

    originalFetch = globalThis.fetch;
    if ((window as any).SVGPathElement && !(window as any).SVGPathElement.prototype.getTotalLength) {
      (window as any).SVGPathElement.prototype.getTotalLength = () => 100;
    }
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    document.querySelectorAll('.global-map-container').forEach((node) => node.remove());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should call getNetworkData', () => {
    const spy = spyOn(component, 'getNetworkData').and.resolveTo();

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('getNetworkData should map partners and draw map on success', async () => {
    setMapContainer();
    const drawSpy = spyOn<any>(component, 'drawChoroplethMap').and.callFake(() => undefined);

    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(NETWORK_DATA)) {
        return Promise.resolve(asJsonResponse(networkPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as any;

    await component.getNetworkData();

    expect(loaderRunnerMock.run).toHaveBeenCalled();
    expect(component.networkData?.partners?.length).toBe(5);
    expect(component.partnersWithCoords.length).toBe(2);
    expect(component.partnersWithCoords[0].coordinates).toEqual([72.877, 19.076]);
    expect(component.partnersByState['Maharashtra'].length).toBe(1);
    expect(component.partnersByCountry['France'].length).toBe(1);
    expect(drawSpy).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(component.loadError).toBeNull();
  });

  it('getNetworkData should skip draw when partners list is missing', async () => {
    const drawSpy = spyOn<any>(component, 'drawChoroplethMap').and.callFake(() => undefined);

    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(NETWORK_DATA)) {
        return Promise.resolve(asJsonResponse({ impactData: [] }));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as any;

    await component.getNetworkData();

    expect(component.networkData as any).toEqual({ impactData: [] });
    expect(drawSpy).not.toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('getNetworkData should handle fetch errors', async () => {
    const err = new Error('network failed');
    const errorSpy = spyOn(console, 'error');

    globalThis.fetch = jasmine.createSpy('fetch').and.returnValue(Promise.reject(err)) as any;

    await component.getNetworkData();

    expect(errorSpy).toHaveBeenCalledWith('Error loading network data:', err);
    expect(component.loadError).toBe('Failed to load network data. Please try again later.');
    expect(component.isLoading).toBeFalse();
  });

  it('onResize should redraw map', () => {
    const drawSpy = spyOn<any>(component, 'drawChoroplethMap').and.callFake(() => undefined);

    component.onResize({});

    expect(drawSpy).toHaveBeenCalled();
  });

  it('drawChoroplethMap should return when networkData is missing', () => {
    setMapContainer();

    (component as any).drawChoroplethMap();

    expect(document.querySelector('#map-container-2 svg')).toBeFalsy();
  });

  it('drawChoroplethMap should return when container size is zero', () => {
    setMapContainer(0, 0);
    component.networkData = { partners: [], impactData: [] } as any;

    (component as any).drawChoroplethMap();

    expect(document.querySelector('#map-container-2 svg')).toBeFalsy();
  });

  it('drawChoroplethMap should render map, lines and icons for all line types', async () => {
    spyOn(component, 'getNetworkData').and.resolveTo();
    fixture.detectChanges();
    const map = fixture.nativeElement.querySelector('#map-container-2') as HTMLElement;
    Object.defineProperty(map, 'offsetWidth', { configurable: true, get: () => 960 });
    Object.defineProperty(map, 'offsetHeight', { configurable: true, get: () => 500 });

    component.networkData = networkPayload as any;
    component.partnersWithCoords = [
      { id: 'partner_1', coordinates: [72.877, 19.076], category: 'strategic' },
      { id: 'partner 2', coordinates: [80.2707, 13.0827], category: 'collaborators' },
      { id: 'partner3', coordinates: [88.3639, 22.5726], category: 'unknown' },
      { id: 'partner4', coordinates: [77.209, 28.6139] }
    ];
    component.partnersByState = {
      Maharashtra: [{ id: 'state_partner', name: 'State Partner' }]
    };
    component.partnersByCountry = {
      France: [{ id: 'country_partner', name: 'Country Partner' }]
    };

    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('countries-110m.json')) {
        return Promise.resolve(asJsonResponse(worldTopology));
      }
      if (url.includes(INDIA)) {
        return Promise.resolve(asJsonResponse(indiaTopology));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as any;

    (component as any).drawChoroplethMap();
    await flushPromises();

    const svg = map.querySelector('svg');
    const lines = Array.from(map.querySelectorAll('path.network-line'));
    const icons = map.querySelectorAll('image.node-icon');

    expect(map.offsetWidth).toBe(960);
    expect(map.offsetHeight).toBe(500);
    expect(svg).toBeTruthy();
    expect(lines.length).toBe(6);
    expect(lines[0].getAttribute('stroke-dasharray')).toBeTruthy();
    expect(lines[1].getAttribute('marker-end')).toBe('url(#arrowhead)');
    expect(lines[2].getAttribute('stroke')).toBe('#333333');
    expect(lines[3].getAttribute('stroke-dasharray')).toBe('20, 5, 10, 5');
    expect(lines[4].getAttribute('stroke-dasharray')).toBe('0,0');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('drawChoroplethMap should log when topojson loading fails', async () => {
    spyOn(component, 'getNetworkData').and.resolveTo();
    fixture.detectChanges();
    const map = fixture.nativeElement.querySelector('#map-container-2') as HTMLElement;
    Object.defineProperty(map, 'offsetWidth', { configurable: true, get: () => 900 });
    Object.defineProperty(map, 'offsetHeight', { configurable: true, get: () => 450 });

    component.networkData = { partners: [], impactData: [] } as any;
    const err = new Error('topology failed');
    const errorSpy = spyOn(console, 'error');

    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('countries-110m.json') || url.includes(INDIA)) {
        return Promise.reject(err);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as any;

    (component as any).drawChoroplethMap();
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith('Error loading data:', err);
  });

  it('drawChoroplethMap should cover getLineCoords fallback branches and icon projection fallback', async () => {
    spyOn(component, 'getNetworkData').and.resolveTo();
    fixture.detectChanges();
    const map = fixture.nativeElement.querySelector('#map-container-2') as HTMLElement;
    Object.defineProperty(map, 'offsetWidth', { configurable: true, get: () => 900 });
    Object.defineProperty(map, 'offsetHeight', { configurable: true, get: () => 420 });

    component.networkData = {
      partners: [],
      impactData: [
        {
          source: { partner_id: ['partner_1'], icon: '' },
          target: { stateName: 'Maharashtra', icon: '', partner_id: [] },
          lineType: 'solid',
          curvature: 0.4,
          color: '#111'
        },
        {
          source: { stateName: 'Maharashtra', icon: '', partner_id: [] },
          target: { countryName: 'France', icon: '', partner_id: [] },
          lineType: 'solid',
          color: '#222'
        },
        {
          source: { countryName: 'MissingCountry', icon: '', partner_id: [] },
          target: { countryName: 'France', icon: '', partner_id: [] },
          lineType: 'solid',
          color: '#333'
        },
        {
          source: { stateName: 'MissingState', icon: '', partner_id: [] },
          target: { countryName: 'France', icon: '', partner_id: [] },
          lineType: 'solid',
          color: '#444'
        }
      ]
    } as any;
    component.partnersWithCoords = [
      { id: 'partner_1', coordinates: [72.877, 19.076], category: 'strategic' }
    ];
    component.partnersByState = {
      Maharashtra: [{ id: 's1' }],
      MissingState: [{ id: 's2' }]
    };
    component.partnersByCountry = {
      France: [{ id: 'c1' }],
      MissingCountry: [{ id: 'c2' }]
    };

    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('countries-110m.json')) return Promise.resolve(asJsonResponse(worldTopology));
      if (url.includes(INDIA)) return Promise.resolve(asJsonResponse(indiaTopology));
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as any;

    (component as any).drawChoroplethMap();
    await flushPromises();

    const lines = map.querySelectorAll('path.network-line');
    const icons = Array.from(map.querySelectorAll('image.node-icon'));

    expect(lines.length).toBe(4);
    expect(icons.length).toBeGreaterThan(0);
  });

  it('drawChoroplethMap should use empty fallbacks when impactData and partnersWithCoords are missing', async () => {
    spyOn(component, 'getNetworkData').and.resolveTo();
    fixture.detectChanges();
    const map = fixture.nativeElement.querySelector('#map-container-2') as HTMLElement;
    Object.defineProperty(map, 'offsetWidth', { configurable: true, get: () => 800 });
    Object.defineProperty(map, 'offsetHeight', { configurable: true, get: () => 380 });

    component.networkData = { partners: [] } as any;
    (component as any).partnersWithCoords = undefined;
    component.partnersByState = {};
    component.partnersByCountry = {};

    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('countries-110m.json')) return Promise.resolve(asJsonResponse(worldTopology));
      if (url.includes(INDIA)) return Promise.resolve(asJsonResponse(indiaTopology));
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as any;

    (component as any).drawChoroplethMap();
    await flushPromises();

    expect(map.querySelector('svg')).toBeTruthy();
    expect(map.querySelectorAll('path.network-line').length).toBe(0);
  });
});
