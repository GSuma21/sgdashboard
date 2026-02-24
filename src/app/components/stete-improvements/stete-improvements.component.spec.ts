import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { LoaderRunnerService } from '../../services/loader-runner.service';

import { StateImprovementsComponent } from './stete-improvements.component';

describe('StateImprovementsComponent', () => {
  let component: StateImprovementsComponent;
  let fixture: ComponentFixture<StateImprovementsComponent>;
  let loaderRunnerSpy: jasmine.SpyObj<LoaderRunnerService>;
  let paramMapSubject: BehaviorSubject<any>;

  const pageDataMock = {
    sections: [
      {
        type: 'partner-logos',
        partners: [{ logos: ['l1', 'l2'] }, { logos: ['l3'] }]
      }
    ]
  };
  const programsMock = [{ name_of_the_program: 'Program 1' }];

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ state: 'karnataka', code: 'KA' }));
    loaderRunnerSpy = jasmine.createSpyObj('LoaderRunnerService', ['run']);
    loaderRunnerSpy.run.and.callFake(async (work: () => Promise<any>) => work());

    spyOn(window, 'fetch').and.callFake(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('state-program.json') || url.includes('WLC.json')) {
        return new Response(JSON.stringify(programsMock), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(pageDataMock), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    TestBed.overrideComponent(StateImprovementsComponent, {
      set: { template: '<div></div>' }
    });

    await TestBed.configureTestingModule({
      imports: [StateImprovementsComponent],
      providers: [
        { provide: LoaderRunnerService, useValue: loaderRunnerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ type: 'stateDashboard', jsonPath: 'states/KA/page.json' }),
            paramMap: paramMapSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StateImprovementsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize pageConfig from route data in constructor', () => {
    expect(component.pageConfig.type).toBe('stateDashboard');
    expect(component.pageConfig.jsonPath).toBe('states/KA/page.json');
  });

  it('should set state params and call loaders on init', () => {
    const fetchPageDataSpy = spyOn(component, 'fetchPageData');
    const getProgramsListSpy = spyOn(component, 'getProgramsList');

    component.ngOnInit();

    expect(component.stateName).toBe('karnataka');
    expect(component.stateCode).toBe('KA');
    expect(fetchPageDataSpy).toHaveBeenCalled();
    expect(getProgramsListSpy).toHaveBeenCalled();
  });

  it('should update params when route params change', () => {
    component.ngOnInit();
    paramMapSubject.next(convertToParamMap({ state: 'kerala', code: 'KL' }));

    expect(component.stateName).toBe('kerala');
    expect(component.stateCode).toBe('KL');
  });

  it('should not fetch page data when state name is missing', async () => {
    const errorSpy = spyOn(console, 'error');
    component.stateName = '';

    await component.fetchPageData();

    expect(errorSpy).toHaveBeenCalledWith('State name is missing from the route.');
    expect(loaderRunnerSpy.run).not.toHaveBeenCalled();
  });

  it('should fetch page data and prepare logos when state exists', async () => {
    component.stateName = 'karnataka';
    component.pageConfig = { jsonPath: 'states/KA/page.json' };
    const prepareSpy = spyOn(component, 'prepareLogosForScrolling').and.callThrough();

    await component.fetchPageData();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(component.pageData.sections).toEqual(pageDataMock.sections);
    expect(prepareSpy).toHaveBeenCalled();
    expect(component.pageData.allLogos).toEqual(['l1', 'l2', 'l3']);
  });

  it('should handle page data fetch error', async () => {
    const errorSpy = spyOn(console, 'error');
    (window.fetch as jasmine.Spy).and.returnValue(Promise.reject(new Error('load error')));
    component.stateName = 'karnataka';
    component.pageConfig = { jsonPath: 'states/KA/page.json' };

    await component.fetchPageData();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should fetch state programs list for default type', async () => {
    component.stateCode = 'KA';
    component.pageConfig = { type: 'stateDashboard' };

    component.getProgramsList();
    await new Promise((resolve) => setTimeout(resolve, 25));

    const calls = (window.fetch as jasmine.Spy).calls.allArgs().map((args) => String(args[0]));
    expect(calls.some((url) => url.includes('/states/KA/state-program.json'))).toBeTrue();
    expect(component.programsList).toEqual(programsMock);
  });

  it('should fetch WLC programs list for community type', async () => {
    component.stateCode = 'KA';
    component.pageConfig = { type: 'communityDetails' };

    component.getProgramsList();
    await new Promise((resolve) => setTimeout(resolve, 25));

    const calls = (window.fetch as jasmine.Spy).calls.allArgs().map((args) => String(args[0]));
    expect(calls.some((url) => url.includes('/states/KA/WLC.json'))).toBeTrue();
  });

  it('should handle programs list fetch error', async () => {
    const errorSpy = spyOn(console, 'error');
    (window.fetch as jasmine.Spy).and.returnValue(Promise.reject(new Error('programs error')));

    component.getProgramsList();
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should scroll to programs section when element exists', () => {
    const scrollIntoViewSpy = jasmine.createSpy('scrollIntoView');
    component.programsSection = {
      nativeElement: { scrollIntoView: scrollIntoViewSpy }
    } as any;

    component.scrollToPrograms();

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('should not throw when programs section is missing', () => {
    component.programsSection = undefined as any;
    expect(() => component.scrollToPrograms()).not.toThrow();
  });

  it('should prepare logos for scrolling from partner section', () => {
    component.pageData = pageDataMock;

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toEqual(['l1', 'l2', 'l3']);
  });

  it('should not set allLogos when partner section is missing', () => {
    component.pageData = { sections: [{ type: 'other' }] };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });

  it('should set stateLedMission from metrics data', () => {
    component.getMetricsData([
      { identifier: 'abc', value: 10 },
      { identifier: 'slm', value: 42 }
    ]);

    expect(component.stateLedMission).toBe(42);
  });
});
