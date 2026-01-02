import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImprovementStoryComponent } from '../improvement-story/improvement-story.component';
import { UtilsService } from '../../services/utils.services';
import { firebaseService } from '../../../firebase/firestore-service';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { STORY_OF_THE_WEEK } from '../../../constants/urlConstants';
import { Renderer2 } from '@angular/core';
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
  currentChunkIndex: number = 0;
  slideInterval: any;
  autoSlideDelay: number = 5000;
  chunkSize: number = 2;
  private resizeHandler: () => void;

  constructor(private utils: UtilsService, private sg: firebaseService, private renderer: Renderer2 ) {
    this.resizeHandler = this.adjustChunkSize.bind(this);
  }

  async ngOnInit() {
    this.adjustChunkSize();

    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${STORY_OF_THE_WEEK}`).then(async (data: any) => {
      this.slides = data["data"];
      this.slides = this.utils.assignColorsToStories(this.slides)
      try {
        this.browserId = this.utils.getBrowserId();
        const storyIds = this.slides.map(s => s.id);

        if (!storyIds.length) {
          this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);
          this.startAutoSlide();
          return;
        }

        const counts = await this.sg.getStoryCountsBulk(storyIds, this.browserId);

        this.slides = this.slides.map(slide => ({
          ...slide,
          ...counts.find(c => c.storyId === slide.id)
        }));

      } catch (error) {
        console.error('Failed to load story counts:', error);
        this.slides = this.slides.map((slide: any) => ({
          ...slide,
          likesCount: slide.likesCount ?? 0,
          shareCount: slide.shareCount ?? 0,
          downloadCount: slide.downloadCount ?? 0,
          like: slide.like ?? 0
        }));
      } finally {
        this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);
        this.startAutoSlide();
      }
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });

    window.addEventListener('resize', this.resizeHandler);
  }

  adjustChunkSize() {
    const screenWidth = window.innerWidth;
  
    const newChunkSize = screenWidth < 768 ? 1 : 2;
  
    if (newChunkSize !== this.chunkSize) {
      this.chunkSize = newChunkSize;
      this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);
  
      if (this.currentChunkIndex >= this.chunkedSlides.length) {
        this.currentChunkIndex = this.chunkedSlides.length - 1;
      }
    }
  }

 async  onStoryAction(event: any) {
    this.slides = event.status ? this.utils.updateStoryCounts(this.slides,event) : this.utils.updateStory(this.slides,event)
    this.chunkedSlides = this.chunkArray(this.slides, 2);
  }

  chunkArray(arr: any[], chunkSize: number): any[][] {
    const results = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      results.push(arr.slice(i, i + chunkSize));
    }
    return results;
  }

  navigateSlide(direction: number, reset = true): void {
    this.currentChunkIndex =
      (this.currentChunkIndex + direction + this.chunkedSlides.length) %
      this.chunkedSlides.length;
  
    const slidesArea = document.querySelector('.slides-area') as HTMLElement;
    const slideWidth = slidesArea.offsetWidth;
  
    this.renderer.setStyle(slidesArea, 'scrollBehavior', 'smooth');
    slidesArea.scrollLeft = slideWidth * this.currentChunkIndex;
  
    if (reset) {
      this.resetAutoSlide();
    }
  }
  
  startAutoSlide(): void {
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

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    window.removeEventListener('resize', this.resizeHandler);
  }
}