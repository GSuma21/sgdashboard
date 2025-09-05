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
    if (this.slides && this.slides.length > 1) {
      this.displaySlides = [...this.slides, this.slides[0]];
    } else {
      this.displaySlides = this.slides;
    }
    this.startAutoPlay();
    this.transitionEndListener = () => this.onTransitionEnd();
    this.carouselTrack.nativeElement.addEventListener('transitionend', this.transitionEndListener);
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    if (this.carouselTrack && this.carouselTrack.nativeElement && this.transitionEndListener) {
      this.carouselTrack.nativeElement.removeEventListener('transitionend', this.transitionEndListener);
    }
  }

  startAutoPlay(): void {
    this.stopAutoPlay(); // Ensure no multiple intervals are running
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
    }
  }

  nextSlide(): void {
    this.currentSlide++;
    this.updateSlidePosition();
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.updateSlidePosition();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.updateSlidePosition();
    this.startAutoPlay(); // Restart autoplay when manually navigating
  }

  updateSlidePosition(animate = true): void {
    const track = this.carouselTrack.nativeElement;
    if (animate) {
      track.style.transition = 'transform 0.5s ease-in-out';
    } else {
      track.style.transition = 'none';
    }
    track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
  }

  onTransitionEnd(): void {
    if (this.currentSlide === this.slides.length) {
      this.currentSlide = 0;
      this.updateSlidePosition(false);
    }
  }
}
