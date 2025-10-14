import { Component, Input, OnInit, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partner-logos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partner-logos.html',
  styleUrls: ['./partner-logos.css']
})
export class PartnerLogosComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() partners: any[] = [];
  @Input() styles: any = {};
  @Input() title: string = '';
  @Input() showFilters:boolean = false;

  allLogos: any[] = [];
  filteredLogos: any[] = [];
  categories: string[] = [];
  activeCategory: string | null = null;

  private isMobile = window.innerWidth <= 768;
  private scrollerInner: HTMLElement | null = null;
  
  // --- Properties for Desktop CSS Animation ---
  private animationPaused = false;

  // --- Properties for Mobile JS Animation ---
  private scrollInterval: any;
  private userIsInteracting = false;
  private resumeTimeout: any;

  constructor(private elRef: ElementRef) {}

  ngOnInit(): void {
    this.allLogos = [...this.partners].sort((a, b) => a.name.localeCompare(b.name));
    this.categories = [
      ...new Set(
        this.partners.map(p => p.category).filter(category => category && category.trim() !== "")
      )
    ].sort((a, b) => a.localeCompare(b));
    this.filterLogos(null);
  }

  ngAfterViewInit(): void {
  this.scrollerInner = this.elRef.nativeElement.querySelector('.scroller__inner');
  if (this.isMobile) {
    setTimeout(() => {
      this.setupMobileJsAnimation();
    }, 100); // give DOM/images time to render
  } else {
    this.updateScrollSpeed();
    this.setupDesktopCssAnimation();
  }
}

  // --- Mobile-specific logic (JS Animation) ---
  private setupMobileJsAnimation() {
    const scroller = this.elRef.nativeElement.querySelector('.scroller');
    if (!scroller) return;

    scroller.addEventListener('touchstart', () => {
      this.userIsInteracting = true;
      clearTimeout(this.resumeTimeout);
      clearInterval(this.scrollInterval);
    }, { passive: true });

    scroller.addEventListener('touchend', () => {
      this.userIsInteracting = false;
      // Resume animation after a delay if user is not interacting
      this.resumeTimeout = setTimeout(() => {
        if (!this.userIsInteracting) {
          this.startJsScrollAnimation();
        }
      }, 2000); // 2-second delay
    }, { passive: true });

    this.startJsScrollAnimation();
  }

 private startJsScrollAnimation() {
  clearInterval(this.scrollInterval);
  const scroller = this.elRef.nativeElement.querySelector('.scroller') as HTMLElement;
  if (!scroller) return;

  const scrollSpeed = 1; // px per tick
  const frameRate = 30; // ms per tick

  this.scrollInterval = setInterval(() => {
    const totalScroll = scroller.scrollWidth;
    const visibleWidth = scroller.clientWidth;
    const duplicatedWidth = totalScroll / 2;

    // SAFER check: always let it scroll full width before reset
    if (scroller.scrollLeft >= duplicatedWidth) {
      scroller.scrollLeft = 0;
    } else {
      scroller.scrollLeft += scrollSpeed;
    }
  }, frameRate);
}


  // --- Desktop-specific logic (CSS Animation) ---
  private setupDesktopCssAnimation() {
    if (!this.scrollerInner) return;
    this.scrollerInner.addEventListener('touchstart', this.pauseAnimation);
    window.addEventListener('scroll', this.resumeAnimation, { passive: true });
    document.addEventListener('touchstart', this.handleOutsideTap);
  }

  private handleOutsideTap = (event: TouchEvent) => {
    if (this.animationPaused && this.scrollerInner && !this.scrollerInner.contains(event.target as Node)) {
      this.resumeAnimation();
    }
  };

  private pauseAnimation = () => {
    if (this.scrollerInner && !this.animationPaused) {
      this.scrollerInner.style.animationPlayState = 'paused';
      this.animationPaused = true;
    }
  };

  private resumeAnimation = () => {
    if (this.scrollerInner && this.animationPaused) {
      this.scrollerInner.style.animationPlayState = 'running';
      this.animationPaused = false;
    }
  };

  // --- Common Logic & Lifecycle Hooks ---
  ngOnDestroy(): void {
    if (this.isMobile) {
      clearInterval(this.scrollInterval);
      clearTimeout(this.resumeTimeout);
      // Note: No need to remove passive event listeners in most modern browsers
    } else {
      if (this.scrollerInner) {
        this.scrollerInner.removeEventListener('touchstart', this.pauseAnimation);
        window.removeEventListener('scroll', this.resumeAnimation);
        document.removeEventListener('touchstart', this.handleOutsideTap);
      }
    }
  }

  filterLogos(category: string | null): void {
    this.activeCategory = category;
    if (category) {
      this.filteredLogos = this.allLogos.filter(logo => logo.category === category).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      this.filteredLogos = this.allLogos;
    }

    // After filtering, restart the appropriate animation
    setTimeout(() => {
      if (this.isMobile) {
        this.startJsScrollAnimation();
      } else {
        this.updateScrollSpeed();
      }
    }, 0);
  }

  private updateScrollSpeed = () => {
    // This is only for the desktop CSS animation
    if (this.isMobile || !this.scrollerInner) return;
    
    const scroller = this.elRef.nativeElement.querySelector('.scroller') as HTMLElement;
    if (!scroller) return;

    requestAnimationFrame(() => {
      const contentWidth = this.scrollerInner!.scrollWidth || 1;
      const distance = contentWidth / 2;
      const deviceRatio = window.devicePixelRatio || 1;
      const refreshRate = (window.matchMedia('(min-resolution: 120dpi)').matches ? 120 : 60);
      const adjustment = (deviceRatio * refreshRate) / 60;
      const baseSpeed = 60; // px/sec
      const adjustedSpeed = baseSpeed * (1 / adjustment);
      const duration = distance / adjustedSpeed;
      this.scrollerInner!.style.animationDuration = `${duration}s`;
    });
  };
}