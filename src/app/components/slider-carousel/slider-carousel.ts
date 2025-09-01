import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, AfterViewInit, HostListener, Input } from '@angular/core';

@Component({
  selector: 'app-slider-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slider-carousel.html',
  styleUrls: ['./slider-carousel.scss']
})
export class SliderCarouselComponent implements AfterViewInit {
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;
  @ViewChild('carousel') carousel!: ElementRef;
  @Input() testimonials: any[] = [];

  colors = ['#00cd6b', '#9e00d7', '#3887fd']; // Green, Purple, Blue
  currentIndex = 0;
  visibleSlides = 3; // Default for desktop

  ngAfterViewInit() {
    this.updateVisibleSlides();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateVisibleSlides();
  }

  updateVisibleSlides() {
    if (this.carousel) {
      const carouselWidth = this.carousel.nativeElement.offsetWidth;
      // Assuming a slide has a padding of 0.5rem on each side (1rem total)
      // and a base width that scales with flex-basis.
      // We can approximate the slide width or get it more accurately if needed.
      // For now, let's use breakpoints similar to CSS.
      if (carouselWidth <= 768) {
        this.visibleSlides = 1;
      } else if (carouselWidth <= 1024) {
        this.visibleSlides = 2;
      } else {
        this.visibleSlides = 3;
      }
      // Ensure currentIndex doesn't go out of bounds after resize
      if (this.currentIndex > this.testimonials.length - this.visibleSlides) {
        this.currentIndex = Math.max(0, this.testimonials.length - this.visibleSlides);
      }
    }
  }

  getTransform() {
    if (this.carouselTrack && this.carouselTrack.nativeElement.children.length > 0 && this.testimonials.length > 0) {
      // Calculate the width of a single slide including its padding
      const slideWidth = this.carouselTrack.nativeElement.children[0].offsetWidth;
      return `translateX(-${this.currentIndex * slideWidth}px)`;
    }
    return 'translateX(0)';
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateVisibleSlides() 
    }
  }

  nextSlide() {
    if (this.currentIndex < this.testimonials.length - this.visibleSlides) {
      this.currentIndex++;
      this.updateVisibleSlides() 
    }
  }
}