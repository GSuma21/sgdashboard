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

      // 2. SHOW CHALLENGE in Carousel
      this.currentIndex = i * 2; // Even index = Problem
      await this.delay(2000); // Wait for reading
      if (this.isDestroyed) return;

      // 3. SHOW DANDELION (Pops in)
      this.dandelionsVisible.add(i);
      await this.delay(500); // Wait for pop animation
      if (this.isDestroyed) return;

      // 4. SHOW SOLUTION in Carousel
      this.currentIndex = i * 2 + 1; // Odd index = Solution
      await this.delay(3000); // Wait for reading
      if (this.isDestroyed) return;
    }
  }

  next() {
    if (this.currentIndex < this.carouselItems.length - 1) {
      this.currentIndex++;
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  onDandelionClick(index: number) {
    // Jump to the Challenge (Problem) associated with this dandelion
    // Each node has 2 items: Problem (even) and Solution (odd)
    this.currentIndex = index * 2;
  }

  get currentItem() {
    return this.carouselItems[this.currentIndex];
  }

  delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
}
