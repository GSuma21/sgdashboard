import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Animations } from './animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-voices-animations',
  templateUrl: './voices-animations.component.html',
  styleUrls: ['./voices-animations.component.scss'],
  standalone: true,
  imports: [CommonModule],
  animations: Animations
})
export class VoicesAnimationsComponent implements OnInit, OnDestroy {
  showDandelionBase = false;
  growthStep = 0;
  private isDestroyed = false;

  // Persistence: Tracks exactly which elements remain on screen
  dandelionsVisible = new Set<number>();
  problemsVisible = new Set<number>();
  solutionsVisible = new Set<number>();

  readonly BRANCH_IMG = 'assets/animations/branch_4.svg';
  readonly FLOWER_IMG = 'assets/animations/dandelion.svg';

  storyNodes = [
    {
      problem: "I don't go to school because I don't have an Aadhaar card.",
      author: "Women Leader, Patna, Bihar",
      solution: "I worked on a micro-improvement project to help 9 children...",
      dandelionTop: '73%', dandelionLeft: '10%',
      responsivePositions: [
        { minWidth: 2560, top: '116%', left: '11%' },
        { minWidth: 1910, top: '85%', left: '11%' },
        { minWidth: 1536, top: '67%', left: '10%' },
        { minWidth: 1440, top: '62%', left: '10%' },
        { minWidth: 1366, top: '59%', left: '10%' },
        { minWidth: 1280, top: '55%', left: '10%' },
        { minWidth: 1024, top: '43%', left: '8%' },
        { minWidth: 0,    top: '77%', left: '10%' }
      ]
    },
    {
      problem: "Child marriage is a prevalent issue...",
      author: "Farmer Leader, Patna, Bihar",
      solution: "I, a farmer from Danapur, addressed the security problem...",
      dandelionTop: '73%', dandelionLeft: '37%',
      responsivePositions: [
        { minWidth: 2560, top: '84%', left: '37%' },
        { minWidth: 1910, top: '82%', left: '37%' },
        { minWidth: 1536, top: '64%', left: '37%' },
        { minWidth: 1440, top: '59%', left: '37%' },
        { minWidth: 1366, top: '57%', left: '37%' },
        { minWidth: 1280, top: '52%', left: '37%' },
        { minWidth: 1024, top: '41%', left: '35%' },
        { minWidth: 0,    top: '73%', left: '37%' }
      ]
    },
    {
      problem: "Due to lack of school in the village...",
      author: "Women Leader, Patna, Bihar",
      solution: "I improved attendance at my school...",
      dandelionTop: '60%', dandelionLeft: '60%',
      responsivePositions: [
        { minWidth: 2560, top: '88%', left: '60%' },
        { minWidth: 1910, top: '68%', left: '60%' },
        { minWidth: 1536, top: '52%', left: '60%' },
        { minWidth: 1440, top: '49%', left: '60%' },
        { minWidth: 1366, top: '47%', left: '60%' },
        { minWidth: 1280, top: '43%', left: '60%' },
        { minWidth: 1024, top: '34%', left: '58%' },
        { minWidth: 0,    top: '60%', left: '60%' }
      ]
    },
    {
      problem: "In rural areas, girls often drop out...",
      author: "Women Leader, Patna, Bihar",
      solution: "A farmer from Danapur addressed security issues...",
      dandelionTop: '74%', dandelionLeft: '89%',
      responsivePositions: [
        { minWidth: 2560, top: '112%', left: '89%' },
        { minWidth: 1910, top: '82%', left: '89%' },
        { minWidth: 1536, top: '64%', left: '89%' },
        { minWidth: 1440, top: '59%', left: '89%' },
        { minWidth: 1366, top: '57%', left: '89%' },
        { minWidth: 1280, top: '53%', left: '89%' },
        { minWidth: 1024, top: '41%', left: '87%' },
        { minWidth: 0,    top: '74%', left: '89%' }
      ]
    }
  ];

  ngOnInit() {
    this.updatePositions();
    this.playAnimation();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updatePositions();
  }

  updatePositions() {
    const width = window.innerWidth;
    this.storyNodes.forEach(node => {
      // Find the best matching breakpoint (largest minWidth that is <= current width)
      const match = node.responsivePositions
        .sort((a, b) => b.minWidth - a.minWidth) // Sort descending
        .find(bp => width >= bp.minWidth);

      if (match) {
        node.dandelionTop = match.top;
        node.dandelionLeft = match.left;
      }
    });
  }

  async playAnimation() {
    this.showDandelionBase = true;
    await this.delay(500);
    if (this.isDestroyed) return;


    this.growthStep = 0.5;
    await this.delay(1000);
    if (this.isDestroyed) return;

    for (let i = 0; i < this.storyNodes.length; i++) {
      if (this.isDestroyed) return;
      // 1. Grow Branch Segment
      this.growthStep = i + 1;
      await this.delay(1500); // Wait for growth
      if (this.isDestroyed) return;

      // 2. SHOW CHALLENGE (Problem) FIRST
      this.problemsVisible.add(i);
      await this.delay(2000); // Wait for reading
      if (this.isDestroyed) return;

      // 3. SHOW DANDELION (Pops in)
      this.dandelionsVisible.add(i);
      await this.delay(500); // Wait for pop animation
      if (this.isDestroyed) return;

      // 4. SHOW SOLUTION
      this.solutionsVisible.add(i);
      await this.delay(3500); // Wait for reading before starting next loop
      if (this.isDestroyed) return;

      // Note: We do NOT remove them. They stay on screen.
    }
  }

  getBubbleStyle(node: any, type: 'problem' | 'solution') {
    const flowerTop = parseFloat(node.dandelionTop);
    const flowerLeft = parseFloat(node.dandelionLeft);

    const style: any = {
      left: `${flowerLeft}%`
    };

    if (type === 'problem') {
      style.top = `${flowerTop + 10}%`; // Bottom of flower
    } else {
      style.top = `${flowerTop - 35}%`; // Top of flower
    }
    return style;
  }

  delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
}
