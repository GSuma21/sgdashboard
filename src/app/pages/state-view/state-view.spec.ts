import { ElementRef, SimpleChange, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { StateView } from './state-view';
import { LoaderRunnerService } from '../../services/loader-runner.service';

describe('StateView', () => {
  let component: StateView;
  let router: jasmine.SpyObj<Router>;
  let loaderRunner: jasmine.SpyObj<LoaderRunnerService>;

  const indiaTopology = {
    type: 'Topology',
    objects: {
      states: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Polygon',
            properties: { st_nm: 'Karnataka', st_code: '29' },
            arcs: [[0]],
          },
        ],
      },
      districts: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Polygon',
            properties: { st_nm: 'Karnataka', st_code: '29', district: 'District One', dt_code: 'D1' },
            arcs: [[1]],
          },
          {
            type: 'Polygon',
            properties: { st_nm: 'Karnataka', st_code: '29', district: 'District Two', dt_code: 'D2' },
            arcs: [[2]],
          },
          {
            type: 'Polygon',
            properties: { st_nm: 'Karnataka', st_code: '29', district: '', dt_code: 'D3' },
            arcs: [[3]],
          },
        ],
      },
    },
    arcs: [
      [[0, 0], [50, 0], [0, 50], [-50, 0], [0, -50]],
      [[5, 5], [10, 0], [0, 10], [-10, 0], [0, -10]],
      [[20, 5], [10, 0], [0, 10], [-10, 0], [0, -10]],
      [[35, 5], [10, 0], [0, 10], [-10, 0], [0, -10]],
    ],
  };

  const indicatorJson = {
    result: {
      meta: {
        labels: {
          MI: 'Micro Improvements Initiated',
          OTH: 'Other Label',
        },
      },
      overview: {
        details: [
          { code: 'MI', value: 11 },
          { code: 'UNKNOWN', value: 2 },
        ],
      },
      districts: {
        D1: {
          label: 'District One',
          type: 'category_1',
          details: [
            { code: 'MI', value: 7 },
            { code: 'Micro Improvements Initiated', value: 7 },
            { code: 'OTH', value: 1 },
          ],
        },
        D2: {
          label: '',
          type: 'missing_type',
          details: [{ code: 'Something Else', value: 3 }],
        },
      },
    },
  };

  const communityJson = {
    result: {
      districts: {
        D1: true,
        D2: true,
        D3: true,
      },
    },
  };

  const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const jsonResponse = (data: any): Promise<Response> =>
    Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

  const extractUrl = (input: string | URL | Request): string => {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input.url;
  };

  const setupMapDom = () => {
    const mapEl = document.createElement('div');
    mapEl.id = 'state-map-container';
    const tooltip = document.createElement('div');
    tooltip.id = 'map-tooltip';
    document.body.appendChild(mapEl);
    document.body.appendChild(tooltip);
    Object.defineProperty(mapEl, 'offsetWidth', { value: 500, configurable: true });
    (component as any).mapContainer = new ElementRef(mapEl);
    return mapEl;
  };

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    loaderRunner = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunner.run.and.callFake(<T>(runner: () => Promise<T>) => runner());
    component = new StateView(router, loaderRunner);
    component.path = '/states/{code}/indicator.json';
    component.replaceCode = 29;
    component.legends = {
      category_1: { label: 'Category 1', color: '#11aa11', icon: '' },
      category_2: { label: 'Category 2', color: '#2222ff', icon: '' },
    };
    component.selectedState = 'Karnataka';
    component.pageConfig = { type: 'stateLed' };
    component.showDetails = true;
    component.showVariations = true;
  });

  afterEach(() => {
    document.getElementById('state-map-container')?.remove();
    document.getElementById('map-tooltip')?.remove();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize paths, legends and fetch calls in ngOnInit', () => {
    const communitySpy = spyOn(component, 'fetchCommunityData').and.returnValue(Promise.resolve());
    const indicatorSpy = spyOn(component, 'fetchIndicatorData').and.returnValue(Promise.resolve([]));

    component.ngOnInit();

    expect(component.dataFetchPath).toBe('/states/29/indicator.json');
    expect(component.communityDataFetchPath).toBe('/states/29/community-map.json');
    expect(component.displayLegends).toEqual([
      { label: 'Category 1', color: '#11aa11', icon: '' },
      { label: 'Category 2', color: '#2222ff', icon: '' },
    ]);
    expect(communitySpy).toHaveBeenCalled();
    expect(indicatorSpy).toHaveBeenCalled();
  });

  it('should initialize fallback paths when replaceCode is not provided', () => {
    component.replaceCode = undefined;
    component.path = '/plain-path.json';
    const communitySpy = spyOn(component, 'fetchCommunityData').and.returnValue(Promise.resolve());
    const indicatorSpy = spyOn(component, 'fetchIndicatorData').and.returnValue(Promise.resolve([]));

    component.ngOnInit();

    expect(component.dataFetchPath).toBe('/plain-path.json');
    expect(component.communityDataFetchPath).toBe('/plain-path.json');
    expect(communitySpy).toHaveBeenCalled();
    expect(indicatorSpy).toHaveBeenCalled();
  });

  it('should fetch community data successfully', async () => {
    component.communityDataFetchPath = '/states/29/community-map.json';
    spyOn(window, 'fetch').and.callFake((url: string | URL | Request) => {
      const value = extractUrl(url);
      if (value.includes('community-map.json')) {
        return jsonResponse(communityJson) as any;
      }
      return Promise.reject('unexpected-url') as any;
    });

    await component.fetchCommunityData();

    expect(loaderRunner.run).toHaveBeenCalled();
    expect(component.communityJson).toEqual(communityJson);
  });

  it('should handle fetchCommunityData errors', async () => {
    component.communityDataFetchPath = '/states/29/community-map.json';
    spyOn(window, 'fetch').and.returnValue(Promise.reject('community-failed') as any);
    const errorSpy = spyOn(console, 'error');

    await component.fetchCommunityData();

    expect(loaderRunner.run).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Error loading page data:', 'community-failed');
  });

  it('should process indicator data for overview and district tooltip', async () => {
    component.dataFetchPath = '/states/29/indicator.json';
    component.selectedIndicator = 'Micro Improvements Initiated';
    spyOn(window, 'fetch').and.callFake((url: string | URL | Request) => {
      const value = extractUrl(url);
      if (value.includes('indicator.json')) {
        return jsonResponse(indicatorJson) as any;
      }
      return Promise.reject('unexpected-url') as any;
    });

    const overview = await component.fetchIndicatorData();
    expect(overview).toEqual([
      { value: 11, label: 'Micro Improvements Initiated' },
      { value: 2, label: 'UNKNOWN' },
    ]);
    expect(component.indicatorData).toEqual(overview);
    expect(component.hoveredDistrict).toBe('');

    const tooltipData = await component.fetchIndicatorData('D1', true);
    expect(tooltipData).toEqual([{ value: 7, label: 'Micro Improvements Initiated' }]);
    expect(component.hoveredDistrict).toBe('District One');
  });

  it('should handle indicator payloads with missing districts and labels', async () => {
    component.dataFetchPath = '/states/29/indicator.json';
    spyOn(window, 'fetch').and.returnValue(
      jsonResponse({
        result: {
          overview: { details: [] },
        },
      }) as any,
    );

    const result = await component.fetchIndicatorData();

    expect(result).toEqual([]);
    expect(component.indicatorData).toEqual([]);
  });

  it('should handle indicator fetch errors for tooltip and non-tooltip modes', async () => {
    component.dataFetchPath = '/states/29/indicator.json';
    component.indicatorData = [{ value: 99, label: 'old' }];
    spyOn(window, 'fetch').and.returnValue(Promise.reject('indicator-failed') as any);
    const errorSpy = spyOn(console, 'error');

    const nonTooltip = await component.fetchIndicatorData();
    expect(nonTooltip).toEqual([]);
    expect(component.indicatorData).toEqual([]);

    component.indicatorData = [{ value: 55, label: 'keep' }];
    const tooltip = await component.fetchIndicatorData('D1', true);
    expect(tooltip).toEqual([]);
    expect(component.indicatorData).toEqual([{ value: 55, label: 'keep' }]);
    expect(errorSpy).toHaveBeenCalledWith('Error loading indicator data:', 'indicator-failed');
  });

  it('should call tryDrawMap in ngAfterViewInit', () => {
    const drawSpy = spyOn<any>(component, 'tryDrawMap');
    component.ngAfterViewInit();
    expect(drawSpy).toHaveBeenCalled();
  });

  it('should update colors on stateLedMission change when map is rendered', () => {
    (component as any).mapRendered = true;
    const updateSpy = spyOn<any>(component, 'updateDistrictColors');
    const redrawSpy = spyOn<any>(component, 'debouncedRedraw');

    const changes: SimpleChanges = {
      stateLedMission: new SimpleChange(0, 3, false),
    };

    component.ngOnChanges(changes);

    expect(component.stateLedMission).toBe(3);
    expect(updateSpy).toHaveBeenCalled();
    expect(redrawSpy).not.toHaveBeenCalled();
  });

  it('should default stateLedMission to 0 when change value is null', () => {
    (component as any).mapRendered = true;
    spyOn<any>(component, 'updateDistrictColors');

    component.ngOnChanges({
      stateLedMission: new SimpleChange(3, null, false),
    });

    expect(component.stateLedMission).toBe(0);
  });

  it('should debounce redraw for relevant path/selectedState changes', () => {
    const redrawSpy = spyOn<any>(component, 'debouncedRedraw');
    (component as any).mapRendered = true;

    component.ngOnChanges({
      path: new SimpleChange('/old', '/new', false),
    });
    expect((component as any).mapRendered).toBeFalse();
    expect(redrawSpy).toHaveBeenCalledTimes(1);

    component.ngOnChanges({
      selectedState: new SimpleChange('Old', 'New', false),
    });
    expect(redrawSpy).toHaveBeenCalledTimes(2);

    component.ngOnChanges({
      selectedState: new SimpleChange('Old', 'New', true),
    });
    expect(redrawSpy).toHaveBeenCalledTimes(2);
  });

  it('should debounce redraw and handle resize behavior', () => {
    jasmine.clock().install();
    const drawSpy = spyOn<any>(component, 'drawMap');

    (component as any).debouncedRedraw();
    (component as any).debouncedRedraw();
    jasmine.clock().tick(299);
    expect(drawSpy).not.toHaveBeenCalled();
    jasmine.clock().tick(1);
    expect(drawSpy).toHaveBeenCalledTimes(1);

    const widthSpy = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1200);
    component.onResize({});
    jasmine.clock().tick(199);
    expect(drawSpy).toHaveBeenCalledTimes(1);
    jasmine.clock().tick(1);
    expect(drawSpy).toHaveBeenCalledTimes(2);

    widthSpy.and.returnValue(768);
    component.onResize({});
    jasmine.clock().tick(500);
    expect(drawSpy).toHaveBeenCalledTimes(2);

    jasmine.clock().uninstall();
  });

  it('should draw map only when prerequisites are available', () => {
    const drawSpy = spyOn<any>(component, 'drawMap');
    (component as any).mapRendered = false;
    component.path = '/states/29/indicator.json';
    component.selectedState = 'Karnataka';
    component.legends = { category_1: { color: '#111' } };

    (component as any).tryDrawMap();
    expect(drawSpy).toHaveBeenCalledTimes(1);
    expect((component as any).mapRendered).toBeTrue();

    drawSpy.calls.reset();
    (component as any).tryDrawMap();
    expect(drawSpy).not.toHaveBeenCalled();
  });

  it('should return early in updateDistrictColors when svg is missing', () => {
    const mapEl = document.createElement('div');
    mapEl.id = 'state-map-container';
    document.body.appendChild(mapEl);
    const fetchSpy = spyOn(window, 'fetch');

    (component as any).updateDistrictColors();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should update district colors and handle errors in updateDistrictColors', async () => {
    const mapEl = setupMapDom();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mapEl.appendChild(svg);
    component.dataFetchPath = '/states/29/indicator.json';
    component.stateLedMission = 1;

    const pathOne = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathOne.setAttribute('class', 'district-path');
    (pathOne as any).__data__ = { properties: { dt_code: 'D1' } };
    svg.appendChild(pathOne);

    const pathTwo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathTwo.setAttribute('class', 'district-path');
    (pathTwo as any).__data__ = { properties: { dt_code: 'D9' } };
    svg.appendChild(pathTwo);

    const pathThree = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathThree.setAttribute('class', 'district-path');
    (pathThree as any).__data__ = { properties: { dt_code: 'D4' } };
    svg.appendChild(pathThree);

    spyOn(window, 'fetch').and.returnValues(
      jsonResponse(indicatorJson) as any,
      jsonResponse({
        result: { districts: { D4: {} } },
      }) as any,
      jsonResponse({ result: {} }) as any,
      Promise.resolve(
        new Response('not-json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ) as any,
    );
    const errorSpy = spyOn(console, 'error');

    (component as any).updateDistrictColors();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(pathOne.getAttribute('fill')).toBeTruthy();
    expect(pathTwo.getAttribute('fill')).toBeTruthy();
    expect(pathThree.getAttribute('fill')).toBeTruthy();

    component.stateLedMission = 0;
    (component as any).updateDistrictColors();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 450));

    component.stateLedMission = 1;
    (component as any).updateDistrictColors();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 450));

    (component as any).updateDistrictColors();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should render map, handle events, navigation branches, and drawMap error cases', async () => {
    setupMapDom();
    component.dataFetchPath = '/states/29/indicator.json';
    const dynamicIconDistricts: any = { D1: true, D2: true };
    let d3FlagReads = 0;
    Object.defineProperty(dynamicIconDistricts, 'D3', {
      configurable: true,
      get: () => {
        d3FlagReads += 1;
        return d3FlagReads === 1;
      },
    });
    component.communityJson = { result: { districts: dynamicIconDistricts } };
    component.selectedState = 'Karnataka';
    component.stateLedMission = 1;
    component.selectedIndicator = 'Micro Improvements Initiated';

    const fetchIndicatorSpy = spyOn(component, 'fetchIndicatorData').and.returnValue(Promise.resolve([]));
    spyOn(window, 'fetch').and.callFake((url: string | URL | Request) => {
      const value = extractUrl(url);
      if (value.includes('/india.json')) {
        return jsonResponse(indiaTopology) as any;
      }
      if (value.includes('indicator.json')) {
        return jsonResponse(indicatorJson) as any;
      }
      return Promise.reject(`unexpected:${value}`) as any;
    });

    (component as any).drawMap();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const districtPaths = Array.from(document.querySelectorAll('.district-path')) as any[];
    const icons = Array.from(document.querySelectorAll('.district-icon')) as any[];
    expect(districtPaths.length).toBe(3);
    expect(icons.length).toBe(3);

    const districtD1 = districtPaths.find((node: any) => node.__data__?.properties?.dt_code === 'D1');
    const districtD2 = districtPaths.find((node: any) => node.__data__?.properties?.dt_code === 'D2');
    const districtD3 = districtPaths.find((node: any) => node.__data__?.properties?.dt_code === 'D3');

    districtD1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 25, clientY: 25 }));
    districtD2.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 40, clientY: 40 }));
    districtD3.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 50, clientY: 50 }));
    districtD1.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 30, clientY: 30 }));
    districtD1.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));

    component.pageConfig = { type: 'communityDashboard' };
    districtD1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    component.pageConfig = { type: 'communityDetails' };
    districtD1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    component.pageConfig = { type: 'stateLed' };
    districtD1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    component.showDetails = false;
    districtD3.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    component.showDetails = true;

    const iconD1 = icons.find((node: any) => node.__data__?.properties?.dt_code === 'D1');
    const iconD2 = icons.find((node: any) => node.__data__?.properties?.dt_code === 'D2');
    const iconD3 = icons.find((node: any) => node.__data__?.properties?.dt_code === 'D3');

    iconD1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 25, clientY: 25 }));
    iconD2.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 40, clientY: 40 }));
    iconD3.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 50, clientY: 50 }));
    iconD1.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 30, clientY: 30 }));
    iconD1.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));

    component.pageConfig = { type: 'communityDashboard' };
    iconD1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    component.pageConfig = { type: 'communityDetails' };
    iconD1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    component.pageConfig = { type: 'stateLed' };
    iconD1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    component.showDetails = false;
    iconD3.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fetchIndicatorSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/community-led-district-improvements/', 'Karnataka', '29', 'District One', 'D1', 'state']);
    expect(router.navigate).toHaveBeenCalledWith(['/community-led-district-improvements/', 'Karnataka', '29', 'District One', 'D1']);
    expect(router.navigate).toHaveBeenCalledWith(['/state-led-district-improvements', 'Karnataka', '29', 'District One', 'D1']);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);

  });

  it('should handle drawMap state-not-found and fetch error paths', async () => {
    setupMapDom();
    component.dataFetchPath = '/states/29/indicator.json';
    component.communityJson = communityJson;
    const errorSpy = spyOn(console, 'error');

    spyOn(window, 'fetch').and.callFake((url: string | URL | Request) => {
      const value = extractUrl(url);
      if (value.includes('/india.json')) {
        return jsonResponse(indiaTopology) as any;
      }
      return jsonResponse(indicatorJson) as any;
    });

    component.selectedState = 'MissingState';
    (component as any).drawMap();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(errorSpy).toHaveBeenCalledWith('State MissingState not found');

    (window.fetch as jasmine.Spy).and.returnValue(Promise.reject('draw-failed') as any);
    component.selectedState = 'Karnataka';
    (component as any).drawMap();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(errorSpy).toHaveBeenCalledWith('Error loading or processing data:', 'draw-failed');
  });

  it('should draw map with missing districts/icon data using fallback defaults', async () => {
    setupMapDom();
    component.dataFetchPath = '/states/29/indicator.json';
    component.communityJson = { result: {} };
    component.selectedState = 'Karnataka';
    component.stateLedMission = 0;
    component.legends = {};

    spyOn(window, 'fetch').and.callFake((url: string | URL | Request) => {
      const value = extractUrl(url);
      if (value.includes('/india.json')) {
        return jsonResponse(indiaTopology) as any;
      }
      return jsonResponse({
        result: {
          overview: { details: [] },
        },
      }) as any;
    });

    (component as any).drawMap();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const districtPaths = Array.from(document.querySelectorAll('.district-path'));
    expect(districtPaths.length).toBe(3);
    expect(document.querySelectorAll('.district-icon').length).toBe(0);
  });

  it('should use selected-detail fallbacks for label and code in district and icon tooltips', async () => {
    setupMapDom();
    component.dataFetchPath = '/states/29/indicator.json';
    component.selectedState = 'Karnataka';
    component.selectedIndicator = undefined as any;
    component.communityJson = { result: { districts: { D1: true } } };

    spyOn(window, 'fetch').and.callFake((url: string | URL | Request) => {
      const value = extractUrl(url);
      if (value.includes('/india.json')) {
        return jsonResponse(indiaTopology) as any;
      }
      return jsonResponse({
        result: {
          districts: {
            D1: {
              label: '',
              type: 'category_1',
              details: [{ value: 12 }],
            },
          },
        },
      }) as any;
    });

    (component as any).drawMap();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const districtD1 = (Array.from(document.querySelectorAll('.district-path')) as any[])
      .find((node: any) => node.__data__?.properties?.dt_code === 'D1');
    const iconD1 = (Array.from(document.querySelectorAll('.district-icon')) as any[])
      .find((node: any) => node.__data__?.properties?.dt_code === 'D1');

    districtD1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 20, clientY: 20 }));
    iconD1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 20, clientY: 20 }));
    expect(document.getElementById('map-tooltip')?.innerHTML).toContain('Unknown District');
  });
});
