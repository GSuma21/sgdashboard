import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy , ChangeDetectorRef} from '@angular/core';
import { ImprovementStoryComponent } from '../improvement-story/improvement-story.component';
import { UtilsService } from '../../services/utils.services';
import { firebaseService } from '../../../firebase/firestore-service';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { STORY_OF_THE_WEEK  } from '../../../constants/urlConstants';

@Component({
  selector: 'app-stories-carousel',
  standalone: true,
  imports: [CommonModule, ImprovementStoryComponent],
  templateUrl: './stories-carousel.component.html',
  styleUrl: './stories-carousel.component.scss'
})

export class StoriesCarouselComponent implements OnInit, OnDestroy {
  slides: any[] = [];

  browserId:any;
  chunkedSlides: any[][] = [];

  currentChunkIndex: number = 0;
  slideInterval: any;
  autoSlideDelay: number = 5000;

  constructor(private utils:UtilsService,private sg:firebaseService, private cdr: ChangeDetectorRef) {}
  async ngOnInit() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${STORY_OF_THE_WEEK}`).then(async (data: any) => {
      this.slides= data["data"];
      try {
        this.browserId = this.utils.getBrowserId();

        const storyIds = this.slides.map(s => s.id);

        if (!storyIds.length) {
          this.chunkedSlides = this.chunkArray(this.slides, 2);
          this.startAutoSlide();
          return;
        }

        const counts= await this.sg.getStoryCountsBulk(storyIds,this.browserId);

        this.slides = this.slides.map(slide => ({
          ...slide,
          ...counts.find(c => c.storyId === slide.id)
        }));

        console.log('slides--2',this.slides)

      } catch (error) {

        console.error('Failed to load story counts:', error);

        this.slides = this.slides.map((slide:any) => ({
          ...slide,
          likesCount: slide.likesCount ?? 0,
          shareCount: slide.shareCount ?? 0,
          downloadCount: slide.downloadCount ?? 0,
          like:slide.like ?? 0
        }));

      } finally {
        this.chunkedSlides = this.chunkArray(this.slides, 2);
        this.startAutoSlide();
      }
      console.log(data, "story of the week")
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

 async  onStoryAction(event: any) {
    this.slides=this.utils.updateStoryCounts(this.slides,event)
    this.chunkedSlides = this.chunkArray(this.slides, 2);
    this.startAutoSlide();
  }

  chunkArray(arr: any[], chunkSize: number): any[][] {
    const results = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      results.push(arr.slice(i, i + chunkSize));
    }
    return results;
  }

  nextSlide(): void {
    this.currentChunkIndex = (this.currentChunkIndex + 1) % this.chunkedSlides.length;
  
    const slidesArea = document.querySelector('.slides-area') as HTMLElement;
    const slideWidth = slidesArea.offsetWidth; 
    slidesArea.scrollTo({
      left: slideWidth * this.currentChunkIndex,
      behavior: 'smooth'
    });
  
    this.resetAutoSlide();
  }
  
  prevSlide(): void {
    this.currentChunkIndex = (this.currentChunkIndex - 1 + this.chunkedSlides.length) % this.chunkedSlides.length;
  
    const slidesArea = document.querySelector('.slides-area') as HTMLElement;
    const slideWidth = slidesArea.offsetWidth;
    slidesArea.scrollTo({
      left: slideWidth * this.currentChunkIndex,
      behavior: 'smooth'
    });
  
    this.resetAutoSlide();
  }
  

  startAutoSlide(): void {
      this.slideInterval = setInterval(() => {
        this.nextSlide();
      }, this.autoSlideDelay);

  }

  resetAutoSlide(): void {
    clearInterval(this.slideInterval);
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
}
