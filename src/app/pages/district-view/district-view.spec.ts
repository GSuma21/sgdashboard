import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject } from 'rxjs';

import { DISTRICT_VIEW_INDICATORS } from '../../../constants/urlConstants';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { DistrictView } from './district-view';

describe('DistrictView', () => {
  let component: DistrictView;
  let fixture: ComponentFixture<DistrictView>;
  let loaderRunnerSpy: jasmine.SpyObj<LoaderRunnerService>;
  let paramMap$: Subject<any>;

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

  const districtTopology = {
    type: 'Topology',
    transform: { scale: [1, 1], translate: [0, 0] },
    objects: {
      districts: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Polygon', arcs: [[0]], properties: { district: 'Pathanamthitta' } },
          { type: 'Polygon', arcs: [[1]], properties: { district: 'Kollam' } }
        ]
      }
    },
    arcs: [
      [[70, 10], [4, 0], [0, 4], [-4, 0], [0, -4]],
      [[76, 16], [4, 0], [0, 4], [-4, 0], [0, -4]]
    ]
  };

  const emptyDistrictTopology = {
    type: 'Topology',
    transform: { scale: [1, 1], translate: [0, 0] },
    objects: { districts: { type: 'GeometryCollection', geometries: [] } },
    arcs: []
  };

  beforeEach(async () => {
    paramMap$ = new Subject<any>();
    loaderRunnerSpy = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunnerSpy.run.and.callFake((work: any) => work());

    await TestBed.configureTestingModule({
      imports: [DistrictView],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: LoaderRunnerService, useValue: loaderRunnerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DistrictView);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to route params and fetch indicators when district exists', () => {
    const fetchSpy = spyOn(component, 'fetchIndicatorData').and.resolveTo();

    component.ngOnInit();
    paramMap$.next(convertToParamMap({ district: 'Kerala' }));

    expect(component.stateName).toBe('Kerala');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should not fetch indicators when district param is missing', () => {
    const fetchSpy = spyOn(component, 'fetchIndicatorData').and.resolveTo();

    component.ngOnInit();
    paramMap$.next(convertToParamMap({}));

    expect(component.stateName).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should fetch and set state-specific indicator data', async () => {
    component.stateName = 'Kerala';
    const payload = {
      result: {
        Kerala: [{ value: 10, label: 'Metric A' }],
        Default: [{ value: 1, label: 'Fallback' }]
      }
    };
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(DISTRICT_VIEW_INDICATORS)) {
        return Promise.resolve(asJsonResponse(payload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await component.fetchIndicatorData();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(component.indicatorData).toEqual(payload.result.Kerala);
  });

  it('should use default indicator data when state data does not exist', async () => {
    component.stateName = 'Unknown';
    const payload = {
      result: {
        Kerala: [{ value: 10, label: 'Metric A' }],
        Default: [{ value: 1, label: 'Fallback' }]
      }
    };
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(DISTRICT_VIEW_INDICATORS)) {
        return Promise.resolve(asJsonResponse(payload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await component.fetchIndicatorData();

    expect(component.indicatorData).toEqual(payload.result.Default);
  });

  it('should handle indicator data fetch errors', async () => {
    const err = new Error('indicator fetch failed');
    spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(err));

    await component.fetchIndicatorData();

    expect(console.error).toHaveBeenCalledWith('Error loading indicator data:', err);
  });

  it('should call drawDistrictMap in ngAfterViewInit when stateName exists', () => {
    component.stateName = 'Kerala';
    const drawSpy = spyOn<any>(component, 'drawDistrictMap');

    component.ngAfterViewInit();

    expect(drawSpy).toHaveBeenCalledWith('Kerala');
  });

  it('should not call drawDistrictMap in ngAfterViewInit when stateName is null', () => {
    component.stateName = null;
    const drawSpy = spyOn<any>(component, 'drawDistrictMap');

    component.ngAfterViewInit();

    expect(drawSpy).not.toHaveBeenCalled();
  });

  it('should redraw map on resize for non-mobile when state exists', () => {
    component.stateName = 'Kerala';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    const drawSpy = spyOn<any>(component, 'drawDistrictMap');

    component.onResize({});

    expect(drawSpy).toHaveBeenCalledWith('Kerala');
  });

  it('should not redraw map on resize for mobile width', () => {
    component.stateName = 'Kerala';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    const drawSpy = spyOn<any>(component, 'drawDistrictMap');

    component.onResize({});

    expect(drawSpy).not.toHaveBeenCalled();
  });

  it('should not redraw map on resize when state is missing', () => {
    component.stateName = null;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    const drawSpy = spyOn<any>(component, 'drawDistrictMap');

    component.onResize({});

    expect(drawSpy).not.toHaveBeenCalled();
  });

  it('should render district map with expected fill colors', async () => {
    fixture.detectChanges();
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/assets/districts/kerala.json')) {
        return Promise.resolve(asJsonResponse(districtTopology));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    (component as any).drawDistrictMap('Kerala');
    await flushPromises();

    const container = fixture.nativeElement.querySelector('#district-map-container');
    const svg = container.querySelector('svg');
    const paths = container.querySelectorAll('path');
    expect(svg).toBeTruthy();
    expect(paths.length).toBe(2);
    expect(paths[0].getAttribute('fill')).toBe('#572e91');
    expect(paths[1].getAttribute('fill')).toBe('#ccc');
  });

  it('should remove existing svg before drawing new map', async () => {
    fixture.detectChanges();
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/assets/districts/kerala.json')) {
        return Promise.resolve(asJsonResponse(districtTopology));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    (component as any).drawDistrictMap('Kerala');
    await flushPromises();
    (component as any).drawDistrictMap('Kerala');
    await flushPromises();

    const svgs = fixture.nativeElement.querySelectorAll('#district-map-container svg');
    expect(svgs.length).toBe(1);
  });

  it('should exit early when district feature list is empty', async () => {
    fixture.detectChanges();
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/assets/districts/kerala.json')) {
        return Promise.resolve(asJsonResponse(emptyDistrictTopology));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    (component as any).drawDistrictMap('Kerala');
    await flushPromises();

    const paths = fixture.nativeElement.querySelectorAll('#district-map-container path');
    expect(paths.length).toBe(0);
  });

  it('should handle district map loading errors', async () => {
    fixture.detectChanges();
    const err = new Error('district topojson failed');
    spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(err));

    (component as any).drawDistrictMap('Kerala');
    await flushPromises();

    expect(console.error).toHaveBeenCalledWith('Error loading or processing the TopoJSON district data:', err);
  });
});
