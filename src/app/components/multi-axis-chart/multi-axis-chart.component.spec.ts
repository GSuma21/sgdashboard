import { Chart } from 'chart.js';
import { MultiAxisChartComponent } from './multi-axis-chart.component';

describe('MultiAxisChartComponent', () => {
  const createComponent = (innerWidth: number) => {
    const innerWidthSpy = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(innerWidth);
    const registerSpy = spyOn(Chart, 'register').and.stub();
    const component = new MultiAxisChartComponent();
    return { component, registerSpy, innerWidthSpy };
  };

  it('should create and register chart plugins', () => {
    const { component, registerSpy } = createComponent(1200);

    const pluginIds = registerSpy.calls
      .allArgs()
      .map((args) => (args[0] as { id?: string })?.id)
      .filter(Boolean);

    expect(component).toBeTruthy();
    expect(component.lineChartType).toBe('line');
    expect(pluginIds).toContain('rightYAxisUpsideDown');
    expect(pluginIds).toContain('customXAxisLabel');
  });

  it('should use desktop layout padding for large screens', () => {
    const { component } = createComponent(1200);
    const options = component.lineChartOptions as any;
    expect(options.layout?.padding?.right).toBe(50);
  });

  it('should use mobile layout padding for small screens', () => {
    const { component } = createComponent(700);
    const options = component.lineChartOptions as any;
    expect(options.layout?.padding?.right).toBe(20);
  });

  it('should set pointer cursor on hover when data point exists', () => {
    const { component } = createComponent(1200);
    const options = component.lineChartOptions as any;
    const target = { style: { cursor: '' } };
    const event = { native: { target } };

    options.onHover?.(event as any, [{} as any], {} as any);
    expect(target.style.cursor).toBe('pointer');
  });

  it('should set default cursor on hover when no data point exists', () => {
    const { component } = createComponent(1200);
    const options = component.lineChartOptions as any;
    const target = { style: { cursor: '' } };
    const event = { native: { target } };

    options.onHover?.(event as any, [], {} as any);
    expect(target.style.cursor).toBe('default');
  });

  it('should format tooltip label', () => {
    const { component } = createComponent(1200);
    const options = component.lineChartOptions as any;
    const labelCb = options.plugins?.tooltip?.callbacks?.label as any;

    expect(labelCb({ raw: 42, dataset: { label: 'Series A' } })).toBe('Series A: 42');
  });

  it('should trim trailing zero values from micro improvements line', () => {
    const { component } = createComponent(1200);
    component.chartData = {
      data: {
        'Participating in dialogues': [100, 200, 300, 400],
        'Leading Micro Improvements': [7, 8, 0, 0]
      }
    };

    component.ngOnInit();

    expect(component.lineChartData.labels).toEqual([
      'Q1 (Apr - Jun)',
      'Q2 (Jul - Sept)',
      'Q3 (Oct - Dec)',
      'Q4 (Jan - Mar)'
    ]);
    expect(component.lineChartData.datasets[0].data).toEqual([7, 8]);
    expect(component.lineChartData.datasets[1].data).toEqual([100, 200, 300, 400]);
  });

  it('should use empty line data when all micro improvements are zero', () => {
    const { component } = createComponent(1200);
    component.chartData = {
      data: {
        'Participating in dialogues': [1, 2, 3, 4],
        'Leading Micro Improvements': [0, 0, 0, 0]
      }
    };

    component.ngOnInit();

    expect(component.lineChartData.datasets[0].data).toEqual([]);
    expect(component.lineChartData.datasets[1].data).toEqual([1, 2, 3, 4]);
  });

  it('should handle missing chartData safely', () => {
    const { component } = createComponent(1200);

    component.chartData = undefined;
    component.ngOnInit();

    expect(component.lineChartData.datasets[0].data).toEqual([]);
    expect(component.lineChartData.datasets[1].data).toEqual([]);
  });

  it('should execute right axis plugin draw logic for desktop and mobile', () => {
    const { registerSpy, innerWidthSpy } = createComponent(1200);
    const rightAxisPlugin = registerSpy.calls
      .allArgs()
      .map((args) => args[0] as any)
      .find((plugin) => plugin?.id === 'rightYAxisUpsideDown');
    expect(rightAxisPlugin).toBeTruthy();

    const ctx: any = {
      save: jasmine.createSpy('save'),
      translate: jasmine.createSpy('translate'),
      rotate: jasmine.createSpy('rotate'),
      fillText: jasmine.createSpy('fillText'),
      restore: jasmine.createSpy('restore'),
      font: '',
      textAlign: '',
      textBaseline: '',
      fillStyle: ''
    };
    const chart = { ctx, chartArea: { right: 100, top: 10, bottom: 210 } };

    rightAxisPlugin.afterDraw(chart);
    expect(ctx.translate).toHaveBeenCalledWith(180, 110);
    expect(ctx.fillText).toHaveBeenCalled();

    innerWidthSpy.and.returnValue(700);
    rightAxisPlugin.afterDraw(chart);
    expect(ctx.translate).toHaveBeenCalledWith(170, 110);
  });

  it('should execute custom x-axis plugin draw logic and skip invalid labels', () => {
    const { registerSpy, innerWidthSpy } = createComponent(700);
    const xAxisPlugin = registerSpy.calls
      .allArgs()
      .map((args) => args[0] as any)
      .find((plugin) => plugin?.id === 'customXAxisLabel');
    expect(xAxisPlugin).toBeTruthy();

    const ctx: any = {
      save: jasmine.createSpy('save'),
      fillText: jasmine.createSpy('fillText'),
      restore: jasmine.createSpy('restore'),
      measureText: jasmine.createSpy('measureText').and.returnValue({ width: 20 }),
      font: '',
      fillStyle: '',
      textAlign: ''
    };

    xAxisPlugin.afterDraw({ ctx, scales: {}, data: { labels: [] } });
    expect(ctx.save).not.toHaveBeenCalled();

    const chart = {
      ctx,
      scales: {
        x: {
          getPixelForTick: (i: number) => 100 + i * 10,
          bottom: 200
        }
      },
      data: {
        labels: ['Q1 (Apr - Jun)', 'Invalid Label']
      }
    };

    xAxisPlugin.afterDraw(chart);
    expect(ctx.fillText).toHaveBeenCalledWith('Q1', 76, 214);
    expect(ctx.fillText).toHaveBeenCalledWith('(Apr - Jun)', 99, 214);

    innerWidthSpy.and.returnValue(1200);
    xAxisPlugin.afterDraw(chart);
    expect(ctx.fillText).toHaveBeenCalledWith('Q1', 90, 214);
    expect(ctx.fillText).toHaveBeenCalledWith('(Apr - Jun)', 114, 214);
  });
});
