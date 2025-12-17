import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';

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

  feedData: any = [
    {
      id: 1,
      mainText: "The Head teacher went door-to-door in the village to raise awareness about education. At school, children were encouraged using charts and were especially recognised if they had over 80% attendance. For children who were not coming to school, they were reached out through Meena Manch.",
      highlightedText: "The children who had dropped out of school have started coming to school again",
      author: "Community Coordinator",
      location: "Muzaffarpur, Bihar",
      type: 'education'
    },
    {
      id: 2,
      mainText: "Told parents about the deficiencies in their child's education, Used storytelling to convey the importance of education",
      highlightText: "People from the community came to learn about the importance of education",
      author: "Samaj Sewa",
      location: "Sitamarhi, Bihar",
      type: 'education'
    },
    {
      id: 3,
      mainText: "Discussed the issue in the school management committee meeting. Met with gram panchayat members to request local transport support. Arranged a shared auto service for children from distant hamlets",
      highlightedText: "Attendance improved from 68% to over 90%, children are more regular and punctual, and parents feel more connected to the school",
      author: "Headmaster",
      location: "Sitamarhi, Bihar",
      type: 'education'
    },
    {
      id: 4,
      mainText: "I along with members of Meena Manch visited a girl's home, spoke with her parents about the illegality and consequences of child marriage, and encouraged them to cancel the wedding plans.",
      highlightedText: "The intervention successfully convinced the parents, protecting the girl and cancelling the child marriage.",
      author: "Cluster State Coordinator",
      location: "Muzaffarpur, Bihar",
      type: 'social'
    }
  ];

  extendedFeed: any[] = [];
  currentIndex = 0; // Will be initialized to start of middle buffer
  private intervalId: any;
  private transitionDuration = 500;
  private pauseDuration = 3000;

  ngOnInit() {
    // Create triple buffer: [Clone Before] [Original] [Clone After]
    // Actually, simpler: [Original] [Original] [Original]
    // We start in the middle set.
    this.extendedFeed = [...this.feedData, ...this.feedData, ...this.feedData];
    this.currentIndex = this.feedData.length; // Start at the first item of the middle set
  }

  ngAfterViewInit() {
    // Start the carousel after a brief delay to ensure layout is stable
    setTimeout(() => {
      this.updatePosition(false); // Initial positioning without animation
      this.startCarousel();
    }, 100);
  }

  ngOnDestroy() {
    this.stopCarousel();
  }

  startCarousel() {
    this.stopCarousel();
    this.intervalId = setInterval(() => {
      this.moveNext();
    }, this.pauseDuration);
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

    // Check for reset needs after transition
    const totalOriginal = this.feedData.length;
    // If we moved past the start of the middle set (into the pre-buffer)
    if (this.currentIndex < totalOriginal) {
      setTimeout(() => {
        // Jump forward to the end of the middle set (same item, different buffer position)
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

    // Calculate position to center the current card
    // We need the sum of heights of all cards before current
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

    // Add half height of current card to center it
    const currentCardEl = cards[this.currentIndex]?.nativeElement;
    let currentCardHalfHeight = 0;
    if (currentCardEl) {
       currentCardHalfHeight = currentCardEl.offsetHeight / 2;
    }

    // Target transform: center of container - center of card - cumulative top
    // center of container = containerHeight / 2
    // center of card relative to track top = cumulativeTop + currentCardHalfHeight
    // translateY = (containerHeight / 2) - (cumulativeTop + currentCardHalfHeight)
    
    // However, cumulativeTop includes the margin of the current card if we added it in the loop?
    // In the loop above, we iterate i < currentIndex, so we summed up to the *start* of the current card (including its top margin if it was part of previous card's bottom margin logic, but margins collapse... simplified: sum of outerHeights).
    
    // Let's refine the loop.
    // We need exact top position of the current card relative to the track.
    // Since we are using flex column, margins might not collapse if we have padding, but usually they do.
    // Safest is to just sum offsetHeight + marginBottom of previous cards, plus marginTop of current.
    
    // Re-calculating cumulativeTop more carefully
    cumulativeTop = 0;
    for (let i = 0; i < this.currentIndex; i++) {
        const cardEl = cards[i]?.nativeElement;
        if (cardEl) {
             const style = window.getComputedStyle(cardEl);
             // For flex column, margins don't collapse between flex items.
             const marginTop = parseFloat(style.marginTop) || 0;
             const marginBottom = parseFloat(style.marginBottom) || 0;
             cumulativeTop += cardEl.offsetHeight + marginTop + marginBottom;
        }
    }
    
    // Add current card's top margin to get to its border box top
    const currentStyle = currentCardEl ? window.getComputedStyle(currentCardEl) : null;
    const currentMarginTop = currentStyle ? parseFloat(currentStyle.marginTop) || 0 : 0;
    
    const cardTop = cumulativeTop + currentMarginTop;
    
    const translateY = (containerHeight / 2) - (cardTop + currentCardHalfHeight);

    track.style.transition = animate ? `transform ${this.transitionDuration}ms ease-in-out` : 'none';
    track.style.transform = `translateY(${translateY}px)`;
  }
}
