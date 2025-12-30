import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, Chart, registerables } from 'chart.js';
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
  @Input() chartData: any;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public lineChartData: ChartConfiguration['data'] = {
    labels: ['Q1 (Apr - Jun)', 'Q2 (Jul - Sept)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)'],
    datasets: []
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

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    const labels = ['Q1 (Apr - Jun)', 'Q2 (Jul - Sept)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)'];
      const dialoguesData = this.chartData["Participating in dialogues"] || [];
      let microImprovementsData = this.chartData["Leading Micro Improvements"] || [];

      // Hide trailing zeros for line
      const lastNonZeroIndex = microImprovementsData
        .map((v: number, i: number) => ({ v, i }))
        .filter((item: any) => item.v && item.v > 0)
        .map((item: any) => item.i)
        .pop();

      if (lastNonZeroIndex !== undefined) {
        microImprovementsData = microImprovementsData.slice(0, lastNonZeroIndex + 1);
      } else {
        microImprovementsData = [];
      }

      this.lineChartData = {
        labels,
        datasets: [
          {
            type: 'line',
            data: microImprovementsData,
            label: 'Leading Micro Improvements',
            borderColor: '#fe9a11',
            pointBackgroundColor: '#fe9a11',
            yAxisID: 'y1',
            tension: 0.4,
            fill: false,
          },
          {
            type: 'bar',
            data: dialoguesData,
            label: 'Participating in dialogues',
            backgroundColor: '#592e91',
            yAxisID: 'y',
          }
        ]
      };
 }
 
}
