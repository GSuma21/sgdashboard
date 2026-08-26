import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import { ProgramOutcomeCard } from '../outcomes-model/outcomes-model.config';

// The paginated program-card carousel shown in program mode, including its "partner"
// display variant and the truncated-label tooltip (both exclusive to this carousel —
// the unpaginated flat card list in the framework/narrative panel stays on
// OutcomesModelComponent and always renders the plain "outcome" style).
@Component({
  selector: 'app-outcomes-program-card-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outcomes-program-card-carousel.component.html',
  styleUrls: ['./outcomes-program-card-carousel.component.css'],
})
export class OutcomesProgramCardCarouselComponent {
  @Input() cards: ProgramOutcomeCard[] = [];
  @Input() cardVariant: 'outcome' | 'partner' = 'outcome';
  @Input() defaultCardLabelPrefix = '';
  @Input() defaultPartnerImage = '';
  @Input() defaultCtaLabel = '';
  @Input() prevLabel = '';
  @Input() nextLabel = '';
  @Input() cardPagesLabel = '';

  private readonly MOBILE_BREAKPOINT = 768;

  pageIndex = 0;
  perPage = this.cardsPerPage;

  tooltipText: string | null = null;
  tooltipTop = 0;
  tooltipLeft = 0;
  tooltipVisible = false;

  get isPartnerVariant(): boolean {
    return this.cardVariant === 'partner';
  }

  get visibleCards(): ProgramOutcomeCard[] {
    const startIndex = this.pageIndex * this.perPage;
    return this.cards.slice(startIndex, startIndex + this.perPage);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.cards.length / this.perPage));
  }

  get pages(): number[] {
    return Array.from({ length: this.pageCount }, (_, index) => index);
  }

  get canShowControls(): boolean {
    return this.cards.length > this.perPage;
  }

  get canGoToPrevious(): boolean {
    return this.pageIndex > 0;
  }

  get canGoToNext(): boolean {
    return this.pageIndex < this.pageCount - 1;
  }

  showPrevious(): void {
    this.pageIndex = this.clampPageIndex(this.pageIndex - 1, this.pageCount);
  }

  showNext(): void {
    this.pageIndex = this.clampPageIndex(this.pageIndex + 1, this.pageCount);
  }

  goToPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.pageCount) return;

    this.pageIndex = pageIndex;
  }

  // Called by the parent (via ViewChild) when the selected layer changes, so
  // pagination restarts for the newly-shown card set.
  reset(): void {
    this.pageIndex = 0;
  }

  getCardLabel(card: ProgramOutcomeCard, localIndex: number): string {
    const absoluteIndex = this.pageIndex * this.perPage + localIndex;

    return (
      card.label ||
      card.title ||
      card.name ||
      card.heading ||
      card.partner ||
      `${this.defaultCardLabelPrefix}${absoluteIndex + 1}`
    );
  }

  getCardDescription(card: ProgramOutcomeCard): string {
    return card.description || card.body || card.text || card.value || card.about_the_program_objective || '';
  }

  getCardImage(card: ProgramOutcomeCard): string {
    return card.src || card.logo || card.image || this.defaultPartnerImage;
  }

  getCardLink(card: ProgramOutcomeCard): string | undefined {
    return card.website || card.url;
  }

  isLabelTruncated(text: string, limit = 21): boolean {
    return !!text && text.length > limit;
  }

  showTooltip(event: MouseEvent, text: string): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.tooltipText = text;
    this.tooltipTop = rect.top - 8;
    this.tooltipLeft = rect.left + rect.width / 2;
    this.tooltipVisible = true;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
  }

  toggleTooltipMobile(event: MouseEvent, text: string): void {
    if (this.tooltipVisible && this.tooltipText === text) {
      this.hideTooltip();
    } else {
      this.showTooltip(event, text);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.program-mode-tag')) {
      this.hideTooltip();
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.hideTooltip();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.hideTooltip();

    const newPerPage = this.cardsPerPage;

    if (this.perPage !== newPerPage) {
      this.perPage = newPerPage;
      this.pageIndex = this.clampPageIndex(this.pageIndex, this.pageCount);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  private get cardsPerPage(): number {
    return this.isMobileViewport() ? 1 : 3;
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= this.MOBILE_BREAKPOINT;
  }

  private clampPageIndex(index: number, pageCount: number): number {
    return Math.max(0, Math.min(pageCount - 1, index));
  }
}
