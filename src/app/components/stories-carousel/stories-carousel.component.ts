import {Component,OnInit,OnDestroy,Renderer2,NgZone} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImprovementStoryComponent } from '../improvement-story/improvement-story.component';
import { UtilsService } from '../../services/utils.services';
import { firebaseService } from '../../../firebase/firestore-service';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { STORY_OF_THE_WEEK } from '../../../constants/urlConstants';

@Component({
  selector: 'app-stories-carousel',
  standalone: true,
  imports: [CommonModule, ImprovementStoryComponent],
  templateUrl: './stories-carousel.component.html',
  styleUrl: './stories-carousel.component.scss'
})

export class StoriesCarouselComponent implements OnInit, OnDestroy {
  slides: any[] = [];
  browserId: any;
  chunkedSlides: any[][] = [];
  extendedSlides: any[][] = []; // Holds chunks + clones
  currentChunkIndex: number = 1; // Start at 1 because 0 is a clone
  slideInterval: any;
  autoSlideDelay: number = 5000;
  chunkSize: number = 2;
  private resizeHandler: () => void;
  isModalOpen = false;
  isTransitioning = false; // To prevent rapid clicks messing up transition

  constructor(private utils: UtilsService,private sg: firebaseService,private renderer: Renderer2,private ngZone: NgZone  ) {
    this.resizeHandler = this.adjustChunkSize.bind(this);
  }

  ngOnInit() {
    this.adjustChunkSize();
    window.addEventListener('resize', this.resizeHandler);
    setTimeout(() => {
      this.startAutoSlide();
    }, 0);

    this.ngZone.runOutsideAngular(() => {
      d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${STORY_OF_THE_WEEK}`).then((data: any) => {
      this.ngZone.run(() => {
      const currentWeek = this.getWeekNumber(new Date());
      this.slides = this.getStoriesForWeek(data?.data ?? [], currentWeek);
      this.slides = this.utils.assignColorsToStories(this.slides)

      this.updateChunks();
          this.loadStoryCounts();
      });
      }).catch(err => console.error(err));
    });
  }


  async loadStoryCounts() {
    try {
        this.browserId = this.utils.getBrowserId();
        const storyIds = this.slides.map(s => s.id);
        if (!storyIds.length) return;

        const counts = await this.sg.getStoryCountsBulk(storyIds, this.browserId);

        this.slides = this.slides.map(slide => ({
          ...slide,
          ...counts.find(c => c.storyId === slide.id)
        }));
    } catch {
        this.slides = this.slides.map((slide: any) => ({
          ...slide,
          likesCount: slide.likesCount ?? 0,
          shareCount: slide.shareCount ?? 0,
          downloadCount: slide.downloadCount ?? 0,
          like: slide.like ?? 0
        }));
      } finally {
        this.updateChunks();
      }
  }

  updateStory(updatedStory: any){
    if(!updatedStory) return
    this.slides = this.slides.map(story =>
      story.id === updatedStory.id ? {
        ...story,
        likesCount:updatedStory.likesCount,
        shareCount:updatedStory.shareCount,
        like:updatedStory.like
      } : story
    );
    this.updateChunks();
  }

  adjustChunkSize() {
    const newChunkSize = window.innerWidth < 768 ? 1 : 2;
    if (newChunkSize !== this.chunkSize) {
      this.chunkSize = newChunkSize;
      this.updateChunks();
    }
  }

 async  onStoryAction(event: any) {
    this.slides = event.status ? this.utils.updateStoryCounts(this.slides,event) : this.utils.updateStory(this.slides,event)
    this.updateChunks();
  }

  updateChunks() {
    this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);
    
    // Create extended slides with clones for infinite scroll
    if (this.chunkedSlides.length > 1) {
      const firstClone = this.chunkedSlides[0];
      const lastClone = this.chunkedSlides[this.chunkedSlides.length - 1];
      this.extendedSlides = [lastClone, ...this.chunkedSlides, firstClone];
      this.currentChunkIndex = 1; // Reset to first real slide
    } else {
      this.extendedSlides = [...this.chunkedSlides];
      this.currentChunkIndex = 0;
    }
    
    // Reset position without animation
    this.updateSlidePosition(false);
  }

  chunkArray(arr: any[], chunkSize: number): any[][] {
    const results = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      results.push(arr.slice(i, i + chunkSize));
    }
    return results;
  }

  getStoriesForWeek(stories: any[], weekNumber: number): any[] {
    if (!stories.length) return [];

    const visibleStoriesCount = 6;
    const startIndex = ((weekNumber - 1) % stories.length + stories.length) % stories.length;

    return Array.from({ length: visibleStoriesCount }, (_, index) => {
      return stories[(startIndex + index) % stories.length];
    });
  }

  getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  navigateSlide(direction: number, reset = true): void {
    if (this.isTransitioning || this.extendedSlides.length <= 1) return;

    this.currentChunkIndex += direction;
    this.isTransitioning = true;
    this.updateSlidePosition(true);

    if (reset) {
      this.resetAutoSlide();
    }

    // Handle infinite scroll loop
    const totalSlides = this.extendedSlides.length;
    
    if (this.currentChunkIndex === totalSlides - 1) {
      // Moved to last clone (copy of first), jump back to first real slide
      setTimeout(() => {
        this.currentChunkIndex = 1;
        this.updateSlidePosition(false);
        this.isTransitioning = false;
      }, 500); // Match transition duration
    } else if (this.currentChunkIndex === 0) {
      // Moved to first clone (copy of last), jump back to last real slide
      setTimeout(() => {
        this.currentChunkIndex = totalSlides - 2;
        this.updateSlidePosition(false);
        this.isTransitioning = false;
      }, 500);
    } else {
      setTimeout(() => {
        this.isTransitioning = false;
      }, 500);
    }
  }

  updateSlidePosition(animate: boolean) {
    const slidesArea = document.querySelector('.slides-area') as HTMLElement;
    if (!slidesArea) return;

    const slideWidth = slidesArea.offsetWidth;
    const scrollLeft = slideWidth * this.currentChunkIndex;

    if (animate) {
      this.renderer.setStyle(slidesArea, 'scrollBehavior', 'smooth');
    } else {
      this.renderer.setStyle(slidesArea, 'scrollBehavior', 'auto');
    }
    
    slidesArea.scrollLeft = scrollLeft;
  }

  startAutoSlide() {
    if (this.slideInterval) return;
    this.slideInterval = setInterval(() => {
      this.navigateSlide(1, false);
    }, this.autoSlideDelay);
  }

  stopAutoSlide(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  resetAutoSlide(): void {
    this.stopAutoSlide();
  this.startAutoSlide();
  }

  onPauseCarousel(fromModal = false) {
    if (fromModal) {
      this.isModalOpen = true;
    }
    this.stopAutoSlide();
  }

  onResumeCarousel(fromModal = false) {
    if (fromModal) {
      this.isModalOpen = false;
    }

    if (this.isModalOpen) return;

    this.startAutoSlide();
  }


  ngOnDestroy(): void {
    this.stopAutoSlide();
    window.removeEventListener('resize', this.resizeHandler);
  }
}
