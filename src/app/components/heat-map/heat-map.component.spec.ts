import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { QueryList } from '@angular/core';
import { HeatMapComponent } from './heat-map.component';

const mockFetchResponse = (body: unknown, ok = true) => Promise.resolve({
  ok,
  status: ok ? 200 : 500,
  statusText: ok ? 'OK' : 'Error',
  json: () => Promise.resolve(body)
} as any);

describe('HeatMapComponent', () => {
  let component: HeatMapComponent;
  let fixture: ComponentFixture<HeatMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatMapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeatMapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnInit should call getThemeData', () => {
    const getThemeDataSpy = spyOn(component, 'getThemeData');

    component.ngOnInit();

    expect(getThemeDataSpy).toHaveBeenCalled();
  });

  it('getThemeData should log error when request fails', fakeAsync(() => {
    const error = new Error('failed');
    const consoleErrorSpy = spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject(error));

    component.getThemeData();
    flushMicrotasks();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading page data:', error);
  }));

  it('setActiveTheme should keep only first four voices', () => {
    component.themes = [
      {
        id: 'one',
        label: 'One',
        value: 1,
        color: 'red',
        gridClass: 'span-1-1',
        list: [
          { id: '1', description: '1', voice_by: 'a', themeId: 'one', color: 'red', state: 'S' },
          { id: '2', description: '2', voice_by: 'a', themeId: 'one', color: 'red', state: 'S' },
          { id: '3', description: '3', voice_by: 'a', themeId: 'one', color: 'red', state: 'S' },
          { id: '4', description: '4', voice_by: 'a', themeId: 'one', color: 'red', state: 'S' },
          { id: '5', description: '5', voice_by: 'a', themeId: 'one', color: 'red', state: 'S' }
        ] as never
      }
    ];

    component.setActiveTheme('one');

    expect(component.activeThemeId).toBe('one');
    expect(component.displayedVoices.length).toBe(4);
    expect(component.displayedVoices[0].id).toBe('1');
    expect(component.displayedVoices[3].id).toBe('4');
  });

  it('setActiveTheme should clear displayed voices when id does not exist', () => {
    component.themes = [];
    component.displayedVoices = [
      { id: 'x', description: 'x', voice_by: 'x', themeId: 'x', color: 'x', state: 'x' }
    ];

    component.setActiveTheme('missing');

    expect(component.activeThemeId).toBe('missing');
    expect(component.displayedVoices).toEqual([]);
  });

  it('showTooltipOnClick should ignore invalid index', () => {
    const tooltip = jasmine.createSpyObj('tooltip', ['show', 'hide']);
    (component as any).tooltips = { toArray: () => [tooltip] } as QueryList<any>;

    component.showTooltipOnClick(2);

    expect(tooltip.show).not.toHaveBeenCalled();
    expect(tooltip.hide).not.toHaveBeenCalled();
  });

  it('showTooltipOnClick should hide others, show selected and auto hide', fakeAsync(() => {
    const tooltipA = jasmine.createSpyObj('tooltipA', ['show', 'hide']);
    const tooltipB = jasmine.createSpyObj('tooltipB', ['show', 'hide']);
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();

    (component as any).tooltips = { toArray: () => [tooltipA, tooltipB] } as QueryList<any>;

    component.showTooltipOnClick(0);
    const timeoutId = (component as any).tooltipTimeoutId;

    expect(tooltipB.hide).toHaveBeenCalled();
    expect(tooltipA.show).toHaveBeenCalled();
    expect(timeoutId).toBeTruthy();

    component.showTooltipOnClick(1);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId);
    expect(tooltipA.hide).toHaveBeenCalled();
    expect(tooltipB.show).toHaveBeenCalled();

    tick(1000);
    expect(tooltipB.hide).toHaveBeenCalled();
  }));

  it('ngOnDestroy should clear timeout when available', () => {
    const timeoutId = setTimeout(() => undefined, 2000);
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
    (component as any).tooltipTimeoutId = timeoutId;

    component.ngOnDestroy();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId);
  });

  it('ngOnDestroy should not call clearTimeout when timeout is null', () => {
    const clearTimeoutSpy = spyOn(window, 'clearTimeout');
    (component as any).tooltipTimeoutId = null;

    component.ngOnDestroy();

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });
});
