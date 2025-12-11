import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartEvent, ChartType, Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-multi-axis-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './multi-axis-chart.component.html',
  styleUrls: ['./multi-axis-chart.component.scss']
})
export class MultiAxisChartComponent {
  constructor() {
    Chart.register(...registerables);
  }
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40],
        label: 'Series A',
        type: 'bar',
        backgroundColor: 'rgba(0, 255, 255, 0.6)',
        borderColor: 'rgba(0, 255, 255, 1)',
        hoverBackgroundColor: 'rgba(0, 255, 255, 0.8)',
        hoverBorderColor: 'rgba(0, 255, 255, 1)',
        yAxisID: 'y'
      },
      {
        data: [4500, 480000, 490000, 495000, 500000, 502000, 509000],
        label: 'Series B',
        type: 'line',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return undefined;
          }
          const activeElements = chart.getActiveElements();
          const isDatasetActive = activeElements.some((el: any) => el.datasetIndex === context.datasetIndex);
          return isDatasetActive ? 'rgba(255, 0, 255, 0.2)' : 'rgba(255, 0, 255, 0)';
        },
        borderColor: 'rgba(255, 0, 255, 1)',
        pointBackgroundColor: 'rgba(255, 0, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 0, 255, 1)',
        fill: 'origin',
        yAxisID: 'y1'
      }
    ],
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July']
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.5
      }
    },
    onHover: (event, chartElement) => {
      (event.native?.target as HTMLElement).style.cursor = chartElement[0] ? 'pointer' : 'default';
    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      y: {
        position: 'left',
      },
      y1: {
        position: 'right',
        grid: {
          color: 'rgba(255,0,0,0.3)',
        },
        ticks: {
          color: 'red'
        }
      }
    },
    plugins: {
      legend: { display: true },
    }
  };

  public lineChartType: ChartType = 'line';
}
