import { ComponentFixture, TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';

import { VerticalCarouselComponent } from './vertical-carousel.component';

describe('VerticalCarouselComponent', () => {
  let component: VerticalCarouselComponent;
  let fixture: ComponentFixture<VerticalCarouselComponent>;
  const feedItems = [
    { action_step: 'A1', impact: 'I1', role: 'R1', district: 'D1', state: 's1' },
    { action_step: 'A2', impact: 'I2', role: 'R2', district: 'D2', state: 's2' }
  ];

  beforeEach(async () => {
    spyOn(window, 'fetch').and.callFake(async () =>
      new Response(JSON.stringify({ data: feedItems }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await TestBed.configureTestingModule({
      imports: [VerticalCarouselComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerticalCarouselComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getFeedData on init', () => {
    const getFeedSpy = spyOn(component, 'getFeedData');

    component.ngOnInit();

    expect(getFeedSpy).toHaveBeenCalled();
  });

  it('should set feed data and extended feed when getFeedData succeeds', async () => {
    component.getFeedData();
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(component.feedData).toEqual(feedItems);
    expect(component.extendedFeed.length).toBe(6);
    expect(component.currentIndex).toBe(2);
  });

  it('should log error when getFeedData fails', async () => {
    const errorSpy = spyOn(console, 'error');
    (window.fetch as jasmine.Spy).and.returnValue(Promise.reject(new Error('network')));

    component.getFeedData();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should initialize position and start carousel in ngAfterViewInit', fakeAsync(() => {
    const updateSpy = spyOn(component, 'updatePosition');
    const startSpy = spyOn(component, 'startCarousel');

    component.ngAfterViewInit();
    tick(100);

    expect(updateSpy).toHaveBeenCalledWith(false);
    expect(startSpy).toHaveBeenCalled();
  }));

  it('should start carousel interval when not hovering', fakeAsync(() => {
    component.feedData = feedItems;
    component.isHovering = false;
    const moveSpy = spyOn(component, 'moveNext');

    component.startCarousel();
    tick(3000);

    expect(moveSpy).toHaveBeenCalled();
  }));

  it('should not start carousel interval while hovering', fakeAsync(() => {
    component.isHovering = true;
    const moveSpy = spyOn(component, 'moveNext');

    component.startCarousel();
    tick(3500);

    expect(moveSpy).not.toHaveBeenCalled();
  }));

  it('should stop carousel and clear interval', () => {
    const clearSpy = spyOn(window, 'clearInterval').and.callThrough();
    component.startCarousel();

    component.stopCarousel();

    expect(clearSpy).toHaveBeenCalled();
  });

  it('should move next and wrap to middle block when index crosses boundary', fakeAsync(() => {
    component.feedData = feedItems;
    component.currentIndex = 1;
    const updateSpy = spyOn(component, 'updatePosition');

    component.moveNext();
    expect(component.currentIndex).toBe(0);
    expect(updateSpy).toHaveBeenCalledWith(true);

    tick(500);
    expect(component.currentIndex).toBe(2);
    expect(updateSpy).toHaveBeenCalledWith(false);
  }));

  it('should move next without wrap when index is still in middle block', () => {
    component.feedData = [{}, {}, {}, {}];
    component.currentIndex = 5;
    const updateSpy = spyOn(component, 'updatePosition');

    component.moveNext();

    expect(component.currentIndex).toBe(4);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(true);
  });

  it('should return early in updatePosition when view refs are missing', () => {
    component.scrollTrack = undefined as any;
    component.feedCards = undefined as any;

    expect(() => component.updatePosition(true)).not.toThrow();
  });

  it('should update track transform and transition in updatePosition', () => {
    const parentEl = document.createElement('div');
    Object.defineProperty(parentEl, 'offsetHeight', { value: 400, configurable: true });

    const trackEl = document.createElement('div');
    parentEl.appendChild(trackEl);
    component.scrollTrack = { nativeElement: trackEl } as any;

    const card1 = document.createElement('div');
    const card2 = document.createElement('div');
    card1.style.marginTop = '10px';
    card1.style.marginBottom = '10px';
    card2.style.marginTop = '10px';
    card2.style.marginBottom = '10px';
    Object.defineProperty(card1, 'offsetHeight', { value: 100, configurable: true });
    Object.defineProperty(card2, 'offsetHeight', { value: 120, configurable: true });

    component.feedCards = {
      toArray: () => [{ nativeElement: card1 }, { nativeElement: card2 }]
    } as any;
    component.currentIndex = 1;

    component.updatePosition(true);

    expect(trackEl.style.transition).toBe('transform 500ms ease-in-out');
    expect(trackEl.style.transform).toContain('translateY(');
  });

  it('should toggle hover state and stop/start carousel', () => {
    const stopSpy = spyOn(component, 'stopCarousel');
    const startSpy = spyOn(component, 'startCarousel');

    component.onCardHover(true);
    expect(component.isHovering).toBeTrue();
    expect(stopSpy).toHaveBeenCalled();

    component.onCardHover(false);
    expect(component.isHovering).toBeFalse();
    expect(startSpy).toHaveBeenCalled();
  });

  it('should stop carousel on destroy', () => {
    const stopSpy = spyOn(component, 'stopCarousel');

    component.ngOnDestroy();

    expect(stopSpy).toHaveBeenCalled();
  });
});
