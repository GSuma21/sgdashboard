import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Loader } from './loader';
import { LoaderService } from '../../services/loader.service';

describe('LoaderComponent', () => {
  let component: Loader;
  let fixture: ComponentFixture<Loader>;
  let loaderService: LoaderService;
  let loaderElement: DebugElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [Loader]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Loader);
    component = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService);
    loaderElement = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should inject LoaderService', () => {
    expect(component.loader).toBe(loaderService);
  });

  it('should have isLoading$ observable from LoaderService', () => {
    expect(component.loader.isLoading$).toBeDefined();
  });

  it('should hide loader backdrop initially when isLoading$ is false', fakeAsync(() => {
    loaderService.hide();
    fixture.detectChanges();
    tick();

    const backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeNull();
  }));

  it('should show loader backdrop when isLoading$ emits true', fakeAsync(() => {
    loaderService.show();
    fixture.detectChanges();
    tick();

    const backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeTruthy();
  }));

  it('should hide loader backdrop when isLoading$ emits false', fakeAsync(() => {
    loaderService.show();
    fixture.detectChanges();
    tick();

    loaderService.hide();
    fixture.detectChanges();
    tick();

    const backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeNull();
  }));

  it('should display spinner element inside backdrop', fakeAsync(() => {
    loaderService.show();
    fixture.detectChanges();
    tick();

    const spinner = loaderElement.query(By.css('.loader-spinner'));
    expect(spinner).toBeTruthy();
  }));

  it('should have loader-backdrop class on backdrop div', fakeAsync(() => {
    loaderService.show();
    fixture.detectChanges();
    tick();

    const backdrop = loaderElement.query(By.css('div.loader-backdrop'));
    expect(backdrop.nativeElement.classList.contains('loader-backdrop')).toBe(true);
  }));

  it('should have loader-spinner class on spinner div', fakeAsync(() => {
    loaderService.show();
    fixture.detectChanges();
    tick();

    const spinner = loaderElement.query(By.css('div.loader-spinner'));
    expect(spinner.nativeElement.classList.contains('loader-spinner')).toBe(true);
  }));

  it('should use async pipe for subscription to isLoading$', () => {
    const template = fixture.nativeElement.innerHTML;
    expect(template).toContain('async');
  });

  it('should handle multiple show/hide cycles', fakeAsync(() => {
    loaderService.show();
    fixture.detectChanges();
    tick();
    
    let backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeTruthy();

    loaderService.hide();
    fixture.detectChanges();
    tick();
    
    backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeNull();

    loaderService.show();
    fixture.detectChanges();
    tick();
    
    backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeTruthy();
  }));

  it('should have correct selector', () => {
    const metadata = (Loader as any).ɵcmp;
    expect(metadata.selectors[0][0]).toBe('app-loader');
  });

  it('should be a standalone component', () => {
    const metadata = (Loader as any).ɵcmp;
    expect(metadata.standalone).toBe(true);
  });

  it('should import CommonModule', () => {
    const metadata = (Loader as any).ɵcmp;
    expect(metadata.dependencies).toBeDefined();
  });

  it('should not display backdrop when service has not been called', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeNull();
  }));

  it('should handle concurrent show calls with counter', fakeAsync(() => {
    loaderService.show();
    loaderService.show();
    fixture.detectChanges();
    tick();

    let backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeTruthy();

    loaderService.hide();
    fixture.detectChanges();
    tick();

    backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeTruthy();

    loaderService.hide();
    fixture.detectChanges();
    tick();

    backdrop = loaderElement.query(By.css('.loader-backdrop'));
    expect(backdrop).toBeNull();
  }));
});
