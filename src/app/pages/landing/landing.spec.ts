import { ChangeDetectorRef } from '@angular/core';
import { LandingComponent } from './landing';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { environment } from '../../../../environments/environment';
import { LANDING_PAGE } from '../../../constants/urlConstants';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;
  let loaderRunner: jasmine.SpyObj<LoaderRunnerService>;

  beforeEach(() => {
    cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
    loaderRunner = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunner.run.and.callFake(<T>(runner: () => Promise<T>) => runner());

    component = new LandingComponent(cdr, loaderRunner);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call fetchPageData on ngOnInit', () => {
    const fetchSpy = spyOn(component, 'fetchPageData').and.returnValue(Promise.resolve());

    component.ngOnInit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should set global map invisible in ngAfterViewInit', () => {
    jasmine.clock().install();
    component.isGlobalMapVisible = true;

    component.ngAfterViewInit();
    jasmine.clock().tick(1199);

    expect(component.isGlobalMapVisible).toBeTrue();

    jasmine.clock().tick(1200);

    expect(component.isGlobalMapVisible).toBeFalse();
    jasmine.clock().uninstall();
  });

  it('should fetch page data and trigger change detection', async () => {
    const data = [{ type: 'hero' }, { type: 'cta' }];
    const fetchSpy = spyOn(window, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ) as any,
    );

    await component.fetchPageData();

    expect(fetchSpy).toHaveBeenCalledWith(
      `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${LANDING_PAGE}`,
      undefined,
    );
    expect(loaderRunner.run).toHaveBeenCalled();
    expect(component.pageData).toEqual(data);
    expect(cdr.detectChanges).toHaveBeenCalled();
  });

  it('should handle fetchPageData errors', async () => {
    spyOn(window, 'fetch').and.returnValue(Promise.reject('landing-failed') as any);
    const consoleSpy = spyOn(console, 'error');

    await component.fetchPageData();

    expect(loaderRunner.run).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error loading page data:', 'landing-failed');
  });
});
