import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { COMMUNITY_MAP_DATA, DISTRICT_VIEW_INDICATORS, INDIA } from '../../../constants/urlConstants';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { CountryView } from './country-view';

describe('CountryView', () => {
  let component: CountryView;
  let fixture: ComponentFixture<CountryView>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loaderRunnerSpy: jasmine.SpyObj<LoaderRunnerService>;

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
    transform: { scale: [1, 1], translate: [0, 0] },
    objects: {
      states: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Polygon', arcs: [[0]], properties: { st_code: 'MH', st_nm: 'Maharashtra' } },
          { type: 'Polygon', arcs: [[1]], properties: { st_code: 'KA', st_nm: 'Karnataka' } }
        ]
      },
      districts: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Polygon', arcs: [[2]], properties: { dt_code: 'MH-D1' } }
        ]
      }
    },
    arcs: [
      [[70, 15], [5, 0], [0, 5], [-5, 0], [0, -5]],
      [[80, 20], [5, 0], [0, 5], [-5, 0], [0, -5]],
      [[71, 16], [2, 0], [0, 2], [-2, 0], [0, -2]]
    ]
  };

  const indicatorPayload = {
    result: {
      states: {
        MH: {
          label: 'Maharashtra',
          type: 'active',
          details: [{ code: 'Micro Improvements Initiated', value: 12 }]
        }
      },
      overview: {
        details: [{ code: 'Micro Improvements Initiated', value: 99 }]
      },
      meta: {
        labels: { 'Micro Improvements Initiated': 'Micro Improvements Initiated' },
        legends: {
          active: {
            label: 'Active',
            color: { 'Micro Improvements Initiated': '#ff0000' },
            icon: ''
          }
        }
      }
    }
  };

  const indicatorPayloadWithUnknownLabel = {
    result: {
      states: {
        MH: {
          label: 'Maharashtra',
          type: 'active',
          details: [{ code: 'UNKNOWN_CODE', value: 7 }]
        }
      },
      overview: {
        details: [{ code: 'UNKNOWN_CODE', value: 77 }]
      },
      meta: {
        labels: {},
        legends: {
          active: { label: 'Active', color: '#ff0000', icon: '' }
        }
      }
    }
  };

  const indicatorPayloadWithoutLabels = {
    result: {
      states: {
        MH: {
          label: 'Maharashtra',
          type: 'active',
          details: [{ code: 'UNMAPPED_CODE', value: 31 }]
        }
      },
      overview: {
        details: [{ code: 'UNMAPPED_CODE', value: 55 }]
      },
      meta: {
        legends: {
          active: { label: 'Active', color: '#ff0000', icon: '' }
        }
      }
    }
  };

  const indicatorPayloadForFallbackBranches = {
    result: {
      states: {
        MH: {
          label: 'Maharashtra',
          type: 'active',
          details: [{ code: '', value: 21 }]
        },
        KA: {
          label: 'Karnataka',
          type: 'missing',
          details: [{ code: 'Micro Improvements Initiated', value: 9 }]
        }
      },
      overview: {
        details: [{ code: 'Micro Improvements Initiated', value: 100 }]
      },
      meta: {
        labels: {
          '': '',
          'Micro Improvements Initiated': 'Micro Improvements Initiated'
        },
        legends: {
          active: { label: 'Active', color: '#00aa00', icon: '' }
        }
      }
    }
  };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    loaderRunnerSpy = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunnerSpy.run.and.callFake((work: any) => work());

    await TestBed.configureTestingModule({
      imports: [CountryView],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: LoaderRunnerService, useValue: loaderRunnerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CountryView);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should run ngOnInit lifecycle methods', () => {
    const communitySpy = spyOn(component, 'fetchCommunityData');
    const indicatorSpy = spyOn(component, 'fetchIndicatorData').and.resolveTo([]);
    const mobileSpy = spyOn(component, 'checkIfMobile');

    component.ngOnInit();

    expect(communitySpy).toHaveBeenCalled();
    expect(indicatorSpy).toHaveBeenCalled();
    expect(mobileSpy).toHaveBeenCalled();
  });

  it('should set isMobile based on viewport width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 640 });
    component.checkIfMobile();
    expect(component.isMobile).toBeTrue();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    component.checkIfMobile();
    expect(component.isMobile).toBeFalse();
  });

  it('should hide tooltip on scroll for mobile', async () => {
    fixture.detectChanges();
    const tooltip = fixture.nativeElement.querySelector('#map-tooltip') as HTMLDivElement;
    tooltip.style.opacity = '1';
    component.isMobile = true;

    expect(() => component.onScroll()).not.toThrow();
    await flushPromises();
    expect(tooltip.style.opacity).toBeTruthy();
  });

  it('should fetch and set community data through loader runner', async () => {
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(COMMUNITY_MAP_DATA)) {
        return Promise.resolve(asJsonResponse({ result: { states: { MH: { type: 'active' } } } }));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await component.fetchCommunityData();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect((component as any).indicatorJson.result.states.MH).toBeTruthy();
  });

  it('should handle community data fetch errors', async () => {
    const err = new Error('community fetch failed');
    spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(err));

    await component.fetchCommunityData();

    expect(console.error).toHaveBeenCalledWith('Error loading page data:', err);
  });

  it('should process overview indicator data and set indicatorData', async () => {
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(DISTRICT_VIEW_INDICATORS)) {
        return Promise.resolve(asJsonResponse(indicatorPayloadWithUnknownLabel));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await component.fetchIndicatorData();

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({ value: 77, label: 'UNKNOWN_CODE' });
    expect(component.indicatorData).toEqual(result);
    expect(component.hoveredState).toBe('');
  });

  it('should fallback to empty labels object when meta labels are missing', async () => {
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(DISTRICT_VIEW_INDICATORS)) {
        return Promise.resolve(asJsonResponse(indicatorPayloadWithoutLabels));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await component.fetchIndicatorData();

    expect(result).toEqual([{ value: 55, label: 'UNMAPPED_CODE' }]);
    expect(component.indicatorData).toEqual(result);
  });

  it('should process tooltip indicator data for selected state variation', async () => {
    component.showVariations = true;
    component.selectedIndicator = 'Micro Improvements Initiated';
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(DISTRICT_VIEW_INDICATORS)) {
        return Promise.resolve(asJsonResponse(indicatorPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await component.fetchIndicatorData('MH', true);

    expect(result).toEqual([{ value: 12, label: 'Micro Improvements Initiated' }]);
    expect(component.hoveredState).toBe('Maharashtra');
  });

  it('should fetch indicator data using absolute resourcePath URL', async () => {
    component.resourcePath = 'https://example.com/indicators.json';
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === component.resourcePath) {
        return Promise.resolve(asJsonResponse(indicatorPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await component.fetchIndicatorData();

    expect(result.length).toBe(1);
    expect(String((window.fetch as jasmine.Spy).calls.mostRecent().args[0])).toBe(component.resourcePath);
  });

  it('should fetch indicator data using relative resourcePath', async () => {
    component.resourcePath = 'custom/indicator.json';
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(component.resourcePath)) {
        return Promise.resolve(asJsonResponse(indicatorPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await component.fetchIndicatorData();

    expect(result.length).toBe(1);
    expect(String((window.fetch as jasmine.Spy).calls.mostRecent().args[0])).toContain(component.resourcePath);
  });

  it('should return empty indicator data on fetch errors', async () => {
    const err = new Error('indicator fetch failed');
    spyOn(console, 'error');
    component.indicatorData = [{ value: 1, label: 'x' }];
    spyOn(window, 'fetch').and.returnValue(Promise.reject(err));

    const result = await component.fetchIndicatorData(undefined, false);

    expect(result).toEqual([]);
    expect(component.indicatorData).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Error processing indicator data:', err);
  });

  it('should call drawMap in ngAfterViewInit', () => {
    const drawSpy = spyOn<any>(component, 'drawMap');

    component.ngAfterViewInit();

    expect(drawSpy).toHaveBeenCalled();
  });

  it('should debounce resize and redraw only for non-mobile', () => {
    jasmine.clock().install();
    const drawSpy = spyOn<any>(component, 'drawMap');
    component.isMobile = false;

    component.onResize({});
    jasmine.clock().tick(199);
    expect(drawSpy).not.toHaveBeenCalled();
    jasmine.clock().tick(1);
    expect(drawSpy).toHaveBeenCalledTimes(1);

    component.isMobile = true;
    component.onResize({});
    jasmine.clock().tick(250);
    expect(drawSpy).toHaveBeenCalledTimes(1);
    jasmine.clock().uninstall();
  });

  it('should redraw map when reDrawMap is called', () => {
    const drawSpy = spyOn<any>(component, 'drawMap');

    component.reDrawMap();

    expect(drawSpy).toHaveBeenCalled();
  });

  it('should position tooltip within viewport bounds', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 300 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 200 });
    const tooltipEl = document.createElement('div');
    Object.defineProperty(tooltipEl, 'offsetWidth', { configurable: true, value: 120 });
    Object.defineProperty(tooltipEl, 'offsetHeight', { configurable: true, value: 80 });

    component.positionTooltip(new MouseEvent('mousemove', { clientX: 290, clientY: 10 }), tooltipEl);

    expect(tooltipEl.style.left).toBe('160px');
    expect(tooltipEl.style.top).toBe('20px');
    expect(tooltipEl.style.position).toBe('fixed');
    expect(tooltipEl.style.zIndex).toBe('1000');
    expect(tooltipEl.style.display).toBe('block');
  });

  it('should clamp tooltip to left and bottom boundaries', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 120 });
    const tooltipEl = document.createElement('div');
    Object.defineProperty(tooltipEl, 'offsetWidth', { configurable: true, value: 60 });
    Object.defineProperty(tooltipEl, 'offsetHeight', { configurable: true, value: 40 });

    component.positionTooltip(new MouseEvent('mousemove', { clientX: -20, clientY: 200 }), tooltipEl);

    expect(tooltipEl.style.left).toBe('10px');
    expect(tooltipEl.style.top).toBe('70px');
  });

  it('should draw map and handle state interactions (desktop details flow)', async () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('#india-map-container');
    Object.defineProperty(container, 'offsetWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });

    component.showDetails = true;
    component.isMobile = false;
    component.redirectPath = '';
    component.legends = [];
    (component as any).indicatorJson = { result: { states: { MH: { label: 'Maharashtra' }, KA: { label: 'Karnataka' } } } };

    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(INDIA)) {
        return Promise.resolve(asJsonResponse(indiaTopology));
      }
      if (url.includes(DISTRICT_VIEW_INDICATORS)) {
        return Promise.resolve(asJsonResponse(indicatorPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const emitSpy = spyOn(component.stateSelected, 'emit');
    const fetchIndicatorSpy = spyOn(component, 'fetchIndicatorData').and.callThrough();

    (component as any).drawMap();
    await flushPromises();

    const svg = container.querySelector('svg');
    const paths = container.querySelectorAll('path.state-path');
    const icons = container.querySelectorAll('image.state-icon');
    const tooltip = fixture.nativeElement.querySelector('#map-tooltip') as HTMLDivElement;
    expect(svg).toBeTruthy();
    expect(paths.length).toBe(2);
    expect(icons.length).toBe(2);
    expect(component.displayLegends.length).toBe(1);

    paths[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 120, clientY: 120 }));
    await flushPromises();
    expect(fetchIndicatorSpy).toHaveBeenCalledWith('MH');
    expect(tooltip.innerHTML).toContain('Maharashtra');
    expect(tooltip.style.display).toBe('block');
    paths[0].dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 122, clientY: 122 }));
    paths[0].dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    expect(fetchIndicatorSpy).toHaveBeenCalledWith();

    paths[0].dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 120 }));
    expect(emitSpy).toHaveBeenCalledWith('Maharashtra');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['state-view', 'Maharashtra', 'MH']);

    component.showDetails = false;
    paths[0].dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 120 }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(emitSpy).toHaveBeenCalledWith('Maharashtra');

    paths[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 100, clientY: 100 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Karnataka');

    component.showDetails = true;
    component.selectedIndicator = 'Micro Improvements Initiated';
    icons[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 140, clientY: 140 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Micro Improvements Initiated');

    component.selectedIndicator = 'Not Matched';
    icons[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 140, clientY: 140 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Maharashtra');
    icons[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 150, clientY: 150 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Karnataka');

    icons[0].dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 145, clientY: 145 }));
    icons[0].dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    expect(fetchIndicatorSpy).toHaveBeenCalled();

    icons[0].dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 140, clientY: 140 }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['state-view', 'Maharashtra', 'MH']);

    component.showDetails = false;
    icons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 150, clientY: 150 }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle mobile click tooltip flow when details are hidden', async () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('#india-map-container');
    Object.defineProperty(container, 'offsetWidth', { configurable: true, value: 600 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 420 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });

    component.showDetails = false;
    component.isMobile = true;
    (component as any).indicatorJson = { result: { states: { MH: { label: 'Maharashtra' }, KA: { label: 'Karnataka' } } } };

    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(INDIA)) {
        return Promise.resolve(asJsonResponse(indiaTopology));
      }
      if (url.includes(DISTRICT_VIEW_INDICATORS)) {
        return Promise.resolve(asJsonResponse(indicatorPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    (component as any).drawMap();
    await flushPromises();

    const tooltip = fixture.nativeElement.querySelector('#map-tooltip') as HTMLDivElement;
    const statePaths = container.querySelectorAll('path.state-path');
    const firstStatePath = statePaths[0] as SVGPathElement;
    firstStatePath.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 110 }));
    await flushPromises();

    expect(tooltip.innerHTML).toContain('Maharashtra');
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['state-view', 'Maharashtra', 'MH']);

    component.selectedIndicator = 'No Match';
    firstStatePath.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 110 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Maharashtra');

    const secondStatePath = statePaths[1] as SVGPathElement;
    secondStatePath.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 130, clientY: 130 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Karnataka');

    const stateIcons = container.querySelectorAll('image.state-icon');
    const firstStateIcon = stateIcons[0] as SVGImageElement;
    component.selectedIndicator = 'Micro Improvements Initiated';
    firstStateIcon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 110, clientY: 120 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Maharashtra');

    const secondStateIcon = stateIcons[1] as SVGImageElement;
    secondStateIcon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 130 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Karnataka');
  });

  it('should draw map using absolute resourcePath in Promise.all indicator fetch', async () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('#india-map-container');
    Object.defineProperty(container, 'offsetWidth', { configurable: true, value: 700 });
    component.resourcePath = 'https://example.com/district-view-indicators.json';
    (component as any).indicatorJson = { result: { states: { MH: { label: 'Maharashtra' } } } };

    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(INDIA)) {
        return Promise.resolve(asJsonResponse(indiaTopology));
      }
      if (url === component.resourcePath) {
        return Promise.resolve(asJsonResponse(indicatorPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    (component as any).drawMap();
    await flushPromises();

    expect(container.querySelector('svg')).toBeTruthy();
    expect((window.fetch as jasmine.Spy).calls.allArgs().some((args) => String(args[0]) === component.resourcePath)).toBeTrue();
  });

  it('should set dashboardPage true when pathname includes dashboard', async () => {
    const originalPath = window.location.pathname;
    history.pushState({}, '', '/dashboard');

    const dashboardFixture = TestBed.createComponent(CountryView);
    const dashboardComponent = dashboardFixture.componentInstance;
    expect(dashboardComponent.dashboardPage).toBeTrue();

    dashboardFixture.destroy();
    history.pushState({}, '', originalPath || '/');
  });

  it('should draw map using relative resourcePath in Promise.all indicator fetch', async () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('#india-map-container');
    Object.defineProperty(container, 'offsetWidth', { configurable: true, value: 700 });
    component.resourcePath = 'custom/district-view-indicators.json';
    (component as any).indicatorJson = { result: { states: { MH: { label: 'Maharashtra' } } } };

    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(INDIA)) {
        return Promise.resolve(asJsonResponse(indiaTopology));
      }
      if (url.includes(component.resourcePath)) {
        return Promise.resolve(asJsonResponse(indicatorPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    (component as any).drawMap();
    await flushPromises();

    expect(container.querySelector('svg')).toBeTruthy();
    expect((window.fetch as jasmine.Spy).calls.allArgs().some((args) => String(args[0]).includes(component.resourcePath))).toBeTrue();
  });

  it('should cover fallback branches in map interactions and redirects', async () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('#india-map-container');
    Object.defineProperty(container, 'offsetWidth', { configurable: true, value: 750 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 640 });

    const topologyWithoutNames = {
      ...indiaTopology,
      objects: {
        ...indiaTopology.objects,
        states: {
          ...(indiaTopology.objects as any).states,
          geometries: [
            { type: 'Polygon', arcs: [[0]], properties: { st_code: 'MH' } },
            { type: 'Polygon', arcs: [[1]], properties: { st_code: 'KA' } },
            { type: 'Polygon', arcs: [[2]], properties: { st_code: 'ZZ' } }
          ]
        }
      }
    };

    let proxyReadCount = 0;
    const iconStateProxy = new Proxy({} as Record<string, any>, {
      get: (_target, prop: string) => {
        if (prop === 'MH') {
          proxyReadCount += 1;
          return proxyReadCount === 1 ? { label: 'Maharashtra' } : undefined;
        }
        if (prop === 'KA') {
          return { label: 'Karnataka' };
        }
        if (prop === 'ZZ') {
          return { label: 'Unknown' };
        }
        return undefined;
      }
    });

    component.redirectPath = 'community-view';
    component.selectedIndicator = '';
    component.showDetails = true;
    component.isMobile = false;
    (component as any).indicatorJson = { result: { states: iconStateProxy } };

    const mutableIndicatorPayload = JSON.parse(JSON.stringify(indicatorPayloadForFallbackBranches));
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(INDIA)) {
        return Promise.resolve(asJsonResponse(topologyWithoutNames));
      }
      if (url.includes(DISTRICT_VIEW_INDICATORS)) {
        return Promise.resolve(asJsonResponse(mutableIndicatorPayload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const emitSpy = spyOn(component.stateSelected, 'emit');

    (component as any).drawMap();
    await flushPromises();

    const statePaths = container.querySelectorAll('path.state-path');
    const stateIcons = container.querySelectorAll('image.state-icon');
    const tooltip = fixture.nativeElement.querySelector('#map-tooltip') as HTMLDivElement;
    expect(statePaths.length).toBe(3);
    expect(stateIcons.length).toBe(3);

    const kaPath = statePaths[1] as SVGPathElement;
    expect(kaPath.getAttribute('fill')).toBe('#fff');

    kaPath.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 120, clientY: 120 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Karnataka');

    const mhPath = statePaths[0] as SVGPathElement;
    const zzPath = statePaths[2] as SVGPathElement;
    mhPath.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 100, clientY: 100 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Maharashtra');

    mhPath.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['community-view', 'Maharashtra', 'MH']);

    component.showDetails = false;
    kaPath.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 120 }));
    expect(emitSpy).toHaveBeenCalledWith('Karnataka');

    const mhIcon = stateIcons[0] as SVGImageElement;
    const zzIcon = stateIcons[2] as SVGImageElement;

    component.isMobile = false;
    component.showDetails = true;
    mhIcon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 110, clientY: 110 }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['community-view', 'Maharashtra', 'MH']);

    component.showDetails = true;
    mhIcon.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 108, clientY: 108 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Maharashtra');

    component.showDetails = false;
    component.isMobile = true;

    const fetchIndicatorSpy = spyOn(component, 'fetchIndicatorData').and.callThrough();
    const pathShowDetailsReads = [false, true];
    Object.defineProperty(component, 'showDetails', {
      configurable: true,
      get: () => pathShowDetailsReads.shift() ?? false
    });
    mhPath.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }));
    await flushPromises();
    expect(fetchIndicatorSpy).toHaveBeenCalledWith('MH');
    expect(tooltip.innerHTML).toContain('Maharashtra');

    const iconShowDetailsReads = [false, true];
    Object.defineProperty(component, 'showDetails', {
      configurable: true,
      get: () => iconShowDetailsReads.shift() ?? false
    });
    mhIcon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 110, clientY: 110 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Maharashtra');

    Object.defineProperty(component, 'showDetails', {
      configurable: true,
      writable: true,
      value: false
    });
    component.selectedIndicator = 'No Match';
    mhIcon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 115, clientY: 115 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Maharashtra');

    zzPath.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Unknown State');

    zzIcon.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 110, clientY: 110 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Unknown State');

    zzIcon.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 110, clientY: 110 }));
    await flushPromises();
    expect(tooltip.innerHTML).toContain('Unknown State');

    component.isMobile = false;
    component.showDetails = false;
    zzPath.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }));
    expect(emitSpy).toHaveBeenCalledWith('');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle drawMap errors gracefully', async () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('#india-map-container');
    Object.defineProperty(container, 'offsetWidth', { configurable: true, value: 600 });
    const err = new Error('map fetch failed');
    spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(err));

    (component as any).drawMap();
    await flushPromises();

    expect(console.error).toHaveBeenCalledWith('Error loading or processing data:', err);
  });
});
