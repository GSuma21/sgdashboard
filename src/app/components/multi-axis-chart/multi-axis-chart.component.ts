import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartEvent, ChartType, Chart, registerables } from 'chart.js';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-multi-axis-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatCardModule, MatButtonModule],
  templateUrl: './multi-axis-chart.component.html',
  styleUrls: ['./multi-axis-chart.component.scss']
})
export class MultiAxisChartComponent {
  year = '2025';

  constructor() {
    Chart.register(...registerables);
  }
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80, 81],
        label: 'Series A',
        type: 'bar',
        backgroundColor: '#592e91',
        borderColor: '#592e91',
        hoverBackgroundColor: '#592e91',
        hoverBorderColor: '#592e91',
        yAxisID: 'y'
      },
      {
        data: [4500, 4800, 4900, 4950],
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
        borderColor: '#fe9a11',
        pointBackgroundColor: '#fe9a11',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#fe9a11',
        fill: 'origin',
        yAxisID: 'y1'
      }
    ],
    labels: ['Q1 (Apr - Jun)', 'Q2 (Jul - Sept)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)']
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
          color: 'black'
        }
      }
    },
    plugins: {
      legend: { display: true },
    }
  };

  public lineChartType: ChartType = 'line';
}
