import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy , ChangeDetectorRef} from '@angular/core';
import { ImprovementStoryComponent } from '../improvement-story/improvement-story.component';
import { UtilsService } from '../../services/utils.services';
import { firebaseService } from '../../../firebase/firestore-service';

@Component({
  selector: 'app-stories-carousel',
  standalone: true,
  imports: [CommonModule, ImprovementStoryComponent],
  templateUrl: './stories-carousel.component.html',
  styleUrl: './stories-carousel.component.scss'
})

export class StoriesCarouselComponent implements OnInit, OnDestroy {
  // 1. Raw Data (Add enough items to test multiple pages)
  slides = [
    {
      storyId:'1231',
      title: 'Stars, Charts, and Change',
      subtitle: 'subtitle',
      leader: 'Women Leader',
      location: 'Karnool, Bihar',
      reads: 2203,
      imageUrl: 'assets/image-1.jpg',
    },
    {
      storyId:'1232',
      title: 'One Centre, Many Futures',
      subtitle: 'Micro improvements',
      leader: 'Women Leader',
      location: 'Muzaffarpur, Bihar',
      reads: 1900,
      imageUrl: 'assets/image-2.jpg',
    },
    {
      storyId:'1243',
      title: 'Digital Empowerment',
      subtitle: 'Community Upliftment',
      leader: 'Youth Volunteer',
      location: 'Patna, Bihar',
      reads: 1800,
      imageUrl: 'assets/image-3.jpg',
    },
    {
      storyId:'1247',
      title: 'Rural Education Initiative',
      subtitle: 'Education',
      leader: 'School Principal',
      location: 'Gaya, Bihar',
      reads: 2950,
      imageUrl: 'assets/image-4.jpg',
    },
  ];

  browserId:any;
  chunkedSlides: any[][] = [];

  // State Management
  currentChunkIndex: number = 0;
  slideInterval: any;
  autoSlideDelay: number = 5000;

  constructor(private utils:UtilsService,private sg:firebaseService, private cdr: ChangeDetectorRef) {}
  async ngOnInit() {
    try {
      this.browserId = this.utils.getBrowserId();
  
      const storyIds = this.slides.map(s => s.storyId);

      if (!storyIds.length) {
        this.chunkedSlides = this.chunkArray(this.slides, 2);
        this.startAutoSlide();
        return;
      }
  
      const counts = await this.sg.getStoryCountsBulk(storyIds,this.browserId);

      this.slides = this.slides.map(slide => ({
        ...slide,
        ...counts.find(c => c.storyId === slide.storyId)
      }));
  
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
  }
  

 async  onActionCompleted(event: any) {
    this.slides=this.utils.updateStoryCounts(this.slides,event)  
    this.chunkedSlides = this.chunkArray(this.slides, 2);
    this.cdr.detectChanges();
  }

  // Helper to chunk the array
  chunkArray(arr: any[], chunkSize: number): any[][] {
    const results = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      results.push(arr.slice(i, i + chunkSize));
    }
    return results;
  }

  nextSlide(): void {
    this.currentChunkIndex = (this.currentChunkIndex + 1) % this.chunkedSlides.length;
    this.resetAutoSlide();
  }

  prevSlide(): void {
    this.currentChunkIndex = (this.currentChunkIndex - 1 + this.chunkedSlides.length) % this.chunkedSlides.length;
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
