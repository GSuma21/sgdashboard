import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ImprovementStoryComponent } from '../improvement-story/improvement-story.component';

@Component({
  selector: 'app-stories-carousel',
  standalone: true,
  imports: [CommonModule, ImprovementStoryComponent],
  templateUrl: './stories-carousel.component.html',
  styleUrl: './stories-carousel.component.scss'
})

export class StoriesCarouselComponent implements OnInit, OnDestroy {
  slides = [
    {
      title: 'Stars, Charts, and Change',
      subtitle: 'subtitle',
      leader: 'Women Leader',
      location: 'Karnool, Bihar',
      likes: 2203,
      reads: 2203,
      imageUrl: 'assets/image-1.jpg',
    },
    {
      title: 'One Centre, Many Futures',
      subtitle: 'Micro improvements',
      leader: 'Women Leader',
      location: 'Muzaffarpur, Bihar',
      likes: 1800,
      reads: 1900,
      imageUrl: 'assets/image-2.jpg',
    },
    {
      title: 'Digital Empowerment',
      subtitle: 'Community Upliftment',
      leader: 'Youth Volunteer',
      location: 'Patna, Bihar',
      likes: 1500,
      reads: 1800,
      imageUrl: 'assets/image-3.jpg',
    },
    {
      title: 'Rural Education Initiative',
      subtitle: 'Education',
      leader: 'School Principal',
      location: 'Gaya, Bihar',
      likes: 3100,
      reads: 2950,
      imageUrl: 'assets/image-4.jpg',
    },
  ];

  browserId:any;
  chunkedSlides: any[][] = [];

  currentChunkIndex: number = 0;
  slideInterval: any;
  autoSlideDelay: number = 5000;

  constructor() {}

  ngOnInit(): void {
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
  

 async  onStoryAction(event: any) {
    this.slides=this.utils.updateStoryCounts(this.slides,event)  
    this.chunkedSlides = this.chunkArray(this.slides, 2);
    this.startAutoSlide();
  }

  chunkArray(arr: any[], chunkSize: number): any[][] {
    const results = [];
    while (arr.length) {
      results.push(arr.splice(0, chunkSize));
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