import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Animations } from './animations';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { VOICE_ANIMATION, VOICE_ANIMATION_RESOLUTIONS } from '../../../constants/urlConstants';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

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
  pageData:any = [];

  // Persistence: Tracks exactly which elements remain on screen
  dandelionsVisible = new Set<number>();
  problemsVisible = new Set<number>();
  solutionsVisible = new Set<number>();
  expandedSolutions = new Set<number>();

  readonly BRANCH_IMG = 'assets/animations/branch_4.svg';
  readonly FLOWER_IMG = 'assets/animations/dandelion.svg';

  storyNodes:any = [];

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
    this.storyNodes.forEach((node:any) => {
      // Find the best matching breakpoint (largest minWidth that is <= current width)
      const match = node.responsivePositions
        .sort((a:any, b:any) => b.minWidth - a.minWidth) // Sort descending
        .find((bp:any) => width >= bp.minWidth);

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
      style.top = `${flowerTop + 8}%`; // Bottom of flower
    } else {
      style.top = `${flowerTop - 37}%`; // Top of flower
    }
    return style;
  }

  toggleSolution(index: number) {
    if (this.expandedSolutions.has(index)) {
      this.expandedSolutions.delete(index);
    } else {
      this.expandedSolutions.add(index);
    }
  }

  fetchPageData(): void {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${VOICE_ANIMATION}`).then((data: any) => {
      this.pageData = data.data.slice(0,4)
      d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${VOICE_ANIMATION_RESOLUTIONS}`).then((response: any) => {
        console.log(response);
        this.storyNodes = response.map((element:any,index:number)=> {
          element.problem = this.pageData[index].challenge
          element.author = this.pageData[index].role + ', ' + this.pageData[index].district + ', ' + this.pageData[index].state,
          element.solution = this.pageData[index].solutions[0].solution;
          return element;
        })
        this.updatePositions();
        this.playAnimation();
      }).catch((error: any) => {
        console.error('Error loading page data:', error);
      });
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

  delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
}
