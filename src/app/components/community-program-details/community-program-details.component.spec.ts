import { COMMUNITY_DASHBOARD_PAGE } from '../../../constants/urlConstants';
import { environment } from '../../../../environments/environment';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { CommunityProgramDetailsComponent } from './community-program-details.component';

describe('CommunityProgramDetailsComponent', () => {
  let component: CommunityProgramDetailsComponent;
  let loaderRunnerSpy: jasmine.SpyObj<LoaderRunnerService>;

  beforeEach(() => {
    loaderRunnerSpy = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunnerSpy.run.and.callFake(async <T>(runner: () => Promise<T>) => runner());
    component = new CommunityProgramDetailsComponent(loaderRunnerSpy);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call fetchPageData on ngOnInit', () => {
    const fetchSpy = spyOn(component, 'fetchPageData').and.returnValue(Promise.resolve());

    component.ngOnInit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch page data and prepare logos for scrolling', async () => {
    const data = {
      sections: [
        {
          type: 'partner-logos',
          partners: [{ logos: ['logo-1', 'logo-2'] }, { logos: ['logo-3'] }]
        }
      ]
    };
    const fetchSpy = spyOn(window, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      ) as any
    );
    const prepareSpy = spyOn(component, 'prepareLogosForScrolling').and.callThrough();

    await component.fetchPageData();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledWith(
      `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${COMMUNITY_DASHBOARD_PAGE}`,
      undefined
    );
    expect(component.pageData.sections).toEqual(data.sections);
    expect(component.pageData.allLogos).toEqual(['logo-1', 'logo-2', 'logo-3']);
    expect(prepareSpy).toHaveBeenCalled();
  });

  it('should handle fetchPageData errors', async () => {
    const error = new Error('community-page-failed');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(error) as any);
    const consoleSpy = spyOn(console, 'error');

    await component.fetchPageData();

    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error loading page data:', error);
  });

  it('should prepare logos for scrolling when partner logos section exists', () => {
    component.pageData = {
      sections: [
        { type: 'hero' },
        {
          type: 'partner-logos',
          partners: [{ logos: ['a', 'b'] }, { logos: ['c'] }]
        }
      ]
    };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toEqual(['a', 'b', 'c']);
  });

  it('should skip logo preparation when partner logos section is missing', () => {
    component.pageData = { sections: [{ type: 'hero' }] };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });

  it('should skip logo preparation when partners are missing', () => {
    component.pageData = { sections: [{ type: 'partner-logos' }] };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });
});
