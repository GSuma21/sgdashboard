import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieChartComponent } from './pie-chart';

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
