import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Animations } from './animations';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { VOICE_ANIMATION, VOICE_ANIMATION_RESOLUTIONS } from '../../../constants/urlConstants';

@Component({
  selector: 'app-mobile-voices-animations',
  templateUrl: './voices-animations.component.html',
  styleUrls: ['./voices-animations.component.scss'],
  standalone: true,
  imports: [CommonModule],
  animations: Animations
})
export class MobileVoicesAnimationsComponent implements OnInit, OnDestroy {
  carouselItems: any[] = [];
  currentIndex = 0;
  private isDestroyed = false;
  pageData: any = [];

  // Dandelion Animation Props
  showDandelionBase = false;
  growthStep = 0;
  dandelionsVisible = new Set<number>();

  readonly BRANCH_IMG = 'assets/mobile-animations/branch_4.svg';
  readonly FLOWER_IMG = 'assets/mobile-animations/dandelion.svg';

  storyNodes: any = [];

  ngOnInit() {
    this.fetchPageData();
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
    this.storyNodes.forEach((node: any) => {
      // Find the best matching breakpoint (largest minWidth that is <= current width)
      const match = node.responsivePositions
        .sort((a: any, b: any) => b.minWidth - a.minWidth) // Sort descending
        .find((bp: any) => width >= bp.minWidth);

      if (match) {
        node.dandelionTop = match.top;
        node.dandelionLeft = match.left;
      }
    });
  }

  fetchPageData(): void {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${VOICE_ANIMATION}`).then((data: any) => {
      this.pageData = data.data.slice(0, 4);
      d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${VOICE_ANIMATION_RESOLUTIONS}`).then((response: any) => {
        this.storyNodes = response.map((element: any, index: number) => {
          element.problem = this.pageData[index].challenge;
          element.author = this.pageData[index].role + ', ' + this.pageData[index].district + ', ' + this.pageData[index].state;
          element.solution = this.pageData[index].solutions[0].solution;
          return element;
        });

        this.generateCarouselItems();
        this.updatePositions();
        this.playAnimation();

      }).catch((error: any) => {
        console.error('Error loading page data:', error);
      });
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

  generateCarouselItems() {
    this.carouselItems = [];
    this.storyNodes.forEach((node: any) => {
      // Add Challenge
      this.carouselItems.push({
        type: 'problem',
        content: node.problem,
        author: node.author,
        node: node // Keep reference if needed
      });
      // Add Solution
      this.carouselItems.push({
        type: 'solution',
        content: node.solution,
        author: node.author, // Solution might not need author, but keeping for consistency if desired
        node: node
      });
    });
  }

  activeDandelionIndex: number | null = null;
  isManualMode = false;

  async playAnimation() {
    this.showDandelionBase = true;
    await this.delay(500);
    if (this.isDestroyed || this.isManualMode) return;

    this.growthStep = 0.5;
    await this.delay(1000);
    if (this.isDestroyed || this.isManualMode) return;

    for (let i = 0; i < this.storyNodes.length; i++) {
      if (this.isDestroyed || this.isManualMode) return;

      // 1. Grow Branch Segment
      this.growthStep = i + 1;
      await this.delay(1500); // Wait for growth
      if (this.isDestroyed || this.isManualMode) return;

      // 2. SHOW CHALLENGE in Carousel
      this.currentIndex = i * 2; // Even index = Problem
      await this.delay(2000); // Wait for reading
      if (this.isDestroyed || this.isManualMode) return;

      // 3. SHOW DANDELION (Pops in)
      this.dandelionsVisible.add(i);
      await this.delay(500); // Wait for pop animation
      if (this.isDestroyed || this.isManualMode) return;

      // 4. SHOW SOLUTION in Carousel
      this.currentIndex = i * 2 + 1; // Odd index = Solution
      await this.delay(3000); // Wait for reading
      if (this.isDestroyed || this.isManualMode) return;
    }
  }

  stopAutoAnimation() {
    this.isManualMode = true;
  }

  updateAnimationState() {
    // Calculate which step we are at based on currentIndex
    // currentIndex 0 (Chal 1) -> i=0 -> growth 1
    // currentIndex 1 (Sol 1) -> i=0 -> growth 1, dandelion 0 visible
    // currentIndex 2 (Chal 2) -> i=1 -> growth 2, dandelion 0 visible
    // currentIndex 3 (Sol 2) -> i=1 -> growth 2, dandelion 0,1 visible

    const i = Math.floor(this.currentIndex / 2);
    const isSolution = this.currentIndex % 2 !== 0;

    // Update growth step
    // If we are at Chal 1 (0), growth should be 1.
    // If we are at Chal 2 (2), growth should be 2.
    this.growthStep = i + 1;

    // Update dandelions
    // Dandelions up to i-1 are definitely visible.
    // Dandelion i is visible ONLY if we are at Solution (or past it, but here we are at i)
    // Wait, in auto animation:
    // Chal (0) -> Growth 1 -> Wait -> Dandelion 0 -> Sol (1)
    // So at Chal (0), Dandelion 0 is NOT visible.
    // At Sol (1), Dandelion 0 IS visible.
    
    this.dandelionsVisible.clear();
    for (let k = 0; k < i; k++) {
      this.dandelionsVisible.add(k);
    }
    // Show dandelion if it's the Solution phase OR if it's the actively selected one
    if (isSolution || this.activeDandelionIndex === i) {
      this.dandelionsVisible.add(i);
    }
  }

  next() {
    this.stopAutoAnimation();
    if (this.currentIndex < this.carouselItems.length - 1) {
      this.currentIndex++;
      this.updateAnimationState();
    }
  }

  prev() {
    this.stopAutoAnimation();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateAnimationState();
    }
  }

  onDandelionClick(index: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.stopAutoAnimation();
    // Jump to the Challenge (Problem) associated with this dandelion
    // Each node has 2 items: Problem (even) and Solution (odd)
    this.currentIndex = index * 2;
    this.activeDandelionIndex = index;
    this.updateAnimationState();
  }

  resetActiveDandelion() {
    this.activeDandelionIndex = null;
  }

  get currentItem() {
    return this.carouselItems[this.currentIndex];
  }

  delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
}
