import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);
@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, MatCardModule, NgxEchartsDirective],
  providers: [
    provideEchartsCore({ echarts })   // <-- this is the important fix
  ],
  templateUrl: './pie-chart.html',
  styleUrls: ['./pie-chart.css']
})
export class PieChartComponent {
  private _pieData: any[] = [];
  baseUrl:any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`
  dataFetchPath:any
  @Input() path?:any
  @Input() replaceCode?:any
  total = 1000;

  chartOptions: EChartsOption = this.setChartConfig();
  theme: any = {
    color:[
      '#FF928A', // Infrastructure and resources
      '#3CC3DF', // School structure and practices
      '#537FF1', // Leadership
      '#8979FF', // Pedagogy
      '#FFAE4C', // Assessment and Evaluation
      '#FFE500'  // Community Engagement
    ]
  };

  constructor(){}

  ngOnInit(){
    if(this.path){
      this.dataFetchPath = this.replaceCode ? this.path.replace('{code}', this.replaceCode.toString()) : this.path
      this.fetchData()
    }
    else {
      this.pieData = this._pieData;
      this.total = this.pieData.reduce((sum, d) => sum + d.value, 0);
      this.chartOptions = this.setChartConfig();
    }
  }

  setChartConfig():EChartsOption {
    return {
    baseOption: {
      title: {
        text: this.total.toString(),
        left: 'center',
        top: 'middle',
        textStyle: { fontSize: 32, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'middle',
        align: 'left',
        textStyle: { fontSize: 13 },
        itemGap: 8,
        data: this.pieData.map(d => d.name)
      },
      series: [
        {
          type: 'pie',
          radius: ['55%', '75%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: 'outside',
            formatter: (params: any) =>
              `${params.name}\n{valueStyle|${params.value}}  {percentStyle|${params.percent.toFixed(2)}%}`,
            rich: {
              valueStyle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
              percentStyle: { fontSize: 12, color: '#666' }
            }
          },
          labelLine: { length: 20, length2: 10, smooth: true },
          data: this.pieData
        }
      ]
    },
    media: [
      {
        query: { maxWidth: 768 },  // 🔹 for tablets & mobiles
        option: {
          legend: {
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            top: null,
            right: null,
            itemGap: 12
          },
          series: [
            {
              center: ['50%', '45%'] // recenter chart above legend
            }
          ]
        }
      }
    ]
  }
}



  @Input()
  set pieData(value: any[]) {
    // Sanitize data: Convert empty or invalid values to 0
    this._pieData = value.map(item => ({
      name: item.name || 'Unknown',
      value: Number(item.value) || 0 // Convert to number, default to 0 if invalid
    }));
  }

  get pieData(): any[] {
    return this._pieData;
  }

  // options
  showLegend = true;
  showLabels = true;

  // Custom color scheme
  colorScheme: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      '#8979fe', // Red for Infrastructure and resources
      '#3dc3e0', // Teal for School structure and practices
      '#feb962', // Blue for Leadership
      '#698ef7', // Green for Pedagogy
      '#ffe502', // Yellow for Assessment and Evaluation
      '#D4A5A5'  // Pink for Community Engagement
    ]
  };

  // Custom label formatting to show percentage
  labelFormatting = (data: any,values:any) => {
    const total = this.pieData.reduce((sum, item) => sum + item.value, 0);
    const name = data;
    const value = this.pieData.find((element:any) => element.name == data);
    const percentage = total > 0 ? ((value.value / total) * 100).toFixed(1) : 0;
    return `${name} (${percentage}%)`;
  };

  tooltipText = (data: any) => {
    const total = this.pieData.reduce((sum, item) => sum + item.value, 0);
    const name = data.data.name;
    const percentage = total > 0 ? ((data.data.value / total) * 100).toFixed(1) : 0;
    return `${name} (${percentage}%)`;
  };

  fetchData(){
    d3.json(`${this.baseUrl}${this.dataFetchPath}`).then((data:any)=>{
      this.pieData = data.data
      this.total = this.pieData.reduce((sum, d) => sum + d.value, 0);
      this.chartOptions = this.setChartConfig();
    }).catch((err:any)=>{
      console.error("Error loading pie-chart data ",err)
    })
  }
}
