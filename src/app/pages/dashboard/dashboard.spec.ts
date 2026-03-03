import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { DASHBOARD_PAGE } from '../../../constants/urlConstants';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { DashboardComponent } from './dashboard';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loaderRunnerSpy: jasmine.SpyObj<LoaderRunnerService>;

  const asJsonResponse = (data: unknown, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    loaderRunnerSpy = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunnerSpy.run.and.callFake((work: any) => work());

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: LoaderRunnerService, useValue: loaderRunnerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call fetchPageData on ngOnInit', () => {
    const fetchSpy = spyOn(component, 'fetchPageData');

    component.ngOnInit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch page data and prepare logos', async () => {
    const payload = {
      sections: [
        { type: 'dashboard-main' },
        {
          type: 'partner-logos',
          partners: [
            { logos: ['a.svg', 'b.svg'] },
            { logos: ['c.svg'] }
          ]
        }
      ]
    };
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(DASHBOARD_PAGE)) {
        return Promise.resolve(asJsonResponse(payload));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await component.fetchPageData();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(component.pageData.sections).toEqual(payload.sections);
    expect(component.pageData.allLogos).toEqual(['a.svg', 'b.svg', 'c.svg']);
  });

  it('should handle fetch page data error', async () => {
    const err = new Error('dashboard fetch failed');
    spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(err));

    await component.fetchPageData();

    expect(console.error).toHaveBeenCalledWith('Error loading page data:', err);
  });

  it('should navigate to community details page', () => {
    component.openCommunityDetails();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/community-led-improvements']);
  });

  it('should flatten partner logos when partner section exists', () => {
    component.pageData = {
      sections: [
        {
          type: 'partner-logos',
          partners: [
            { logos: ['l1.svg'] },
            { logos: ['l2.svg', 'l3.svg'] }
          ]
        }
      ]
    };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toEqual(['l1.svg', 'l2.svg', 'l3.svg']);
  });

  it('should keep allLogos undefined when partner section does not exist', () => {
    component.pageData = {
      sections: [{ type: 'dashboard-main' }]
    };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });

  it('should keep allLogos undefined when partner section has no partners array', () => {
    component.pageData = {
      sections: [{ type: 'partner-logos' }]
    };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });

  it('should navigate to selected state view', () => {
    component.onStateSelected('Karnataka');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/state-view', 'Karnataka']);
  });
});
