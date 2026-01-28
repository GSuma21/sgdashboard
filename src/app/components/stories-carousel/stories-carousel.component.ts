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
  currentChunkIndex: number = 0;
  slideInterval: any;
  autoSlideDelay: number = 5000;
  chunkSize: number = 2;
  private resizeHandler: () => void;
  isModalOpen = false;

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
      this.slides = data.data.length < currentWeek - 7 ? data?.data?.slice(data.data.length - 8, data.data.length - 2) : data?.data?.slice(currentWeek + 1, currentWeek + 7) || data?.data?.slice(0, 6);
      this.slides = this.utils.assignColorsToStories(this.slides)

      this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);
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
        this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);
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
    this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);
  }

  adjustChunkSize() {
    const newChunkSize = window.innerWidth < 768 ? 1 : 2;
    if (newChunkSize !== this.chunkSize) {
      this.chunkSize = newChunkSize;
      this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);

    }
  }

 async  onStoryAction(event: any) {
    this.slides = event.status ? this.utils.updateStoryCounts(this.slides,event) : this.utils.updateStory(this.slides,event)
    this.chunkedSlides = this.chunkArray(this.slides, this.chunkSize);
  }

  chunkArray(arr: any[], chunkSize: number): any[][] {
    const results = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      results.push(arr.slice(i, i + chunkSize));
    }
    return results;
  }

  getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
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
