import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
      'Leaders–Participating in dialogues (Thousands)'
    ];

    ctx.save();

    // Shift farther right (increase from 25 to 60)
    // Also add small vertical nudge (+10) to adjust centering if needed
    ctx.translate(chartArea.right + (window.innerWidth <= 768 ? 70:80), (chartArea.top + chartArea.bottom) / 2 );

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


const customXAxisLabelPlugin = {
  id: 'customXAxisLabel',
  afterDraw(chart: any) {
    const ctx = chart.ctx;
    const xScale = chart.scales.x;
    if (!xScale) return;

    ctx.save();

    const isMobile = window.innerWidth < 768;

    // Mobile adjustments
    const qFontSize = isMobile ? 10 : 11;    // Q1-Q4 bold
    const subFontSize = isMobile ? 6 : 10;   // months in ()
    const gap = isMobile ? 3 : 4;            // gap between Q1 and months

    // More left shift for mobile
    const offsetX = isMobile ? -24 : -10;      // shift left by 18px on mobile

    chart.data.labels.forEach((label: string, index: number) => {
      const x = xScale.getPixelForTick(index) + offsetX;
      const y = xScale.bottom + 14;

      const match = label.match(/(Q\d+)\s*\(([^)]+)\)/);
      if (!match) return;

      const quarter = match[1]; // Q1
      const months = `(${match[2]})`; // (Apr - Jun)

      // Draw Q1 → bold black
      ctx.font = `bold ${qFontSize}px sans-serif`;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      const quarterWidth = ctx.measureText(quarter).width;
      ctx.fillText(quarter, x, y);

      // Draw months → grey, same line
      ctx.font = `${subFontSize}px sans-serif`;
      ctx.fillStyle = '#888';
      ctx.fillText(months, x + quarterWidth + gap, y);
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
export class MultiAxisChartComponent implements OnInit, OnChanges {
  year = '';
  yearWiseData: any[] = [];
  @Input() chartData: any;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public lineChartData: ChartConfiguration['data'] = {
    labels: ['Q1 (Apr - Jun)', 'Q2 (Jul - Sept)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)'],
    datasets: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false, 
    elements: {
      line: {
        tension: 0.5
      }
    },
    onHover: (event, chartElement) => {
      (event.native?.target as HTMLElement).style.cursor = chartElement[0] ? 'pointer' : 'default';
    },
    scales: {
       x: {
    type: 'category',
    ticks: {
      display: false   // hide default labels
    }
  },
  y: {
  position: 'left',
        title: {
          display: true,
          text: [
            'Leaders–Leading Micro Improvements'
          ],
          color: 'black',
          // add font size safely
          font: {
            size: 10,           // 10px font
            weight: 'normal',
            family: 'sans-serif'
          } as any  // 👈 TypeScript workaround
        },
        grid: { color: 'rgba(79, 79, 79, 0.1)' },
        ticks: { color: 'black' }
      },
      y1: {
        position: 'right',
        title: { display: false }, // plugin will draw upside-down title
        grid: { color: 'rgba(79, 79, 79, 0.1)' },
        ticks: { color: 'black' }
      }
    },
    layout: {
      padding: {
        right: window.innerWidth < 768 ? 20 : 50,
        top: 20,
        bottom: 25 
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
     Chart.register(customXAxisLabelPlugin);
  }

  ngOnInit(): void {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData']) {
      this.initializeChart();
    }
  }

  private initializeChart(): void {
    const microImprovementsSeries = this.chartData?.data?.['Leading Micro Improvements'] || [];
    const dialoguesSeries = this.chartData?.data?.['Participating in dialogues'] || [];

    if (this.isYearWiseSeries(microImprovementsSeries) || this.isYearWiseSeries(dialoguesSeries)) {
      this.yearWiseData = this.buildYearWiseData(microImprovementsSeries, dialoguesSeries);

      if (this.yearWiseData.length > 0) {
        const latestYearData = this.yearWiseData[this.yearWiseData.length - 1];
        this.showYearData(latestYearData);
      }

      return;
    }

    this.yearWiseData = [];

    const fallbackYearData = {
      year: this.chartData?.year || this.year || '2025',
      data: microImprovementsSeries
    };

    this.showYearData(fallbackYearData);
  }

  showYearData(yearData: any): void {
    const selectedYear = String(yearData?.year ?? '');
    const microImprovementsSeries = this.chartData?.data?.['Leading Micro Improvements'] || [];
    const dialoguesSeries = this.chartData?.data?.['Participating in dialogues'] || [];

    const microImprovementsData = this.trimTrailingZeros(
      this.getSeriesDataForYear(microImprovementsSeries, selectedYear, yearData?.data || [])
    );
    const dialoguesData = this.getSeriesDataForYear(dialoguesSeries, selectedYear, []);

    this.year = selectedYear;
    this.setChartData(microImprovementsData, dialoguesData);
  }

  private getSeriesDataForYear(series: any[], selectedYear: string, fallbackData: number[]): number[] {
    if (!Array.isArray(series) || series.length === 0) {
      return fallbackData;
    }

    if (typeof series[0] === 'number') {
      return series;
    }

    const selectedYearData = series.find((item: any) => String(item?.year) === selectedYear);
    return selectedYearData?.data || [];
  }

  private isYearWiseSeries(series: any[]): boolean {
    return Array.isArray(series) && series.length > 0 && typeof series[0] === 'object' && series[0] !== null && 'year' in series[0];
  }

  private buildYearWiseData(microImprovementsSeries: any[], dialoguesSeries: any[]): any[] {
    const yearMap = new Map<string, any>();

    [microImprovementsSeries, dialoguesSeries].forEach((series) => {
      if (!this.isYearWiseSeries(series)) {
        return;
      }

      series.forEach((item: any) => {
        const year = String(item?.year ?? '');
        if (!year) {
          return;
        }

        if (!yearMap.has(year)) {
          yearMap.set(year, { year, data: item?.data || [] });
        }
      });
    });

    return Array.from(yearMap.values()).sort((a, b) => Number(a.year) - Number(b.year));
  }

  private trimTrailingZeros(data: number[]): number[] {
    const lastNonZeroIndex = data
      .map((value: number, index: number) => ({ value, index }))
      .filter((item: any) => item.value && item.value > 0)
      .map((item: any) => item.index)
      .pop();

    if (lastNonZeroIndex === undefined) {
      return [];
    }

    return data.slice(0, lastNonZeroIndex + 1);
  }

  private setChartData(microImprovementsData: number[], dialoguesData: number[]): void {
    const labels = ['Q1 (Apr - Jun)', 'Q2 (Jul - Sept)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)'];

    this.lineChartData = {
      labels,
      datasets: [
        {
          type: 'line',
          data: microImprovementsData,
          label: 'Leading Micro Improvements',
          borderColor: '#fe9a11',
          pointBackgroundColor: '#fe9a11',
          yAxisID: 'y',
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
          yAxisID: 'y1',
          barPercentage: 0.7,      // actual bar width
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
