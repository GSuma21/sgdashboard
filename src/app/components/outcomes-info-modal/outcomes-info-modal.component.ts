import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { OutcomesListItem } from '../outcomes-model/outcomes-model.config';

// A focus-trapped, scroll-locking modal. Only ever rendered behind an *ngIf, so its
// own ngOnInit/ngOnDestroy double as "opened"/"closed" hooks — no explicit open/close
// methods needed on the host.
@Component({
  selector: 'app-outcomes-info-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outcomes-info-modal.component.html',
  styleUrls: ['./outcomes-info-modal.component.scss'],
})
export class OutcomesInfoModalComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() description = '';
  @Input() icon = '';
  @Input() color = '';
  @Input() listItems: OutcomesListItem[] = [];
  @Input() closeLabel = '';

  @Output() closed = new EventEmitter<void>();

  @ViewChild('modal') private modalRef?: ElementRef<HTMLElement>;
  @ViewChild('closeButton') private closeButtonRef?: ElementRef<HTMLButtonElement>;

  private static nextInstanceId = 0;
  readonly titleId = `outcomes-info-modal-title-${OutcomesInfoModalComponent.nextInstanceId++}`;

  private previouslyFocusedElement: HTMLElement | null = null;
  private focusTimerId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement | null;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    this.focusTimerId = setTimeout(() => this.closeButtonRef?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    if (this.focusTimerId) {
      clearTimeout(this.focusTimerId);
    }

    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    this.previouslyFocusedElement?.focus();
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown(): void {
    this.close();
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTabKeydown(event: Event): void {
    if (!this.modalRef) return;

    const keyboardEvent = event as KeyboardEvent;
    const focusable = this.modalRef.nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (keyboardEvent.shiftKey && document.activeElement === first) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
