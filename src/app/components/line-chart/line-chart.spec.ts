import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LineChartComponent } from './line-chart';

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LineChartComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
    // Initialize data as array to prevent template errors
    component.data = [];
    // Don't call detectChanges here to avoid template rendering issues
  });

  // ============ Basic initialization tests ============
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default xAxis quarters', () => {
    expect(component.xAxis).toEqual(['Q1(Apr - Jun)', 'Q2(Jul - Sept)', 'Q3(Oct - Dec)', 'Q4(Jan - Mar)']);
  });

  it('should initialize with empty data array', () => {
    expect(component.data).toEqual([]);
  });

  it('should initialize currentYear as 2025', () => {
    expect(component.currentYear).toBe('2025');
  });

  it('should initialize year as 2025', () => {
    expect(component.year).toBe('2025');
  });

  it('should have quarterPositions array', () => {
    expect(component.quarterPositions).toEqual([1, 4, 7, 10]);
  });

  it('should have empty chartOption on init', () => {
    expect(component.chartOption).toEqual({});
  });

  it('should set baseUrl with environment variables', () => {
    expect(component.baseUrl).toContain('/');
  });

  // ============ Data mapping tests ============
  it('should map data array to quarter positions correctly', () => {
    const data = [10, 20, 30, 40];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([[1, 10], [4, 20], [7, 30], [10, 40]]);
  });

  it('should map single data point correctly', () => {
    const data = [50];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([[1, 50]]);
  });

  it('should map two data points', () => {
    const data = [5, 10];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([[1, 5], [4, 10]]);
  });

  it('should map three data points', () => {
    const data = [5, 10, 15];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([[1, 5], [4, 10], [7, 15]]);
  });

  it('should map empty data array', () => {
    const data: number[] = [];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([]);
  });

  it('should map data with zero values', () => {
    const data = [0, 0, 0, 0];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([[1, 0], [4, 0], [7, 0], [10, 0]]);
  });

  it('should map data with large values', () => {
    const data = [1000, 2000, 3000, 4000];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([[1, 1000], [4, 2000], [7, 3000], [10, 4000]]);
  });

  it('should map data with negative values', () => {
    const data = [-10, -20, -30, -40];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([[1, -10], [4, -20], [7, -30], [10, -40]]);
  });

  it('should map data with decimal values', () => {
    const data = [10.5, 20.3, 30.7, 40.2];
    const mapped = component.mapDataToPositions(data);
    expect(mapped).toEqual([[1, 10.5], [4, 20.3], [7, 30.7], [10, 40.2]]);
  });

  // ============ Chart configuration tests ============
  it('should set chart data with proper ECharts options', () => {
    const mappedData: [number, number][] = [[1, 10], [4, 20], [7, 30], [10, 40]];
    component.setChartData(mappedData);
    
    expect(component.chartOption).toBeDefined();
    expect(component.chartOption.tooltip).toBeDefined();
    expect(component.chartOption.xAxis).toBeDefined();
    expect(component.chartOption.yAxis).toBeDefined();
    expect(component.chartOption.series).toBeDefined();
    expect(component.chartOption.grid).toBeDefined();
  });

  it('should configure tooltip with axis trigger', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const tooltip = (component.chartOption.tooltip as any);
    expect(tooltip.trigger).toBe('axis');
  });

  it('should configure tooltip with axisPointer', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const tooltip = (component.chartOption.tooltip as any);
    expect(tooltip.axisPointer).toBeDefined();
    expect(tooltip.axisPointer.type).toBe('line');
    expect(tooltip.axisPointer.snap).toBe(true);
  });

  it('should have tooltip formatter function', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const tooltip = (component.chartOption.tooltip as any);
    expect(tooltip.formatter).toBeDefined();
    expect(typeof tooltip.formatter).toBe('function');
  });

  it('tooltip formatter should handle null params', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const tooltip = (component.chartOption.tooltip as any);
    const result = tooltip.formatter(null);
    expect(result).toBe('');
  });

  it('tooltip formatter should handle empty params array', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const tooltip = (component.chartOption.tooltip as any);
    const result = tooltip.formatter([]);
    expect(result).toBe('');
  });

  it('tooltip formatter should format data with quarter and micro improvements', () => {
    const mappedData: [number, number][] = [[1, 15]];
    component.setChartData(mappedData);
    
    const tooltip = (component.chartOption.tooltip as any);
    const mockParams = [{ value: [1, 15] }];
    const result = tooltip.formatter(mockParams);
    
    expect(result).toContain('15');
    expect(result).toContain('Micro improvements');
  });

  it('should configure xAxis as value type', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const xAxis = (component.chartOption.xAxis as any);
    expect(xAxis.type).toBe('value');
    expect(xAxis.min).toBe(1);
    expect(xAxis.max).toBe(10);
    expect(xAxis.interval).toBe(1);
  });

  it('should configure xAxis axis line style', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const xAxis = (component.chartOption.xAxis as any);
    expect(xAxis.axisLine).toBeDefined();
    expect(xAxis.axisLine.lineStyle).toBeDefined();
    expect(xAxis.axisLine.lineStyle.color).toBe('#999');
  });

  it('should configure xAxis tick', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const xAxis = (component.chartOption.xAxis as any);
    expect(xAxis.axisTick).toBeDefined();
    expect(xAxis.axisTick.show).toBe(true);
  });

  it('should configure xAxis split line', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const xAxis = (component.chartOption.xAxis as any);
    expect(xAxis.splitLine).toBeDefined();
    expect(xAxis.splitLine.show).toBe(true);
    expect(xAxis.splitLine.lineStyle.type).toBe('dashed');
  });

  it('should have xAxis label formatter function', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const axisLabel = (component.chartOption.xAxis as any).axisLabel;
    expect(axisLabel).toBeDefined();
    expect(axisLabel.formatter).toBeDefined();
    expect(typeof axisLabel.formatter).toBe('function');
  });

  it('xAxis formatter should return empty string for invalid position', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const axisLabel = (component.chartOption.xAxis as any).axisLabel;
    const result = axisLabel.formatter(99);
    expect(result).toBe('');
  });

  it('xAxis formatter should format Q1 label', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const axisLabel = (component.chartOption.xAxis as any).axisLabel;
    const result = axisLabel.formatter(1);
    expect(result).toContain('Q1');
    expect(result).toContain('bold');
  });

  it('xAxis formatter should format Q2 label', () => {
    const mappedData: [number, number][] = [[4, 20]];
    component.setChartData(mappedData);
    
    const axisLabel = (component.chartOption.xAxis as any).axisLabel;
    const result = axisLabel.formatter(4);
    expect(result).toContain('Q2');
  });

  it('xAxis formatter should format Q3 label', () => {
    const mappedData: [number, number][] = [[7, 30]];
    component.setChartData(mappedData);
    
    const axisLabel = (component.chartOption.xAxis as any).axisLabel;
    const result = axisLabel.formatter(7);
    expect(result).toContain('Q3');
  });

  it('xAxis formatter should format Q4 label', () => {
    const mappedData: [number, number][] = [[10, 40]];
    component.setChartData(mappedData);
    
    const axisLabel = (component.chartOption.xAxis as any).axisLabel;
    const result = axisLabel.formatter(10);
    expect(result).toContain('Q4');
  });

  it('should have rich text configuration for axis labels', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const axisLabel = (component.chartOption.xAxis as any).axisLabel;
    expect(axisLabel.rich).toBeDefined();
    expect(axisLabel.rich.bold).toBeDefined();
    expect(axisLabel.rich.light).toBeDefined();
  });

  it('should configure rich text bold style', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const rich = (component.chartOption.xAxis as any).axisLabel.rich;
    expect(rich.bold.fontSize).toBe(12);
    expect(rich.bold.fontWeight).toBe('bold');
    expect(rich.bold.color).toBe('#333');
  });

  it('should configure rich text light style', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const rich = (component.chartOption.xAxis as any).axisLabel.rich;
    expect(rich.light.fontSize).toBe(9);
    expect(rich.light.color).toBe('#888');
  });

  it('should configure yAxis as value type', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const yAxis = (component.chartOption.yAxis as any);
    expect(yAxis.type).toBe('value');
  });

  it('should configure yAxis line style', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const yAxis = (component.chartOption.yAxis as any);
    expect(yAxis.axisLine).toBeDefined();
    expect(yAxis.axisLine.lineStyle).toBeDefined();
  });

  it('should configure yAxis split line', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const yAxis = (component.chartOption.yAxis as any);
    expect(yAxis.splitLine).toBeDefined();
    expect(yAxis.splitLine.lineStyle).toBeDefined();
  });

  // ============ Series tests ============
  it('should have exactly two series in chart options', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const series = component.chartOption.series as any[];
    expect(series.length).toBe(2);
  });

  it('should have line series with correct styling', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const series = (component.chartOption.series as any[])[0];
    expect(series.type).toBe('line');
    expect(series.symbol).toBe('circle');
    expect(series.symbolSize).toBe(10);
    expect(series.smooth).toBe(false);
  });

  it('should configure series item style color', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const series = (component.chartOption.series as any[])[0];
    expect(series.itemStyle).toBeDefined();
    expect(series.itemStyle.color).toBe('#5E2EBF');
  });

  it('should configure series line style', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const series = (component.chartOption.series as any[])[0];
    expect(series.lineStyle).toBeDefined();
    expect(series.lineStyle.color).toBe('#5E2EBF');
    expect(series.lineStyle.width).toBe(3);
  });

  it('should configure area style with gradient', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const series = (component.chartOption.series as any[])[0];
    expect(series.areaStyle).toBeDefined();
    expect(series.areaStyle.color).toBeDefined();
    expect(series.areaStyle.color.type).toBe('linear');
  });

  it('should configure area gradient color stops', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const series = (component.chartOption.series as any[])[0];
    const colorStops = series.areaStyle.color.colorStops;
    expect(colorStops).toBeDefined();
    expect(colorStops.length).toBe(2);
    expect(colorStops[0].offset).toBe(0);
    expect(colorStops[1].offset).toBe(1);
  });

  it('should set chart data with passed data array', () => {
    const mappedData: [number, number][] = [[1, 15], [4, 25], [7, 35], [10, 45]];
    component.setChartData(mappedData);
    
    const series = (component.chartOption.series as any[])[0];
    expect(series.data).toEqual(mappedData);
  });

  it('should configure placeholder series correctly', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const placeholderSeries = (component.chartOption.series as any[])[1];
    expect(placeholderSeries.name).toBe('placeholder');
    expect(placeholderSeries.type).toBe('line');
    expect(placeholderSeries.showSymbol).toBe(false);
  });

  it('should configure placeholder series line style as invisible', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const placeholderSeries = (component.chartOption.series as any[])[1];
    expect(placeholderSeries.lineStyle.opacity).toBe(0);
  });

  it('should disable emphasis on placeholder series', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const placeholderSeries = (component.chartOption.series as any[])[1];
    expect(placeholderSeries.emphasis.disabled).toBe(true);
  });

  it('should disable tooltip on placeholder series', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const placeholderSeries = (component.chartOption.series as any[])[1];
    expect(placeholderSeries.tooltip.show).toBe(false);
  });

  // ============ Grid configuration tests ============
  it('should include grid configuration in chart options', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    expect((component.chartOption.grid as any)).toBeDefined();
  });

  it('should configure grid margins correctly', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const grid = (component.chartOption.grid as any);
    expect(grid.left).toBe('5%');
    expect(grid.right).toBe('5%');
    expect(grid.top).toBe('10%');
    expect(grid.bottom).toBe('10%');
  });

  it('should configure grid containLabel', () => {
    const mappedData: [number, number][] = [[1, 10]];
    component.setChartData(mappedData);
    
    const grid = (component.chartOption.grid as any);
    expect(grid.containLabel).toBe(true);
  });

  // ============ Year data tests ============
  it('should show year data and update chart', () => {
    const yearData = { year: '2024', data: [15, 25, 35, 45] };
    component.showYearData(yearData);
    
    expect(component.year).toBe('2024');
    expect(component.chartOption).toBeDefined();
  });

  it('should update year property when showing new year data', () => {
    component.year = '2025';
    const yearData = { year: '2023', data: [1, 2, 3, 4] };
    component.showYearData(yearData);
    
    expect(component.year).toBe('2023');
  });

  it('should map and set chart data on showYearData', () => {
    const yearData = { year: '2024', data: [15, 25, 35, 45] };
    component.showYearData(yearData);
    
    const series = (component.chartOption.series as any[])[0];
    expect(series.data).toEqual([[1, 15], [4, 25], [7, 35], [10, 45]]);
  });

  // ============ ngOnInit tests ============
  it('should call fetchData when path is provided', () => {
    spyOn(component, 'fetchData');
    component.path = '/test-data.json';
    component.ngOnInit();
    
    expect(component.fetchData).toHaveBeenCalled();
  });

  it('should set dataFetchPath when path and replaceCode are provided', () => {
    component.path = '/data/{code}.json';
    component.replaceCode = 'AP';
    spyOn(component, 'fetchData'); // Prevent actual fetch
    component.ngOnInit();
    
    expect(component.dataFetchPath).toBe('/data/AP.json');
  });

  it('should set dataFetchPath to path when replaceCode is not provided', () => {
    component.path = '/data/test.json';
    component.replaceCode = undefined;
    spyOn(component, 'fetchData'); // Prevent actual fetch
    component.ngOnInit();
    
    expect(component.dataFetchPath).toBe('/data/test.json');
  });

  it('should replace code in path with numeric replaceCode', () => {
    component.path = '/data/{code}.json';
    component.replaceCode = 123;
    spyOn(component, 'fetchData'); // Prevent actual fetch
    component.ngOnInit();
    
    expect(component.dataFetchPath).toBe('/data/123.json');
  });

  it('should use local data when path is not provided and data has items', () => {
    component.path = undefined;
    component.data = [
      { year: '2025', data: [10, 20, 30, 40] }
    ];
    spyOn(component, 'setChartData');
    spyOn(component, 'fetchData'); // Prevent actual fetch
    
    component.ngOnInit();
    
    expect(component.year).toBe('2025');
    expect(component.setChartData).toHaveBeenCalled();
  });

  it('should use latest data when multiple items in local data', () => {
    component.path = undefined;
    component.data = [
      { year: '2024', data: [5, 10, 15, 20] },
      { year: '2025', data: [10, 20, 30, 40] }
    ];
    spyOn(component, 'setChartData');
    spyOn(component, 'fetchData'); // Prevent actual fetch
    
    component.ngOnInit();
    
    expect(component.year).toBe('2025');
  });

  it('should not process data when path is undefined and data is empty', () => {
    component.path = undefined;
    component.data = [];
    spyOn(component, 'setChartData');
    spyOn(component, 'fetchData');
    
    component.ngOnInit();
    
    expect(component.setChartData).not.toHaveBeenCalled();
  });

  it('should handle data with single item', () => {
    component.path = undefined;
    component.data = [{ year: '2024', data: [5, 10, 15, 20] }];
    spyOn(component, 'setChartData');
    spyOn(component, 'fetchData');
    
    component.ngOnInit();
    
    expect(component.year).toBe('2024');
    expect(component.setChartData).toHaveBeenCalled();
  });

  it('should handle path without placeholder code', () => {
    component.path = '/static-data.json';
    component.replaceCode = 'AP';
    spyOn(component, 'fetchData'); // Prevent actual fetch
    component.ngOnInit();
    
    expect(component.dataFetchPath).toBe('/static-data.json');
  });

  // ============ Input property tests ============
  it('should accept custom xAxis input', () => {
    const customAxis = ['Jan', 'Feb', 'Mar', 'Apr'];
    component.xAxis = customAxis;
    
    expect(component.xAxis).toEqual(customAxis);
  });

  it('should accept custom data input', () => {
    const customData = { test: 'data' };
    component.data = customData;
    
    expect(component.data).toEqual(customData);
  });

  it('should accept replaceCode input', () => {
    component.replaceCode = 'MH';
    expect(component.replaceCode).toBe('MH');
  });

  it('should accept path input', () => {
    component.path = '/some/path.json';
    expect(component.path).toBe('/some/path.json');
  });

  // ============ Component metadata tests ============
  it('should be a standalone component', () => {
    const metadata = (LineChartComponent as any).ɵcmp;
    expect(metadata.standalone).toBe(true);
  });

  it('should have correct selector', () => {
    const metadata = (LineChartComponent as any).ɵcmp;
    expect(metadata.selectors[0][0]).toBe('app-line-chart');
  });

  it('should have Input decorators', () => {
    const metadata = (LineChartComponent as any).ɵcmp;
    expect(metadata.inputs).toBeDefined();
  });

  // ============ Method existence tests ============
  it('should initialize fetchData method', () => {
    expect(typeof component.fetchData).toBe('function');
  });

  it('should initialize showYearData method', () => {
    expect(typeof component.showYearData).toBe('function');
  });

  it('should initialize mapDataToPositions method', () => {
    expect(typeof component.mapDataToPositions).toBe('function');
  });

  it('should initialize setChartData method', () => {
    expect(typeof component.setChartData).toBe('function');
  });

  // ============ Edge cases ============
  it('should set chart data with zero values', () => {
    const mappedData: [number, number][] = [[1, 0], [4, 0], [7, 0], [10, 0]];
    component.setChartData(mappedData);
    
    expect((component.chartOption.series as any[])[0].data).toEqual(mappedData);
  });

  it('should set chart data with large values', () => {
    const mappedData: [number, number][] = [[1, 1000], [4, 2000], [7, 3000], [10, 4000]];
    component.setChartData(mappedData);
    
    expect((component.chartOption.series as any[])[0].data).toEqual(mappedData);
  });

  it('should set chart data with negative values', () => {
    const mappedData: [number, number][] = [[1, -10], [4, -20], [7, -30], [10, -40]];
    component.setChartData(mappedData);
    
    expect((component.chartOption.series as any[])[0].data).toEqual(mappedData);
  });

  it('should set chart data with decimal values', () => {
    const mappedData: [number, number][] = [[1, 10.5], [4, 20.3], [7, 30.7], [10, 40.2]];
    component.setChartData(mappedData);
    
    expect((component.chartOption.series as any[])[0].data).toEqual(mappedData);
  });

  // ============ Property initialization ============
  it('should have all required properties initialized', () => {
    expect(component.xAxis).toBeDefined();
    expect(component.data).toBeDefined();
    expect(component.currentYear).toBeDefined();
    expect(component.year).toBeDefined();
    expect(component.quarterPositions).toBeDefined();
    expect(component.chartOption).toBeDefined();
    expect(component.baseUrl).toBeDefined();
  });

  it('should maintain data mapping consistency', () => {
    const testData = [100, 200, 300, 400];
    const mapped1 = component.mapDataToPositions(testData);
    const mapped2 = component.mapDataToPositions(testData);
    
    expect(mapped1).toEqual(mapped2);
  });

  it('should update chartOption reference on setChartData', () => {
    const mappedData: [number, number][] = [[1, 10]];
    const oldOption = component.chartOption;
    component.setChartData(mappedData);
    
    expect(component.chartOption).not.toBe(oldOption);
  });
});
