import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, Chart, registerables } from 'chart.js';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';


// ---------------- Plugin for upside-down right Y-axis title ----------------

const rightYAxisUpsideDownPlugin = {
  id: 'rightYAxisUpsideDown',
  afterDraw: (chart: any) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;

    const titleLines = [
      'Leaders–Leading Micro Improvements',
      '(Count)'
    ];

    ctx.save();

    // Shift farther right (increase from 25 to 60)
    // Also add small vertical nudge (+10) to adjust centering if needed
    ctx.translate(chartArea.right + 80, (chartArea.top + chartArea.bottom) / 2 );

    ctx.rotate(-Math.PI / 2); // bottom-to-top
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';

    titleLines.forEach((line, i) => {
      ctx.fillText(line, 0, (i - (titleLines.length - 1) / 2) * 16);
    });

    ctx.restore();
  }
};

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
        title: {
          display: true,
          text: [
            'Leaders–Participating in dialogues',
            '(Thousands)'
          ],
          color: 'black',
          // add font size safely
          font: {
            size: 10,           // 10px font
            weight: 'normal',
            family: 'sans-serif'
          } as any  // 👈 TypeScript workaround
        },
        grid: { color: 'rgba(255,0,0,0.3)' },
        ticks: { color: 'black' }
      },
      y1: {
        position: 'right',
        title: { display: false }, // plugin will draw upside-down title
        grid: { color: 'rgba(255,0,0,0.3)' },
        ticks: { color: 'black' }
      }
    },
    layout: {
      padding: {
        right: 50, // space for your custom right Y-axis title
        top: 20
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        usePointStyle: true,  // 👈 this makes the hover box round
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.raw; // hovered value
            const label = tooltipItem.dataset.label; // dataset label
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  public lineChartType: ChartType = 'line';

  constructor() {
    Chart.register(...registerables);
    Chart.register(rightYAxisUpsideDownPlugin);
  }

  ngOnInit(): void {
    const labels = ['Q1 (Apr - Jun)', 'Q2 (Jul - Sept)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)'];
      const dialoguesData = this.chartData?.data?.["Participating in dialogues"] || [];
      let microImprovementsData = this.chartData?.data?.["Leading Micro Improvements"] || [];

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
            borderWidth: 4,      // line thickness
            pointRadius: 4,      // dot size
            pointHoverRadius: 6, // dot size on hover
          },
          {
            type: 'bar',
            data: dialoguesData,
            label: 'Participating in dialogues',
            backgroundColor: '#592e91',
            yAxisID: 'y',
            borderRadius: {
              topLeft: 8,
              topRight: 8,
              bottomLeft: 0,
              bottomRight: 0
            },
            borderSkipped: false      // 👈 rounds all corners
          }
        ]
      };
 }
 
}
