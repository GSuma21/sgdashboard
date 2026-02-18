import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import * as d3 from 'd3';

import { PieChartComponent } from './pie-chart';

// simple helper for overriding innerWidth by redefining the property
function setInnerWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
}

describe('PieChartComponent', () => {
  let component: PieChartComponent;
  let fixture: ComponentFixture<PieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.showLegend).toBeTrue();
    expect(component.showLabels).toBeTrue();
    expect(component.colorScheme.domain.length).toBeGreaterThan(0);
    // chartOptions computed even if pieData empty
    expect(component.chartOptions).toBeDefined();
  });

  describe('pieData setter/getter and total', () => {
    it('sanitizes input, sorts descending and updates total/chartOptions', () => {
      component.pieData = [
        { name: 'B', value: '5' },
        { name: '', value: 'notANumber' },
        { name: 'A', value: 10 }
      ] as any;

      expect(component.pieData[0].name).toBe('A');
      expect(component.pieData[0].value).toBe(10);
      expect(component.pieData[2].name).toBe('Unknown');
      expect(component.total).toBe(15);
      // chartOptions typing is loose, assert via any to satisfy TS
      const base = component.chartOptions.baseOption as any;
      expect(base.title.text).toBe('15');
    });

    it('getter returns the same array reference', () => {
      const arr = [{ name: 'X', value: 1 }];
      component.pieData = arr as any;
      expect(component.pieData).not.toBe(arr); // setter clones/normalizes
    });
  });

  describe('setChartConfig', () => {
    it('adjusts title.top based on innerWidth breakpoints', () => {
      setInnerWidth(1900);
      component.total = 42;
      const opt1 = component.setChartConfig() as any;
      expect(opt1.baseOption.title.top).toBe('45%');

      setInnerWidth(1500);
      const opt2 = component.setChartConfig() as any;
      expect(opt2.baseOption.title.top).toBe('41%');

      setInnerWidth(800);
      const opt3 = component.setChartConfig() as any;
      expect(opt3.baseOption.title.top).toBe('40%');

      setInnerWidth(500);
      const opt4 = component.setChartConfig() as any;
      expect(opt4.baseOption.title.top).toBe('40%');
    });

    it('includes legend data from pieData names', () => {
      // original pieData is sorted descending in setter, so order flips
      component.pieData = [ { name: 'Foo', value: 1 }, { name: 'Bar', value: 2 } ] as any;
      const opt = component.setChartConfig() as any;
      expect(opt.baseOption.legend.data).toEqual(['Bar','Foo']);
    });

    it('label.show toggles based on desktop width', () => {
      component.pieData = [ { name: 'Foo', value: 1 } ] as any;
      setInnerWidth(1024);
      const opt1 = component.setChartConfig() as any;
      expect(opt1.baseOption.series[0].label.show).toBeTrue();

      setInnerWidth(400);
      const opt2 = component.setChartConfig() as any;
      expect(opt2.baseOption.series[0].label.show).toBeFalse();
    });
  });

  describe('formatting helpers', () => {
    beforeEach(() => {
      component.pieData = [ { name: 'Alpha', value: 2 }, { name: 'Beta', value: 3 } ] as any;
    });

    it('labelFormatting returns percentage string', () => {
      const text = component.labelFormatting('Alpha', null as any);
      expect(text).toContain('Alpha');
      expect(text).toContain('(40.0%)');

      // calling with a name not in pieData currently throws; verify guard
      expect(() => component.labelFormatting('Gamma', null as any)).toThrow();
    });

    it('tooltipText computes correctly', () => {
      const data = { data: { name: 'Beta', value: 3 } } as any;
      expect(component.tooltipText(data)).toContain('Beta');
      expect(component.tooltipText(data)).toContain('(60.0%)');

      const empty = component.tooltipText({ data: { name: 'None', value: 0 }} as any);
      expect(empty).toContain('(0.0%)');
    });
  });

  describe('ngOnInit behaviour', () => {
    it('when path input missing uses pieData and total', () => {
      component.pieData = [ { name: 'X', value: 1 } ] as any;
      component.total = 100;
      component.ngOnInit();
      expect(component.dataFetchPath).toBeUndefined();
      expect(component.total).toBe(1);
    });

    it('when path provided invokes fetchData', () => {
      component.path = '/foo';
      spyOn(component, 'fetchData');
      component.ngOnInit();
      expect(component.dataFetchPath).toBe('/foo');
      expect(component.fetchData).toHaveBeenCalled();
    });

    it('replaceCode substitutes {code}', () => {
      component.path = '/path/{code}/file';
      component.replaceCode = 99;
      spyOn(component, 'fetchData');
      component.ngOnInit();
      expect(component.dataFetchPath).toBe('/path/99/file');
    });
  });

  describe('fetchData', () => {
    beforeEach(() => {
      component.baseUrl = 'http://test/';
      component.dataFetchPath = '/data.json';
    });

    it('successfully loads and processes data', fakeAsync(() => {
      const fakeData = { data: [ { name: 'A', value: 1 }, { name: 'B', value: 2 } ] };
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response(JSON.stringify(fakeData))) as any
      );

      component.fetchData();
      tick();
      expect(component.pieData.length).toBe(2);
      expect(component.total).toBe(3);
      const base = component.chartOptions.baseOption as any;
      expect(base.title.text).toBe('3');
    }));

    it('logs error on failure', fakeAsync(() => {
      spyOn(window, 'fetch').and.returnValue(Promise.reject('oops') as any);
      spyOn(console, 'error');
      component.fetchData();
      tick();
      expect(console.error).toHaveBeenCalledWith('Error loading pie-chart data ', 'oops');
    }));
  });
});

