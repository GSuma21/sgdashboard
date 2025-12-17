import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ImprovementStoryComponent } from '../improvement-story/improvement-story.component';
import { SgFirebaseService } from '../../../firebase/firestore-service';

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
      likes: 2203,
      share:2203,
      download:2203,
      reads: 2203,
      imageUrl: 'assets/image-1.jpg',
    },
    {
      storyId:'1232',
      title: 'One Centre, Many Futures',
      subtitle: 'Micro improvements',
      leader: 'Women Leader',
      location: 'Muzaffarpur, Bihar',
      likes: 1800,
      share:2203,
      download:2203,
      reads: 1900,
      imageUrl: 'assets/image-2.jpg',
    },
    {
      storyId:'1233',
      title: 'Digital Empowerment',
      subtitle: 'Community Upliftment',
      leader: 'Youth Volunteer',
      location: 'Patna, Bihar',
      likes: 1500,
      share:2203,
      download:2203,
      reads: 1800,
      imageUrl: 'assets/image-3.jpg',
    },
    {
      storyId:'1234',
      title: 'Rural Education Initiative',
      subtitle: 'Education',
      leader: 'School Principal',
      location: 'Gaya, Bihar',
      likes: 3100,
      share:2203,
      download:2203,
      reads: 2950,
      imageUrl: 'assets/image-4.jpg',
    },
  ];

  // 2. New variable to hold groups of slides
  chunkedSlides: any[][] = [];

  // State Management
  currentChunkIndex: number = 0;
  slideInterval: any;
  autoSlideDelay: number = 5000;

  constructor() {}

  async ngOnInit(){
    // Split the raw slides into groups of 2
    this.chunkedSlides = this.chunkArray(this.slides, 2);
    this.startAutoSlide();
  }

  // Helper to chunk the array
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
