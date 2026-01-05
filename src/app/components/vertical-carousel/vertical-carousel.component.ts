import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { MICRO_IMPROVEMENT_FEED } from '../../../constants/urlConstants';

@Component({
  selector: 'app-vertical-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vertical-carousel.component.html',
  styleUrl: './vertical-carousel.component.scss'
})
export class VerticalCarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollTrack') scrollTrack!: ElementRef<HTMLElement>;
  @ViewChildren('feedCard') feedCards!: QueryList<ElementRef<HTMLElement>>;

 feedData:any;

  extendedFeed: any[] = [];
  currentIndex = 0;
  private intervalId: any;
  private transitionDuration = 500;
  private pauseDuration = 3000;
  isHovering: boolean = false;


  ngOnInit() {
    this.getFeedData()
  }

  getFeedData() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${MICRO_IMPROVEMENT_FEED}`).then((data: any) => {
      this.feedData = data["data"];
      if (this.feedData) {
        this.extendedFeed = [...this.feedData, ...this.feedData, ...this.feedData];
        this.currentIndex = this.feedData.length;
      }
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updatePosition(false);
      this.startCarousel();
    }, 100);
  }

  ngOnDestroy() {
    this.stopCarousel();
  }

  startCarousel() {
    this.stopCarousel();
    if (!this.isHovering) {
    this.intervalId = setInterval(() => {
      this.moveNext();
    }, this.pauseDuration);
  }
  }

  stopCarousel() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  moveNext() {
    this.currentIndex--;
    this.updatePosition(true);

    const totalOriginal = this.feedData.length;
    if (this.currentIndex < totalOriginal) {
      setTimeout(() => {
        this.currentIndex = this.currentIndex + totalOriginal;
        this.updatePosition(false);
      }, this.transitionDuration);
    }
  }

  updatePosition(animate: boolean) {
    if (!this.scrollTrack || !this.feedCards) return;

    const track = this.scrollTrack.nativeElement;
    const cards = this.feedCards.toArray();
    const containerHeight = track.parentElement?.offsetHeight || 0;

    let cumulativeTop = 0;
    for (let i = 0; i < this.currentIndex; i++) {
      const cardEl = cards[i]?.nativeElement;
      if (cardEl) {
        const style = window.getComputedStyle(cardEl);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        cumulativeTop += cardEl.offsetHeight + marginTop + marginBottom;
      }
    }

    const currentCardEl = cards[this.currentIndex]?.nativeElement;
    let currentCardHalfHeight = 0;
    if (currentCardEl) {
       currentCardHalfHeight = currentCardEl.offsetHeight / 2;
    }

    
    cumulativeTop = 0;
    for (let i = 0; i < this.currentIndex; i++) {
        const cardEl = cards[i]?.nativeElement;
        if (cardEl) {
             const style = window.getComputedStyle(cardEl);
             const marginTop = parseFloat(style.marginTop) || 0;
             const marginBottom = parseFloat(style.marginBottom) || 0;
             cumulativeTop += cardEl.offsetHeight + marginTop + marginBottom;
        }
    }
    
    const currentStyle = currentCardEl ? window.getComputedStyle(currentCardEl) : null;
    const currentMarginTop = currentStyle ? parseFloat(currentStyle.marginTop) || 0 : 0;
    
    const cardTop = cumulativeTop + currentMarginTop;
    
    const translateY = (containerHeight / 2) - (cardTop + currentCardHalfHeight);

    track.style.transition = animate ? `transform ${this.transitionDuration}ms ease-in-out` : 'none';
    track.style.transform = `translateY(${translateY}px)`;
  }

  onCardHover(isHovered: boolean): void {
    this.isHovering = isHovered;
    this.isHovering ? this.stopCarousel() : this.startCarousel();
  }
}
