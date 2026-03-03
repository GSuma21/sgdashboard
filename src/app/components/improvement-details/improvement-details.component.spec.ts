import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ImprovementDetailsComponent } from './improvement-details.component';
import { LoaderRunnerService } from '../../services/loader-runner.service';

describe('ImprovementDetailsComponent', () => {
  let component: ImprovementDetailsComponent;
  let fixture: ComponentFixture<ImprovementDetailsComponent>;
  let loaderRunnerSpy: jasmine.SpyObj<LoaderRunnerService>;

  beforeEach(async () => {
    loaderRunnerSpy = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunnerSpy.run.and.callFake(async (fn: () => Promise<any>) => fn());

    await TestBed.configureTestingModule({
      imports: [ImprovementDetailsComponent],
      providers: [{ provide: LoaderRunnerService, useValue: loaderRunnerSpy }]
    })
      .overrideComponent(ImprovementDetailsComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ImprovementDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should call fetchPageData', () => {
    const fetchSpy = spyOn(component, 'fetchPageData');

    component.ngOnInit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('loadJson should delegate to d3.json via fetch', async () => {
    const payload = { sections: [] };
    const fetchSpy = spyOn(window, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );

    const result = await (component as any).loadJson('/test.json');

    expect(fetchSpy).toHaveBeenCalled();
    expect(result).toEqual(payload);
  });

  it('fetchPageData should load data and prepare logos on success', fakeAsync(() => {
    const data = {
      sections: [
        {
          type: 'partner-logos',
          partners: [
            { logos: ['a.png', 'b.png'] },
            { logos: ['c.png'] }
          ]
        }
      ]
    };
    const prepareSpy = spyOn(component, 'prepareLogosForScrolling').and.callThrough();
    const loadSpy = spyOn<any>(component, 'loadJson').and.returnValue(Promise.resolve(data));

    component.fetchPageData();
    flushMicrotasks();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
    expect(component.pageData).toEqual(data as any);
    expect(prepareSpy).toHaveBeenCalled();
    expect(component.pageData.allLogos).toEqual(['a.png', 'b.png', 'c.png']);
  }));

  it('fetchPageData should handle load errors', fakeAsync(() => {
    const error = new Error('load failed');
    spyOn<any>(component, 'loadJson').and.returnValue(Promise.reject(error));
    const errorSpy = spyOn(console, 'error');

    component.fetchPageData();
    flushMicrotasks();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('Error loading page data:', error);
  }));

  it('prepareLogosForScrolling should flatten logos for partner-logos section', () => {
    component.pageData = {
      sections: [
        { type: 'dashboard-main', partners: [{ logos: ['ignore.png'] }] },
        {
          type: 'partner-logos',
          partners: [
            { logos: ['p1.png'] },
            { logos: ['p2.png', 'p3.png'] }
          ]
        }
      ]
    };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toEqual(['p1.png', 'p2.png', 'p3.png']);
  });

  it('prepareLogosForScrolling should not set allLogos when section is missing', () => {
    component.pageData = {
      sections: [{ type: 'carousel', partners: [{ logos: ['x.png'] }] }]
    };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });

  it('prepareLogosForScrolling should not set allLogos when partners are missing', () => {
    component.pageData = {
      sections: [{ type: 'partner-logos' }]
    };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });
});
