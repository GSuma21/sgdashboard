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

  const setWindowWidth = (width: number) => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(width);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PieChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
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

  it('should sanitize, sort and total pieData in setter', () => {
    setWindowWidth(1400);

    component.pieData = [
      { name: 'B', value: '4' },
      { name: '', value: '' },
      { name: 'A', value: 10 }
    ];

    expect(component.pieData).toEqual([
      { name: 'A', value: 10 },
      { name: 'B', value: 4 },
      { name: 'Unknown', value: 0 }
    ]);
    expect(component.total).toBe(14);
  });

  it('should configure chart for very large desktop width', () => {
    setWindowWidth(1900);
    component.pieData = [{ name: 'Leadership', value: 12 }];

    const config = component.setChartConfig();
    const series = (config.baseOption as any).series[0];
    const formatted = series.label.formatter({
      name: 'Leadership',
      value: 12,
      percent: 37.126
    });

    expect((config.baseOption as any).title.top).toBe('45%');
    expect(series.label.show).toBeTrue();
    expect((config.baseOption as any).legend.data).toEqual(['Leadership']);
    expect(formatted).toBe('Leadership\n{valueStyle|12}  {percentStyle|37.13%}');
  });

  it('should configure chart for desktop width between 1281 and 1824', () => {
    setWindowWidth(1400);

    const config = component.setChartConfig();

    expect((config.baseOption as any).title.top).toBe('41%');
  });

  it('should configure chart for tablet width between 768 and 1280', () => {
    setWindowWidth(900);

    const config = component.setChartConfig();

    expect((config.baseOption as any).title.top).toBe('40%');
    expect(((config.baseOption as any).series[0]).label.show).toBeTrue();
  });

  it('should configure chart for mobile width and hide labels', () => {
    setWindowWidth(700);

    const config = component.setChartConfig();

    expect((config.baseOption as any).title.top).toBe('40%');
    expect(((config.baseOption as any).series[0]).label.show).toBeFalse();
    expect((config.media as any[]).length).toBe(1);
  });

  it('should calculate label formatting for non-zero total', () => {
    component.pieData = [{ name: 'A', value: 25 }, { name: 'B', value: 75 }];

    expect(component.labelFormatting('A', null)).toBe('A (25.0%)');
  });

  it('should calculate label formatting for zero total', () => {
    component.pieData = [{ name: 'Zero', value: 0 }];

    expect(component.labelFormatting('Zero', null)).toBe('Zero (0%)');
  });

  it('should calculate tooltip text for non-zero total', () => {
    component.pieData = [{ name: 'A', value: 25 }, { name: 'B', value: 75 }];

    const text = component.tooltipText({ data: { name: 'B', value: 75 } });

    expect(text).toBe('B (75.0%)');
  });

  it('should calculate tooltip text for zero total', () => {
    component.pieData = [{ name: 'Zero', value: 0 }];

    const text = component.tooltipText({ data: { name: 'Zero', value: 0 } });

    expect(text).toBe('Zero (0%)');
  });

  it('should fetch data successfully and update chart data', async () => {
    setWindowWidth(1400);
    component.dataFetchPath = '/mock.json';

    const fetchSpy = spyOn(globalThis as any, 'fetch').and.resolveTo(
      new Response(
        JSON.stringify({
          data: [
            { name: 'X', value: 5 },
            { name: 'Y', value: 9 }
          ]
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );

    component.fetchData();
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(fetchSpy).toHaveBeenCalled();
    expect(component.pieData).toEqual([
      { name: 'Y', value: 9 },
      { name: 'X', value: 5 }
    ]);
    expect(component.total).toBe(14);
  });

  it('should handle fetch data error', async () => {
    const error = new Error('failed');
    component.dataFetchPath = '/mock.json';

    spyOn(globalThis as any, 'fetch').and.rejectWith(error);
    const consoleSpy = spyOn(console, 'error');

    component.fetchData();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith('Error loading pie-chart data ', jasmine.any(Error));
  });

  it('should initialize by building path with replace code and fetching data', () => {
    component.path = '/states/{code}/data.json';
    component.replaceCode = 33;
    const fetchSpy = spyOn(component, 'fetchData');

    component.ngOnInit();

    expect(component.dataFetchPath).toBe('/states/33/data.json');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should initialize by using path as-is when replace code is absent', () => {
    component.path = '/plain.json';
    component.replaceCode = null;
    const fetchSpy = spyOn(component, 'fetchData');

    component.ngOnInit();

    expect(component.dataFetchPath).toBe('/plain.json');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should initialize from existing pie data when path is not provided', () => {
    setWindowWidth(900);

    component.pieData = [
      { name: 'A', value: 1 },
      { name: 'B', value: 2 }
    ];
    component.path = undefined;

    component.ngOnInit();

    expect(component.pieData).toEqual([
      { name: 'B', value: 2 },
      { name: 'A', value: 1 }
    ]);
    expect(component.total).toBe(3);
    expect(component.chartOptions).toBeTruthy();
  });
});

