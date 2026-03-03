import { ChangeDetectorRef, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NetworkHealth } from './network-health';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { NETWORK_HEALTH_PAGE } from '../../../constants/urlConstants';

describe('NetworkHealth', () => {
  let component: NetworkHealth;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let breakpointObserver: jasmine.SpyObj<BreakpointObserver>;
  let loaderRunner: jasmine.SpyObj<LoaderRunnerService>;

  beforeEach(() => {
    cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    breakpointObserver = jasmine.createSpyObj<BreakpointObserver>('BreakpointObserver', ['isMatched']);
    loaderRunner = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunner.run.and.callFake(<T>(runner: () => Promise<T>) => runner());

    component = new NetworkHealth(cdr, dialog, breakpointObserver, loaderRunner);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call fetchPageData on ngOnInit', () => {
    const fetchSpy = spyOn(component, 'fetchPageData').and.returnValue(Promise.resolve());

    component.ngOnInit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch page data, prepare logos, and trigger change detection', async () => {
    const data = {
      sections: [
        {
          type: 'partner-logos',
          partners: [{ logos: ['logo-1', 'logo-2'] }, { logos: ['logo-3'] }],
        },
      ],
    };
    const fetchSpy = spyOn(window, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ) as any,
    );
    const prepareSpy = spyOn(component, 'prepareLogosForScrolling').and.callThrough();

    await component.fetchPageData();

    expect(fetchSpy).toHaveBeenCalledWith(`${component.baseUrl}/${NETWORK_HEALTH_PAGE}`, undefined);
    expect(loaderRunner.run).toHaveBeenCalled();
    expect(component.pageData.sections).toEqual(data.sections);
    expect(component.pageData.allLogos).toEqual(['logo-1', 'logo-2', 'logo-3']);
    expect(prepareSpy).toHaveBeenCalled();
    expect(cdr.detectChanges).toHaveBeenCalled();
  });

  it('should handle fetchPageData errors', async () => {
    spyOn(window, 'fetch').and.returnValue(Promise.reject('network-health-failed') as any);
    const consoleSpy = spyOn(console, 'error');

    await component.fetchPageData();

    expect(loaderRunner.run).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error loading page data:', 'network-health-failed');
  });

  it('should prepare logos for scrolling when partner-logos section exists', () => {
    component.pageData = {
      sections: [
        { type: 'hero' },
        {
          type: 'partner-logos',
          partners: [{ logos: ['a', 'b'] }, { logos: ['c'] }],
        },
      ],
    };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toEqual(['a', 'b', 'c']);
  });

  it('should skip logo preparation when partner-logos section is missing', () => {
    component.pageData = { sections: [{ type: 'hero' }] };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });

  it('should skip logo preparation when partners are missing', () => {
    component.pageData = { sections: [{ type: 'partner-logos' }] };

    component.prepareLogosForScrolling();

    expect(component.pageData.allLogos).toBeUndefined();
  });

  it('should log an error and not open dialog when glossary template is missing', () => {
    component.glossaryTemplate = undefined as unknown as TemplateRef<any>;
    const consoleSpy = spyOn(console, 'error');

    component.openGlossary();

    expect(consoleSpy).toHaveBeenCalledWith('Glossary template not found');
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should open glossary dialog with mobile config', () => {
    component.glossaryTemplate = {} as TemplateRef<any>;
    breakpointObserver.isMatched.and.callFake((query: string) => query === Breakpoints.Handset);

    component.openGlossary();

    expect(dialog.open).toHaveBeenCalledWith(component.glossaryTemplate, {
      width: '100%',
      maxWidth: '1000px',
      position: { top: '38%', right: '0%' },
      panelClass: 'glossary-side-dialog',
      backdropClass: 'glossary-backdrop',
    });
  });

  it('should open glossary dialog with tablet config', () => {
    component.glossaryTemplate = {} as TemplateRef<any>;
    breakpointObserver.isMatched.and.callFake((query: string) => query === Breakpoints.Tablet);

    component.openGlossary();

    expect(dialog.open).toHaveBeenCalledWith(component.glossaryTemplate, {
      width: '600px',
      maxWidth: '1000px',
      position: { top: '18%', right: '8%' },
      panelClass: 'glossary-side-dialog',
      backdropClass: 'glossary-backdrop',
    });
  });

  it('should open glossary dialog with desktop config', () => {
    component.glossaryTemplate = {} as TemplateRef<any>;
    breakpointObserver.isMatched.and.returnValue(false);

    component.openGlossary();

    expect(dialog.open).toHaveBeenCalledWith(component.glossaryTemplate, {
      width: '600px',
      maxWidth: '1000px',
      position: { top: '12%', right: '10%' },
      panelClass: 'glossary-side-dialog',
      backdropClass: 'glossary-backdrop',
    });
  });
});
