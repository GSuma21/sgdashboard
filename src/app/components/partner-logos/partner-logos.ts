import { Component, Input, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partner-logos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partner-logos.html',
  styleUrls: ['./partner-logos.css']
})
export class PartnerLogosComponent implements OnInit, AfterViewInit {
  @Input() partners: any[] = [];
  @Input() styles: any = {};
  @Input() title: string = '';
  @Input() showFilters:boolean = false;

  allLogos: any[] = [];
  filteredLogos: any[] = [];
  categories: string[] = [];
  activeCategory: string | null = null;

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
    this.updateScrollSpeed();
  }

  filterLogos(category: string | null): void {
    this.activeCategory = category;
    if (category) {
      this.filteredLogos = this.allLogos.filter(logo => logo.category === category).sort((a, b) => a.name.localeCompare(b.name));
    } else {
      this.filteredLogos = this.allLogos;
    }

    setTimeout(() => this.updateScrollSpeed(), 0); // recalc after DOM update
  }

  /** Ensure consistent scroll speed */
  private updateScrollSpeed() {
    const scrollerInner: HTMLElement | null = this.elRef.nativeElement.querySelector('.scroller__inner');
    const scroller: HTMLElement | null = this.elRef.nativeElement.querySelector('.scroller');

    if (scrollerInner && scroller) {
      const contentWidth = scrollerInner.scrollWidth;
      const distance = contentWidth / 2; // we duplicate the logos for infinite scroll

      const pixelsPerSecond = 60; // 🔹 adjust this to control speed
      const duration = distance / pixelsPerSecond;

      scrollerInner.style.animationDuration = `${duration}s`;
    }
  }
}
