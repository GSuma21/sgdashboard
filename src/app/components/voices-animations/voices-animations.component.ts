import { Component, OnInit } from '@angular/core';
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
export class VoicesAnimationsComponent implements OnInit {
  showDandelionBase = false;
  growthStep = 0;

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
      dandelionTop: '77%', dandelionLeft: '10%'
    },
    {
      problem: "Child marriage is a prevalent issue...",
      author: "Farmer Leader, Patna, Bihar",
      solution: "I, a farmer from Danapur, addressed the security problem...",
      dandelionTop: '73%', dandelionLeft: '37%'
    },
    {
      problem: "Due to lack of school in the village...",
      author: "Women Leader, Patna, Bihar",
      solution: "I improved attendance at my school...",
      dandelionTop: '60%', dandelionLeft: '60%'
    },
    {
      problem: "In rural areas, girls often drop out...",
      author: "Women Leader, Patna, Bihar",
      solution: "A farmer from Danapur addressed security issues...",
      dandelionTop: '74%', dandelionLeft: '89%'
    }
  ];

  ngOnInit() {
    this.playAnimation();
  }

  async playAnimation() {
    this.showDandelionBase = true;
    await this.delay(500);

    // Initial growth to 25%
    this.growthStep = 0.5;
    await this.delay(1000);

    for (let i = 0; i < this.storyNodes.length; i++) {
      // 1. Grow Branch Segment
      this.growthStep = i + 1;
      await this.delay(1500); // Wait for growth

      // 2. SHOW CHALLENGE (Problem) FIRST
      this.problemsVisible.add(i);
      await this.delay(2000); // Wait for reading

      // 3. SHOW DANDELION (Pops in)
      this.dandelionsVisible.add(i);
      await this.delay(500); // Wait for pop animation

      // 4. SHOW SOLUTION
      this.solutionsVisible.add(i);
      await this.delay(3500); // Wait for reading before starting next loop

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
