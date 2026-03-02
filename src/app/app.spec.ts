import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { AppComponent } from './app';
import { ThemeService } from './core/services/theme';

describe('AppComponent', () => {
  let routerEvents$: Subject<any>;
  let routerMock: { url: string; events: Subject<any> };
  let themeSignal: ReturnType<typeof signal<string>>;
  let themeServiceMock: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    routerEvents$ = new Subject<any>();
    routerMock = {
      url: '/',
      events: routerEvents$,
    };

    themeSignal = signal('light');
    themeServiceMock = jasmine.createSpyObj<ThemeService>('ThemeService', ['getTheme', 'setTheme']);
    themeServiceMock.getTheme.and.callFake(() => themeSignal.asReadonly());
    themeServiceMock.setTheme.and.callFake((theme: string) => {
      themeSignal.set(theme);
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    })
      .overrideComponent(AppComponent, {
        set: {
          template: '<div>app-test</div>',
        },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
  });

  it('should apply theme class from effect and react to theme changes', () => {
    TestBed.createComponent(AppComponent);
    TestBed.flushEffects();

    expect(document.documentElement.className).toBe('light-theme');

    themeSignal.set('dark');
    TestBed.flushEffects();
    expect(document.documentElement.className).toBe('dark-theme');
  });

  it('should update showHeader based on router url events', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    routerMock.url = '/world-map';
    routerEvents$.next({});
    expect(component.showHeader).toBeFalse();

    routerMock.url = '/dashboard';
    routerEvents$.next({});
    expect(component.showHeader).toBeTrue();
  });

  it('should toggle and close menu', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    expect(component.isMenuOpen).toBeFalse();
    component.toggleMenu();
    expect(component.isMenuOpen).toBeTrue();
    component.closeMenu();
    expect(component.isMenuOpen).toBeFalse();
  });

  it('should switch theme from light to dark', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    themeSignal.set('light');
    component.toggleTheme();

    expect(themeServiceMock.setTheme).toHaveBeenCalledWith('dark');
  });

  it('should switch theme from dark to light', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    themeSignal.set('dark');
    component.toggleTheme();

    expect(themeServiceMock.setTheme).toHaveBeenCalledWith('light');
  });

  it('should execute ngOnInit', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();

    expect().nothing();
  });
});
