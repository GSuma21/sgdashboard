import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QueryList } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

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
      imports: [HeatMapComponent, NoopAnimationsModule]
    }).compileComponents();
  });

  // default fetch stub so ngOnInit won't throw in tests that don't override it
  beforeEach(() => {
    spyOn(window as any, 'fetch').and.returnValue(mockFetchResponse({ data: [] }));
    fixture = TestBed.createComponent(HeatMapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('setActiveTheme sets activeThemeId and displayedVoices (max 4)', () => {
    component.themes = [
      { id: 't1', label: 'T1', value: 10, list: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }] },
      { id: 't2', label: 'T2', value: 5, list: [] }
    ] as any;

    component.setActiveTheme('t1');

    expect(component.activeThemeId).toBe('t1');
    expect(component.displayedVoices.length).toBe(4);
    expect(component.displayedVoices).toEqual((component.themes[0].list ?? []).slice(0, 4));
  });

  it('setActiveTheme with unknown id still sets activeThemeId and clears displayedVoices', () => {
    component.themes = [{ id: 'x', label: 'X', value: 1, list: [] }] as any;

    component.setActiveTheme('does-not-exist');

    expect(component.activeThemeId).toBe('does-not-exist');
    expect(component.displayedVoices).toEqual([]);
  });

  it('showTooltipOnClick does nothing when tooltip index is out of range', () => {
    const ql = new QueryList<any>();
    ql.reset([]);
    (component as any).tooltips = ql;

    expect(() => component.showTooltipOnClick(5)).not.toThrow();
  });

  it('showTooltipOnClick clears previous timeout before showing new tooltip', fakeAsync(() => {
    const t0 = { show: jasmine.createSpy('show0'), hide: jasmine.createSpy('hide0') };
    const t1 = { show: jasmine.createSpy('show1'), hide: jasmine.createSpy('hide1') };

    const ql = new QueryList<any>();
    ql.reset([t0 as any, t1 as any]);
    (component as any).tooltips = ql;

    component['tooltipTimeoutId'] = 123 as any;
    spyOn(window, 'clearTimeout');

    component.showTooltipOnClick(0);

    expect(window.clearTimeout).toHaveBeenCalledWith(123);
    expect(t0.show).toHaveBeenCalled();
    expect(t1.hide).toHaveBeenCalled();

    tick(1000);
    expect(t0.hide).toHaveBeenCalled();
  }));

  it('showTooltipOnClick shows and auto-hides tooltip when no previous timeout exists', fakeAsync(() => {
    const t0 = { show: jasmine.createSpy('show0'), hide: jasmine.createSpy('hide0') };
    const t1 = { show: jasmine.createSpy('show1'), hide: jasmine.createSpy('hide1') };

    const ql = new QueryList<any>();
    ql.reset([t0 as any, t1 as any]);
    (component as any).tooltips = ql;

    spyOn(window, 'clearTimeout');

    component.showTooltipOnClick(1);

    expect(window.clearTimeout).not.toHaveBeenCalled();
    expect(t1.show).toHaveBeenCalled();
    expect(t0.hide).toHaveBeenCalled();

    tick(1000);
    expect(t1.hide).toHaveBeenCalled();
  }));

  it('ngOnDestroy clears tooltip timeout if present', () => {
    const id = setTimeout(() => {}, 10000);
    component['tooltipTimeoutId'] = id as any;
    spyOn(window, 'clearTimeout');

    component.ngOnDestroy();

    expect(window.clearTimeout).toHaveBeenCalledWith(id);
    clearTimeout(id);
  });

  it('ngOnDestroy does nothing when tooltip timeout is null', () => {
    component['tooltipTimeoutId'] = null;
    spyOn(window, 'clearTimeout');

    component.ngOnDestroy();

    expect(window.clearTimeout).not.toHaveBeenCalled();
  });

  describe('getThemeData -> mapping and activation', () => {
    const heatmapData = {
      education: { color: 'red', gridClass: 'g-edu', icon: 'edu.png' },
      health: { color: 'blue', gridClass: 'g-health', icon: 'health.png' }
    } as any;

    const themesJson = {
      data: [
        { id: 'education 1', label: 'Education', value: '40', list: [{ description: 'v1' }, { description: 'v2' }, { description: 'v3' }, { description: 'v4' }, { description: 'v5' }] },
        { id: 'health 1', label: 'Health', value: '30', list: [{ description: 'h1' }] }
      ]
    } as any;

    beforeEach(() => {
      let call = 0;
      (window.fetch as jasmine.Spy).and.callFake(() => {
        call += 1;
        const body = call === 1 ? heatmapData : themesJson;
        return mockFetchResponse(body);
      });
    });

    it('loads theme config, maps color/icon/grid and activates highest-value theme', async () => {
      const setActiveSpy = spyOn(component, 'setActiveTheme').and.callThrough();

      fixture.detectChanges(); // triggers ngOnInit()
      await fixture.whenStable();

      expect(component.heatmapThemeConfig).toEqual(heatmapData);
      expect(component.themes.length).toBe(2);

      expect(component.themes[0].id).toBe('education');
      expect(component.themes[0].icon).toBe('edu.png');
      expect(component.themes[0].color).toBe('red');
      expect(component.themes[0].gridClass).toBe('g-edu');

      // list items should get color from heatmapData as well
      const firstThemeList = (component.themes[0]?.list ?? []) as any[];
      expect(firstThemeList[0]?.color).toBe('red');

      expect(setActiveSpy).toHaveBeenCalledWith('education');
      expect(component.displayedVoices.length).toBe(4);
    });

    it('applies fallback icon/color/grid/list defaults and still activates top theme when data exists', async () => {
      (window.fetch as jasmine.Spy).and.callFake(() => {
        const fallbackHeatmapData = { first: {} };
        const fallbackThemes = {
          data: [{ id: 'unknown 99', label: 'Unknown', value: '99' }]
        };
        const callNumber = (window.fetch as jasmine.Spy).calls.count();
        const body = callNumber === 1 ? fallbackHeatmapData : fallbackThemes;
        return mockFetchResponse(body);
      });

      const setActiveSpy = spyOn(component, 'setActiveTheme').and.callThrough();

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.themes.length).toBe(1);
      expect(component.themes[0].id).toBe('unknown');
      expect(component.themes[0].icon).toBe('');
      expect(component.themes[0].color).toBe('gray');
      expect(component.themes[0].gridClass).toBe('span-1-1');
      expect(component.themes[0].list).toEqual([]);
      expect(setActiveSpy).toHaveBeenCalledWith('unknown');
      expect(component.activeThemeId).toBe('unknown');
    });

    it('uses defaults when heatmapTheme config is missing entries and does not activate when no themes', async () => {
      // return empty heatmap data then an empty data array
      (window.fetch as jasmine.Spy).and.callFake((url: string) => {
        if (url.includes('heatmap_theme.json')) return mockFetchResponse({});
        return mockFetchResponse({ data: [] });
      });

      const setActiveSpy = spyOn(component, 'setActiveTheme');

      fixture.detectChanges();
      await fixture.whenStable();

      // no themes mapped
      expect(component.themes.length).toBe(0);
      expect(setActiveSpy).not.toHaveBeenCalled();
    });

    it('logs error when fetch rejects', async () => {
      (window.fetch as jasmine.Spy).and.returnValue(Promise.reject(new Error('network')));
      spyOn(console, 'error');

      fixture.detectChanges();
      await fixture.whenStable();

      expect(console.error).toHaveBeenCalledWith('Error loading page data:', jasmine.any(Error));
    });
  });

  it('template renders heatmap items and voice cards', () => {
    component.themes = [
      {
        id: 't1', label: 'Theme 1', value: 2, color: 'red', gridClass: 'g1', icon: '',
        list: [{ description: 'desc1', voice_by: 'Alice', color: 'red', state: 'state1' }]
      },
      { id: 't2', label: 'Theme 2', value: 0, color: 'blue', gridClass: 'g2', icon: '', list: [] }
    ] as any;

    component.setActiveTheme('t1');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const heatmapItems = el.querySelectorAll('.heatmap-item');
    expect(heatmapItems.length).toBe(2);

    const voiceCards = el.querySelectorAll('.voice-card');
    expect(voiceCards.length).toBe(component.displayedVoices.length);
    expect(voiceCards[0].querySelector('.quote-text')!.textContent).toContain('desc1');
  });

  it('reads window.innerWidth at construction to set isMobile (false case)', () => {
    const saved = (window as any).innerWidth;
    (window as any).innerWidth = 1200;

    const localFixture = TestBed.createComponent(HeatMapComponent);
    const localComp = localFixture.componentInstance;

    expect(localComp.isMobile).toBeFalse();

    (window as any).innerWidth = saved;
  });

  it('reads window.innerWidth at construction to set isMobile (true case)', () => {
    const saved = (window as any).innerWidth;
    (window as any).innerWidth = 768;

    const localFixture = TestBed.createComponent(HeatMapComponent);
    const localComp = localFixture.componentInstance;

    expect(localComp.isMobile).toBeTrue();

    (window as any).innerWidth = saved;
  });
});
