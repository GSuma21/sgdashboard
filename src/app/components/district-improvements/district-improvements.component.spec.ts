import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { DistrictImprovementsComponent } from './district-improvements.component';

describe('DistrictImprovementsComponent', () => {
  let component: DistrictImprovementsComponent;
  let loaderRunnerSpy: jasmine.SpyObj<LoaderRunnerService>;
  let routeStub: ActivatedRoute;

  const baseUrl = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`;

  function setupRoute(
    params: Record<string, string | null>,
    data: Record<string, unknown> = { type: 'leadersDetails' }
  ): ActivatedRoute {
    return {
      snapshot: {
        paramMap: {
          get: (key: string) => params[key] ?? null
        },
        data
      }
    } as unknown as ActivatedRoute;
  }

  function createFetchResponse(payload: unknown): Response {
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function mockFetchByUrl(routes: Record<string, unknown | Error>) {
    return spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (!(url in routes)) {
        return Promise.reject(new Error(`Unhandled URL in test: ${url}`));
      }

      const value = routes[url];
      if (value instanceof Error) {
        return Promise.reject(value);
      }

      return Promise.resolve(createFetchResponse(value));
    });
  }

  beforeEach(() => {
    loaderRunnerSpy = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunnerSpy.run.and.callFake(async <T>(runner: () => Promise<T>) => runner());

    routeStub = setupRoute({
      district: 'Bengaluru',
      'dt-code': 'D001',
      state: 'Karnataka',
      'st-code': 'S001',
      extra: 'dashboard'
    });

    component = new DistrictImprovementsComponent(routeStub, loaderRunnerSpy);
    component.districtCode = 'D001';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize community flow on ngOnInit when page config type is communityDetails', async () => {
    routeStub = setupRoute(
      {
        district: 'Bengaluru',
        'dt-code': 'D001',
        state: 'Karnataka',
        'st-code': 'S001',
        extra: 'dashboard'
      },
      { type: 'communityDetails' }
    );
    component = new DistrictImprovementsComponent(routeStub, loaderRunnerSpy);
    const improvementsSpy = spyOn(component, 'getImprovementsData').and.returnValue(Promise.resolve());
    const communityMetricsSpy = spyOn(component, 'getCommunityMetrics').and.returnValue(Promise.resolve(undefined));

    component.ngOnInit();
    await Promise.resolve();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(component.district).toBe('Bengaluru');
    expect(component.districtCode).toBe('D001');
    expect(component.stateName).toBe('Karnataka');
    expect(component.stateCode).toBe('S001');
    expect(component.dashboard).toBe('dashboard');
    expect(component.pageConfig).toEqual({ type: 'communityDetails' });
    expect(component.enableCommunityButton).toBeFalse();
    expect(component.isCommunityFlow).toBeTrue();
    expect(communityMetricsSpy).not.toHaveBeenCalled();
    expect(improvementsSpy).toHaveBeenCalled();
  });

  it('should initialize leaders flow on ngOnInit and call community metrics', async () => {
    const improvementsSpy = spyOn(component, 'getImprovementsData').and.returnValue(Promise.resolve());
    const communityMetricsSpy = spyOn(component, 'getCommunityMetrics').and.returnValue(Promise.resolve(undefined));

    component.ngOnInit();
    await Promise.resolve();

    expect(component.pageConfig).toEqual({ type: 'leadersDetails' });
    expect(component.isCommunityFlow).toBeFalse();
    expect(communityMetricsSpy).toHaveBeenCalled();
    expect(improvementsSpy).toHaveBeenCalled();
  });

  it('should set empty string defaults from route params when ngOnInit params are missing', async () => {
    routeStub = setupRoute(
      {
        district: null,
        'dt-code': null,
        state: null,
        'st-code': null,
        extra: null
      },
      { type: 'leadersDetails' }
    );
    component = new DistrictImprovementsComponent(routeStub, loaderRunnerSpy);
    const improvementsSpy = spyOn(component, 'getImprovementsData').and.returnValue(Promise.resolve());
    const communityMetricsSpy = spyOn(component, 'getCommunityMetrics').and.returnValue(Promise.resolve(undefined));

    component.ngOnInit();
    await Promise.resolve();

    expect(component.district).toBe('');
    expect(component.districtCode).toBe('');
    expect(component.stateName).toBe('');
    expect(component.stateCode).toBe('');
    expect(component.dashboard).toBeNull();
    expect(communityMetricsSpy).toHaveBeenCalled();
    expect(improvementsSpy).toHaveBeenCalled();
  });

  it('should load improvements data in leaders flow and call programs list', async () => {
    const metricsUrl = `${baseUrl}/districts/D001/metrics.json`;
    const pieUrl = `${baseUrl}/districts/D001/pie-chart.json`;
    const lineUrl = `${baseUrl}/districts/D001/line-chart.json`;
    const programsSpy = spyOn(component, 'getProgramsList').and.returnValue(Promise.resolve());

    mockFetchByUrl({
      [metricsUrl]: { metrics: [{ label: 'Metric A', identifier: 1 }] },
      [pieUrl]: { data: [{ key: 'A' }] },
      [lineUrl]: { data: [{ year: 2024 }] }
    });

    await component.getImprovementsData();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(component.metrics).toEqual([{ label: 'Metric A', identifier: 1 }]);
    expect(component.pieChart).toEqual([{ key: 'A' }]);
    expect(component.lineChart).toEqual([{ year: 2024 }]);
    expect(programsSpy).toHaveBeenCalled();
  });

  it('should use community file paths in getImprovementsData when community flow is enabled', async () => {
    component.isCommunityFlow = true;
    const metricsUrl = `${baseUrl}/districts/D001/community-metrics.json`;
    const pieUrl = `${baseUrl}/districts/D001/community-pie-chart.json`;
    const lineUrl = `${baseUrl}/districts/D001/line-chart.json`;
    const programsSpy = spyOn(component, 'getProgramsList').and.returnValue(Promise.resolve());
    const fetchSpy = mockFetchByUrl({
      [metricsUrl]: { metrics: [] },
      [pieUrl]: { data: [] },
      [lineUrl]: { data: [] }
    });

    await component.getImprovementsData();

    expect(fetchSpy).toHaveBeenCalledWith(metricsUrl, undefined);
    expect(fetchSpy).toHaveBeenCalledWith(pieUrl, undefined);
    expect(fetchSpy).toHaveBeenCalledWith(lineUrl, undefined);
    expect(programsSpy).toHaveBeenCalled();
  });

  it('should fallback pieChart and lineChart to empty arrays when individual requests fail', async () => {
    const metricsUrl = `${baseUrl}/districts/D001/metrics.json`;
    const pieUrl = `${baseUrl}/districts/D001/pie-chart.json`;
    const lineUrl = `${baseUrl}/districts/D001/line-chart.json`;
    const programsSpy = spyOn(component, 'getProgramsList').and.returnValue(Promise.resolve());

    mockFetchByUrl({
      [metricsUrl]: { metrics: [{ label: 'Metric A', identifier: 1 }] },
      [pieUrl]: new Error('pie-failed'),
      [lineUrl]: new Error('line-failed')
    });

    await component.getImprovementsData();

    expect(component.metrics).toEqual([{ label: 'Metric A', identifier: 1 }]);
    expect(component.pieChart).toEqual([]);
    expect(component.lineChart).toEqual([]);
    expect(programsSpy).toHaveBeenCalled();
  });

  it('should fallback to empty arrays when metrics, pie or line payload fields are missing', async () => {
    const metricsUrl = `${baseUrl}/districts/D001/metrics.json`;
    const pieUrl = `${baseUrl}/districts/D001/pie-chart.json`;
    const lineUrl = `${baseUrl}/districts/D001/line-chart.json`;
    const programsSpy = spyOn(component, 'getProgramsList').and.returnValue(Promise.resolve());

    mockFetchByUrl({
      [metricsUrl]: {},
      [pieUrl]: {},
      [lineUrl]: {}
    });

    await component.getImprovementsData();

    expect(component.metrics).toEqual([]);
    expect(component.pieChart).toEqual([]);
    expect(component.lineChart).toEqual([]);
    expect(programsSpy).toHaveBeenCalled();
  });

  it('should reset charts and metrics when primary improvements request fails', async () => {
    const metricsUrl = `${baseUrl}/districts/D001/metrics.json`;
    const programsSpy = spyOn(component, 'getProgramsList').and.returnValue(Promise.resolve());
    const errorSpy = spyOn(console, 'error');

    mockFetchByUrl({
      [metricsUrl]: new Error('metrics-failed')
    });

    await component.getImprovementsData();

    expect(errorSpy).toHaveBeenCalledWith('Error loading improvements data:', jasmine.any(Error));
    expect(component.metrics).toEqual([]);
    expect(component.pieChart).toEqual([]);
    expect(component.lineChart).toEqual([]);
    expect(programsSpy).toHaveBeenCalled();
  });

  it('should load programs list with SLC path in leaders flow and fetch page data', async () => {
    component.isCommunityFlow = false;
    const programsUrl = `${baseUrl}/districts/D001/SLC.json`;
    const fetchPageSpy = spyOn(component, 'fetchPageData').and.returnValue(Promise.resolve());

    mockFetchByUrl({
      [programsUrl]: [{ program: 'One' }]
    });

    await component.getProgramsList();

    expect(component.programsList).toEqual([{ program: 'One' }]);
    expect(fetchPageSpy).toHaveBeenCalled();
  });

  it('should load programs list with WLC path in community flow', async () => {
    component.isCommunityFlow = true;
    const programsUrl = `${baseUrl}/districts/D001/WLC.json`;
    const fetchPageSpy = spyOn(component, 'fetchPageData').and.returnValue(Promise.resolve());
    const fetchSpy = mockFetchByUrl({
      [programsUrl]: [{ program: 'Community Program' }]
    });

    await component.getProgramsList();

    expect(fetchSpy).toHaveBeenCalledWith(programsUrl, undefined);
    expect(component.programsList).toEqual([{ program: 'Community Program' }]);
    expect(fetchPageSpy).toHaveBeenCalled();
  });

  it('should handle programs list errors and still fetch page data', async () => {
    const programsUrl = `${baseUrl}/districts/D001/SLC.json`;
    const fetchPageSpy = spyOn(component, 'fetchPageData').and.returnValue(Promise.resolve());
    const errorSpy = spyOn(console, 'error');

    mockFetchByUrl({
      [programsUrl]: new Error('programs-failed')
    });

    await component.getProgramsList();

    expect(errorSpy).toHaveBeenCalledWith('Error loading programs list:', jasmine.any(Error));
    expect(component.programsList).toEqual([]);
    expect(fetchPageSpy).toHaveBeenCalled();
  });

  it('should map indicators and pie data in fetchPageData for leaders flow', async () => {
    component.pageConfig = { type: 'leadersDetails' };
    component.metrics = [
      { label: 'Schools driving improvements', identifier: 1, value: 10 },
      { label: 'Ideas generated', identifier: 2, value: 5 }
    ];
    component.pieChart = [{ label: 'Slice A', value: 40 }];
    component.isCommunityFlow = false;

    mockFetchByUrl({
      '/assets/leaders-improvement-district-details.json': [
        { type: 'data-indicators', indicators: [] },
        { type: 'pie-chart', data: [] },
        { type: 'other' }
      ]
    });

    await component.fetchPageData();

    expect(component.pageData[0].indicators[0].icon).toBe('assets/icons/schools_driving_improvements.png');
    expect(component.pageData[0].indicators[1].icon).toBe('assets/icons/ideas_generated.svg');
    expect(component.pageData[1].data).toEqual(component.pieChart);
  });

  it('should map indicators using metrics mapping in fetchPageData for community flow', async () => {
    component.pageConfig = { type: 'communityDetails' };
    component.isCommunityFlow = true;
    component.metrics = [
      { label: 'With mapping', identifier: 1, value: 2 },
      { label: 'Without mapping', identifier: 100, value: 1 }
    ];
    component.pieChart = [];

    mockFetchByUrl({
      '/assets/community-led-improvement-district-details.json': [
        { type: 'data-indicators', indicators: [] },
        { type: 'pie-chart', data: [] }
      ]
    });

    await component.fetchPageData();

    expect(component.pageData[0].indicators[0].icon).toBe('assets/icons/community_leaders.svg');
    expect(component.pageData[0].indicators[1].icon).toBe('');
  });

  it('should handle fetchPageData errors', async () => {
    component.pageConfig = { type: 'leadersDetails' };
    const errorSpy = spyOn(console, 'error');

    mockFetchByUrl({
      '/assets/leaders-improvement-district-details.json': new Error('page-config-failed')
    });

    await component.fetchPageData();

    expect(errorSpy).toHaveBeenCalledWith('Error loading page config:', jasmine.any(Error));
  });

  it('should load community metrics and enable community button on success', async () => {
    const communityMetricsUrl = `${baseUrl}/districts/D001/community-metrics.json`;
    mockFetchByUrl({
      [communityMetricsUrl]: [{ label: 'Metric', value: 1 }]
    });

    const response = await component.getCommunityMetrics();

    expect(component.enableCommunityButton).toBeTrue();
    expect(response).toEqual([{ label: 'Metric', value: 1 }]);
  });

  it('should disable community button when community metrics request fails', async () => {
    const communityMetricsUrl = `${baseUrl}/districts/D001/community-metrics.json`;
    const errorSpy = spyOn(console, 'error');

    mockFetchByUrl({
      [communityMetricsUrl]: new Error('community-metrics-failed')
    });

    const response = await component.getCommunityMetrics();

    expect(errorSpy).toHaveBeenCalledWith('Error loading community metrics:', jasmine.any(Error));
    expect(component.enableCommunityButton).toBeFalse();
    expect(response).toBeUndefined();
  });
});
