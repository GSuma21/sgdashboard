import { Component, Input, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.html',
  styleUrls: ['./carousel.css']
})
export class CarouselComponent implements AfterViewInit, OnDestroy {
  @Input() slides: any[] = [];
  @Input() styles: any = {};
  @Input() title: string = '';
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;

  currentSlide = 0;
  private intervalId: any;
  public displaySlides: any[] = [];
  private transitionEndListener: any;

  ngAfterViewInit(): void {
    this.updateDisplaySlides();
    this.startAutoPlay();
    this.transitionEndListener = () => this.onTransitionEnd();
    this.carouselTrack.nativeElement.addEventListener('transitionend', this.transitionEndListener);
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    if (this.carouselTrack?.nativeElement && this.transitionEndListener) {
      this.carouselTrack.nativeElement.removeEventListener('transitionend', this.transitionEndListener);
    }
  }

  // Update display slides to support infinite looping
  private updateDisplaySlides(): void {
    if (this.slides?.length > 1) {
      // Append first slide at the end and last slide at the beginning for seamless looping
      this.displaySlides = [this.slides[this.slides.length - 1], ...this.slides, this.slides[0]];
      this.currentSlide = 1; // Start at the first "real" slide
    } else {
      this.displaySlides = this.slides;
      this.currentSlide = 0;
    }
    this.updateSlidePosition(false); // Set initial position without animation
  }

  startAutoPlay(): void {
    this.stopAutoPlay(); // Clear any existing interval
    if (!this.slides || this.slides.length < 2) {
      return;
    }
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 3000); // Change slide every 3 seconds
  }

  stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  nextSlide(): void {
    this.currentSlide++;
    this.updateSlidePosition(true);
  }

  prevSlide(): void {
    this.currentSlide--;
    this.updateSlidePosition(true);
  }

  goToSlide(index: number): void {
    if (this.slides.length > 1) {
      this.currentSlide = index + 1; // Account for the prepended slide
    } else {
      this.currentSlide = index;
    }
    this.updateSlidePosition(true);
    this.startAutoPlay(); // Restart autoplay on manual navigation
  }

  updateSlidePosition(animate: boolean = true): void {
    const track = this.carouselTrack.nativeElement;
    if (animate) {
      track.style.transition = 'transform 0.5s ease-in-out';
    } else {
      track.style.transition = 'none';
    }
    track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
  }

  onTransitionEnd(): void {
    if (!this.slides || this.slides.length < 2) {
      return;
    }
    const track = this.carouselTrack.nativeElement;
    if (this.currentSlide >= this.displaySlides.length - 1) {
      // Reached the duplicated first slide at the end
      this.currentSlide = 1; // Reset to the first "real" slide
      this.updateSlidePosition(false); // Move without animation
    } else if (this.currentSlide <= 0) {
      // Reached the duplicated last slide at the beginning
      this.currentSlide = this.slides.length; // Reset to the last "real" slide
      this.updateSlidePosition(false); // Move without animation
    }
  }
}
