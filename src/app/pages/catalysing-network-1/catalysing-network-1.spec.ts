import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { INDIA, NETWORK_DATA } from '../../../constants/urlConstants';
import { CatalysingNetwork1 } from './catalysing-network-1';

describe('CatalysingNetwork1', () => {
  let component: CatalysingNetwork1;
  let fixture: ComponentFixture<CatalysingNetwork1>;
  let routerSpy: jasmine.SpyObj<Router>;

  const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const asJsonResponse = (data: unknown, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const indiaTopology = {
    type: 'Topology',
    transform: {
      scale: [1, 1],
      translate: [0, 0]
    },
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
    arcs: [
      [[70, 15], [5, 0], [0, 5], [-5, 0], [0, -5]]
    ]
  };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CatalysingNetwork1],
      providers: [{ provide: Router, useValue: routerSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(CatalysingNetwork1);
    component = fixture.componentInstance;

    if ((window as any).SVGPathElement && !(window as any).SVGPathElement.prototype.getTotalLength) {
      (window as any).SVGPathElement.prototype.getTotalLength = () => 100;
    }
  });

  afterEach(() => {
    const tooltip = fixture.nativeElement?.querySelector?.('#tooltip') as HTMLDivElement | null;
    if (tooltip) {
      tooltip.innerHTML = '';
      tooltip.style.display = 'none';
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to network-health when partner view is not showable', () => {
    component.isPartnerShowable = false;

    component.goToNetworkPage();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/network-health']);
  });

  it('should not navigate when partner view is showable', () => {
    component.isPartnerShowable = true;

    component.goToNetworkPage();

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should transform network data into partnersWithCoords and partnersByState', async () => {
    const networkPayload = {
      partners: [
        {
          id: 'P1',
          name: 'Partner With Coords',
          coordinates: [19.076, 72.877],
          category: 'strategic',
          website: 'https://p1.example.com',
          src: 'logo1.png'
        },
        {
          id: 'P2',
          name: 'State Partner',
          partnerState: 'Maharashtra',
          category: 'momentum',
          website: 'https://p2.example.com',
          src: 'logo2.png'
        },
        {
          id: 'P3',
          name: 'Missing Data Partner'
        }
      ],
      impactData: []
    };

    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(NETWORK_DATA)) {
        return Promise.resolve(asJsonResponse(networkPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await component.getNetworkData();

    expect(component.networkData).toEqual(jasmine.objectContaining(networkPayload));
    expect(component.networkData.partnersWithCoords.length).toBe(1);
    expect(component.networkData.partnersWithCoords[0].coordinates).toEqual([72.877, 19.076]);
    expect(component.partnersByState['Maharashtra'].length).toBe(1);
    expect(component.networkData.countryLevelPartners).toEqual([]);
  });

  it('should handle network data loading errors', async () => {
    const err = new Error('network failed');
    spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(err));

    await component.getNetworkData();

    expect(console.error).toHaveBeenCalledWith('Error loading network data:', err);
  });

  it('should call drawMap on resize', () => {
    const drawSpy = spyOn<any>(component, 'drawMap');

    component.onResize({});

    expect(drawSpy).toHaveBeenCalled();
  });

  it('should call drawMap after view init when network data exists', async () => {
    spyOn(component, 'getNetworkData').and.callFake(async () => {
      component.networkData = { partnersWithCoords: [], impactData: [], countryLevelPartners: [] };
    });
    const drawSpy = spyOn<any>(component, 'drawMap');

    component.ngAfterViewInit();
    await flushPromises();

    expect(component.getNetworkData).toHaveBeenCalled();
    expect(drawSpy).toHaveBeenCalled();
  });

  it('should not call drawMap after view init when network data is missing', async () => {
    spyOn(component, 'getNetworkData').and.resolveTo();
    const drawSpy = spyOn<any>(component, 'drawMap');

    component.ngAfterViewInit();
    await flushPromises();

    expect(drawSpy).not.toHaveBeenCalled();
  });

  it('should return early from drawMap when already drawing', () => {
    spyOn(component, 'getNetworkData').and.resolveTo();
    fixture.detectChanges();

    (component as any).isDrawing = true;
    const fetchSpy = spyOn(window, 'fetch');

    (component as any).drawMap();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should render map and show tooltip on state, partner and country icon clicks', async () => {
    spyOn(component, 'getNetworkData').and.resolveTo();
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('#network-map-container');
    Object.defineProperty(container, 'offsetWidth', { configurable: true, value: 800 });
    Object.defineProperty(container, 'offsetHeight', { configurable: true, value: 500 });

    component.networkData = {
      partnersWithCoords: [
        {
          id: 'partner_1',
          name: 'Partner One',
          coordinates: [72.877, 19.076],
          category: 'Strategic',
          website: 'https://partner1.example.com',
          src: 'partner1.svg'
        }
      ],
      impactData: [
        {
          source: { stateName: 'Maharashtra', partner_id: [] },
          target: { partner_id: ['partner_1'] },
          color: 'green',
          lineType: 'dotted',
          curvature: 0
        },
        {
          source: { countryName: 'India' },
          target: { stateName: 'Maharashtra' },
          color: 'orange',
          lineType: 'multi-dash'
        },
        {
          source: { countryName: 'India' },
          target: { partner_id: ['partner_1'] },
          color: 'purple',
          lineType: 'arrowhead'
        },
        {
          source: { countryName: 'India' },
          target: { countryName: 'India' },
          color: '#333333',
          lineType: 'glow'
        }
      ],
      countryLevelPartners: [
        {
          name: 'Country Partner',
          category: 'strategic',
          website: 'https://country.example.com',
          src: 'country.svg'
        }
      ]
    };

    component.partnersByState = {
      Maharashtra: [
        {
          name: 'State Partner',
          category: 'momentum',
          website: 'https://state.example.com',
          src: 'state.svg'
        }
      ]
    };

    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(INDIA)) {
        return Promise.resolve(asJsonResponse(indiaTopology));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    (component as any).drawMap();
    await flushPromises();

    const linePaths = container.querySelectorAll('path.network-line');
    const stateIcon = (container.querySelector('image.state-node-icon') || container.querySelector('.state-node-icon')) as SVGImageElement;
    const partnerIcon = (container.querySelector('image.partner-node-icon') || container.querySelector('.partner-node-icon')) as SVGImageElement;
    const countryIcon = (container.querySelector('image.country-node-icon') || container.querySelector('.country-node-icon')) as SVGImageElement;
    const tooltip = fixture.nativeElement.querySelector('#tooltip') as HTMLDivElement;

    expect(container.querySelector('svg')).toBeTruthy();
    expect(linePaths.length).toBe(4);
    expect(linePaths[0].getAttribute('stroke-dasharray')).toBeTruthy();
    expect(linePaths[1].getAttribute('stroke-dasharray')).toBeTruthy();
    expect(linePaths[2].getAttribute('marker-end')).toBe('url(#arrowhead)');
    expect(stateIcon).toBeTruthy();
    expect(partnerIcon).toBeTruthy();
    expect(countryIcon).toBeTruthy();

    stateIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(tooltip.style.display).toBe('block');
    expect(tooltip.innerHTML).toContain('State Partner');

    partnerIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(tooltip.innerHTML).toContain('Partner One');

    countryIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(tooltip.innerHTML).toContain('Country Partner');

    component.isPartnerShowable = false;
    tooltip.style.display = 'none';
    partnerIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(tooltip.style.display).toBe('none');
  });

  it('should reset drawing flag and log error when topojson fetch fails', async () => {
    spyOn(component, 'getNetworkData').and.resolveTo();
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('#network-map-container');
    Object.defineProperty(container, 'offsetWidth', { configurable: true, value: 600 });
    Object.defineProperty(container, 'offsetHeight', { configurable: true, value: 400 });

    component.networkData = {
      partnersWithCoords: [],
      impactData: [],
      countryLevelPartners: []
    };

    const err = new Error('topo fetch failed');
    spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(err));

    (component as any).drawMap();
    await flushPromises();

    expect(console.error).toHaveBeenCalledWith('Error loading or processing the TopoJSON data:', err);
    expect((component as any).isDrawing).toBeFalse();
  });
});
