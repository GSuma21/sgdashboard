import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MetricsListComponent } from './metrics-list';

describe('MetricsListComponent', () => {
  let component: MetricsListComponent;
  let fixture: ComponentFixture<MetricsListComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MetricsListComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ params: { state: 'KA', code: 'BLR' } }),
          },
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricsListComponent);
    component = fixture.componentInstance;
    component.path = '/district/{code}/metrics.json';
    component.replaceCode = 'B001';
    component.data = [
      {
        identifier: 'slm',
        icon: 'icon-1.svg',
        label: 'Schools',
        description: 'School metrics',
        linkText: 'View schools',
      },
      {
        identifier: 'clm',
        icon: 'icon-2.svg',
        label: 'Communities',
        description: 'Community metrics',
        linkText: 'View communities',
      },
      {
        identifier: 'other',
        icon: 'icon-3.svg',
        label: 'Other',
        description: 'Other metrics',
        linkText: 'View details',
      },
    ];
  });

  it('should create and read route params from ActivatedRoute', () => {
    expect(component).toBeTruthy();
    expect(component.paramsData).toEqual({ state: 'KA', code: 'BLR' });
  });

  it('should set fetch path with replaceCode and call fetchData on ngOnInit', () => {
    const fetchDataSpy = spyOn(component, 'fetchData');

    component.ngOnInit();

    expect(component.dataFetchPath).toBe('/district/B001/metrics.json');
    expect(fetchDataSpy).toHaveBeenCalled();
  });

  it('should update finalData and render disabled class when value is zero', () => {
    component.updateData([
      { identifier: 'slm', value: 10 },
      { identifier: 'clm', value: 0 },
    ]);
    fixture.detectChanges();

    expect(component.finalData).toEqual([
      jasmine.objectContaining({ identifier: 'slm', value: 10 }),
      jasmine.objectContaining({ identifier: 'clm', value: 0 }),
      jasmine.objectContaining({ identifier: 'other', value: 0 }),
    ]);

    const host = fixture.nativeElement as HTMLElement;
    const cards = host.querySelectorAll('.metrics-card');
    const links = host.querySelectorAll('.link');
    expect(cards.length).toBe(3);
    expect(links[0].textContent?.trim()).toBe('View schools');
    expect(links[1].classList.contains('disabled-card')).toBeTrue();
    expect(links[0].classList.contains('disabled-card')).toBeFalse();
  });

  it('should set fetch path directly when replaceCode is not provided', fakeAsync(() => {
    const fetchSpy = spyOn(window, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(JSON.stringify({ metrics: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      ) as Promise<Response>
    );
    component.path = '/state/metrics.json';
    component.replaceCode = undefined;

    component.ngOnInit();
    tick();
    flushMicrotasks();

    expect(component.dataFetchPath).toBe('/state/metrics.json');
    const requestArg = fetchSpy.calls.mostRecent().args[0] as RequestInfo | URL;
    const requestUrl =
      typeof requestArg === 'string'
        ? requestArg
        : requestArg instanceof URL
          ? requestArg.toString()
          : requestArg.url;
    expect(requestUrl).toContain(`${component.baseUrl}/state/metrics.json`);
  }));

  it('should log error when fetchData fails', fakeAsync(() => {
    spyOn(window, 'fetch').and.returnValue(Promise.reject(new Error('network')) as Promise<Response>);
    const errorSpy = spyOn(console, 'error');

    component.dataFetchPath = '/broken.json';
    component.fetchData();
    tick();
    flushMicrotasks();

    expect(errorSpy).toHaveBeenCalled();
  }));

  it('should emit scroll event for slm when value is non-zero', () => {
    const scrollEmitSpy = spyOn(component.scrollToProgramsEvent, 'emit');

    component.navigateToLocation({ identifier: 'slm', value: 3 });

    expect(scrollEmitSpy).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate for clm when value is non-zero', () => {
    component.navigateToLocation({ identifier: 'clm', value: 2 });

    expect(router.navigate).toHaveBeenCalledWith(['/community-view', 'KA', 'BLR', 'dashboard']);
  });

  it('should scroll for non-slm/clm item when value is non-zero', () => {
    const scrollBySpy = spyOn(window, 'scrollBy');

    component.navigateToLocation({ identifier: 'other', value: 1 });

    expect(scrollBySpy).toHaveBeenCalled();
    const options = scrollBySpy.calls.mostRecent().args[0] as ScrollToOptions;
    expect(options.top).toBe(300);
    expect(options.left).toBe(0);
    expect(options.behavior).toBe('smooth');
  });

  it('should do nothing when item value is zero', () => {
    const scrollEmitSpy = spyOn(component.scrollToProgramsEvent, 'emit');
    const scrollBySpy = spyOn(window, 'scrollBy');

    component.navigateToLocation({ identifier: 'slm', value: 0 });
    component.navigateToLocation({ identifier: 'clm', value: 0 });
    component.navigateToLocation({ identifier: 'other', value: 0 });

    expect(scrollEmitSpy).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(scrollBySpy).not.toHaveBeenCalled();
  });
});
