import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
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
  imports: [NgxEchartsDirective,MatCardModule, MatButtonModule, CommonModule],
  providers: [ provideEchartsCore({ echarts })],
  templateUrl: './line-chart.html',
  styleUrls: ['./line-chart.css']
})
export class LineChartComponent implements OnInit {
  @Input() xAxis:any = ['Q1(Jan - Mar)', 'Q2(Apr - Jun)', 'Q3(Jul - Sept)', 'Q4(Oct - Dec)'];
  @Input() data:any = {};
  currentYear:string = '2025';
  @Input() replaceCode?:any;
  @Input() path?:any
  year = '2025'
  dataFetchPath:any
  baseUrl:any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`;
  chartOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
       axisPointer: {
    type: 'line',
    snap: true // <-- helps snapping to last point
  }
    },
    xAxis: {
      type: 'category',
      data: this.xAxis,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#999' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#999' } },
      splitLine: { lineStyle: { color: '#eee' } }
    },
    series: [
      {
        data: [18, 38, 27, 50],
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 12,
        itemStyle: {
          color: '#5E2EBF'
        },
        lineStyle: {
          color: '#5E2EBF',
          width: 3
        },
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

  setChartData(data:any) {
    this.chartOption = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: this.xAxis,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#999' } }
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
          symbolSize: 12,
          itemStyle: {
            color: '#5E2EBF'
          },
          lineStyle: {
            color: '#5E2EBF',
            width: 3
          },
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

  ngOnInit(): void {
    if(this.path){
      this.dataFetchPath = this.replaceCode ? this.path.replace('{code}', this.replaceCode.toString()) : this.path
      this.fetchData()
    }
    else {
      this.data = this.data;
      this.setChartData(this.data[0].data)
      this.year = this.data[0].year
    }
  }

  showYearData(yearData:any) {
    this.year = yearData.year;
    this.setChartData(yearData.data);
  }

  fetchData(){
    d3.json(`${this.baseUrl}${this.dataFetchPath}`).then((data:any)=>{
      this.data = data.data
      this.setChartData(this.data[0].data)
      this.year = this.data[0].year
      // this.chartOptions = this.setChartConfig();
    }).catch((err:any)=>{
      console.error("Error loading pie-chart data ",err)
    })
  }
}
