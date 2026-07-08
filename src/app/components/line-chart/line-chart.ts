import { Component, Input, OnInit } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

// Import charts
import { LineChart } from 'echarts/charts';

// Import components
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components';

// Import renderers
import { CanvasRenderer } from 'echarts/renderers';
import { environment } from '../../../../environments/environment';

// Register what you need
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  CanvasRenderer
]);

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [NgxEchartsDirective, MatCardModule, MatButtonModule, CommonModule],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './line-chart.html',
  styleUrls: ['./line-chart.css']
})
export class LineChartComponent implements OnInit {
  @Input() xAxis: string[] = ['Q1(Apr - Jun)', 'Q2(Jul - Sept)', 'Q3(Oct - Dec)', 'Q4(Jan - Mar)'];
  @Input() data: any = {};
  @Input() replaceCode?: any;
  @Input() path?: any;

  title = 'Micro Improvements so far';
  note = '*This chart represents the cumulative number of micro-improvements recorded over time.';
  currentYear: string = '2025';
  year = '2025';
  dataFetchPath: any;
  baseUrl: any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`;

  // Positions on x-axis for quarters (mapped to 1,4,7,10)
  quarterPositions = [1, 4, 7, 10];

  chartOption: EChartsOption = {};

  ngOnInit(): void {
    if (this.path) {
      this.dataFetchPath = this.replaceCode ? this.path.replace('{code}', this.replaceCode.toString()) : this.path;
      this.fetchData();
    } else {
      if (this.data && this.data.length > 0) {
        // Map your data to [x, y] pairs using quarterPositions
        const latestData = this.data[this.data.length - 1];
        const mappedData = this.mapDataToPositions(latestData.data);
        this.setChartData(mappedData);
        this.year = latestData.year;
      }
    }
  }

  // Maps the data array to positions on x-axis as [x, y]
  mapDataToPositions(dataArray: number[]): [number, number][] {
    return dataArray.map((value, idx) => [this.quarterPositions[idx], value]);
  }

  setChartData(data: [number, number][]) {
    this.chartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          snap: true
        },
        formatter: (params: any) => {
          // params is an array of series points at this x
          if (!params || !params.length) return '';
          const point = params[0]; // first series
          const quarterPositions = [1, 4, 7, 10];
          const labels = ['Q1(Apr-Jun)', 'Q2(Jul-Sept)', 'Q3(Oct-Dec)', 'Q4(Jan-Mar)'];
          const idx = quarterPositions.indexOf(point.value[0]);
          const label = idx !== -1 ? labels[idx] : `x: ${point.value[0]}`;
          return `
      <div style="text-align: center;">
        <div>${point.value[1]}</div>
        <div>Micro improvements</div>
      </div>
    `;
  }
      },
      xAxis: {
        type: 'value',
        min: 1,
        max: 10,
        interval: 1,
        axisLine: { lineStyle: { color: '#999' } },
        axisTick: { show: true },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'dashed'
          }
        },
       axisLabel: {
  formatter: (value: number) => {
    const idx = this.quarterPositions.indexOf(value);
    if (idx === -1) return '';

    // Extract both parts from your label
    const fullLabel = this.xAxis[idx]; // e.g., 'Q1(Apr - Jun)'
    const match = fullLabel.match(/(Q\d+)\s*\(([^)]+)\)/);

    if (match) {
      const quarter = match[1];       // Q1
      const months = match[2];        // Apr - Jun

      return `{bold|${quarter}} {light|(${months})}`;
    }

    return fullLabel; // fallback if pattern doesn't match
  },
  rich: {
    bold: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#333',
    },
    light: {
      fontSize: 9,
      color: '#888',
    }
  }
}

      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#999' } },
        splitLine: { lineStyle: { color: '#eee' } }
      },
      series: [
        {
          data: data,
          type: 'line',
          smooth: false,
          symbol: 'circle',
          symbolSize: 10,
          itemStyle: { color: '#5E2EBF' },
          lineStyle: { color: '#5E2EBF', width: 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(94, 46, 191, 0.4)' },
                { offset: 1, color: 'rgba(94, 46, 191, 0.0)' }
              ]
            }
          }
        },
        // Invisible placeholder series to force vertical lines at every integer 1..12
        {
          name: 'placeholder',
          data: Array.from({ length: 10 }, (_, i) => [i + 1, null]),
          type: 'line',
          showSymbol: false,
          lineStyle: { opacity: 0 },
          emphasis: { disabled: true },
          tooltip: { show: false } // <-- hide from tooltip
        }
      ],
      grid: {
        left: '5%',
        right: '5%',
        top: '10%',
        bottom: '10%',
        containLabel: true
      }
    };
  }

  showYearData(yearData: any) {
    this.year = yearData.year;
    const mappedData = this.mapDataToPositions(yearData.data);
    this.setChartData(mappedData);
  }

  fetchData() {
    d3.json(`${this.baseUrl}${this.dataFetchPath}`)
      .then((data: any) => {
        this.data = data.data;
        const latestData = this.data[this.data.length - 1];
        const mappedData = this.mapDataToPositions(latestData.data);
        this.setChartData(mappedData);
        this.year = latestData.year;
      })
      .catch((err: any) => {
        console.error('Error loading line-chart data', err);
      });
  }
}
