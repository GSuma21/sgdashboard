import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderCarouselComponent } from './slider-carousel';

describe('SliderCarouselComponent', () => {
  let component: SliderCarouselComponent;
  let fixture: ComponentFixture<SliderCarouselComponent>;

  const testimonials = [
    { message: 'm1', name: 'n1' },
    { message: 'm2', name: 'n2' },
    { message: 'm3', name: 'n3' },
    { message: 'm4', name: 'n4' }
  ];

  beforeEach(async () => {
    TestBed.overrideComponent(SliderCarouselComponent, {
      set: {
        template: `
          <div #carousel></div>
          <div #carouselTrack><div></div></div>
        `
      }
    });

    await TestBed.configureTestingModule({
      imports: [SliderCarouselComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SliderCarouselComponent);
    component = fixture.componentInstance;
    component.testimonials = testimonials;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateVisibleSlides in ngAfterViewInit', () => {
    const updateSpy = spyOn(component, 'updateVisibleSlides');

    component.ngAfterViewInit();

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should set visibleSlides to 1 when width <= 768', () => {
    Object.defineProperty(component.carousel.nativeElement, 'offsetWidth', {
      value: 700,
      configurable: true
    });

    component.updateVisibleSlides();

    expect(component.visibleSlides).toBe(1);
  });

  it('should set visibleSlides to 2 when width <= 1024', () => {
    Object.defineProperty(component.carousel.nativeElement, 'offsetWidth', {
      value: 900,
      configurable: true
    });

    component.updateVisibleSlides();

    expect(component.visibleSlides).toBe(2);
  });

  it('should set visibleSlides to 3 when width > 1024', () => {
    Object.defineProperty(component.carousel.nativeElement, 'offsetWidth', {
      value: 1200,
      configurable: true
    });

    component.updateVisibleSlides();

    expect(component.visibleSlides).toBe(3);
  });

  it('should clamp currentIndex when out of bounds after resize', () => {
    Object.defineProperty(component.carousel.nativeElement, 'offsetWidth', {
      value: 1200,
      configurable: true
    });
    component.currentIndex = 10;

    component.updateVisibleSlides();

    expect(component.currentIndex).toBe(1);
  });

  it('should return transform based on current index and slide width', () => {
    Object.defineProperty(component.carouselTrack.nativeElement.children[0], 'offsetWidth', {
      value: 320,
      configurable: true
    });
    component.currentIndex = 2;

    const transform = component.getTransform();

    expect(transform).toBe('translateX(-640px)');
  });

  it('should return default transform when no testimonials', () => {
    component.testimonials = [];

    const transform = component.getTransform();

    expect(transform).toBe('translateX(0)');
  });

  it('should return default transform when no children in track', () => {
    (component as any).carouselTrack = { nativeElement: { children: [] } };

    const transform = component.getTransform();

    expect(transform).toBe('translateX(0)');
  });

  it('should move to previous slide when currentIndex > 0', () => {
    component.currentIndex = 2;
    const updateSpy = spyOn(component, 'updateVisibleSlides');

    component.prevSlide();

    expect(component.currentIndex).toBe(1);
    expect(updateSpy).toHaveBeenCalled();
  });

  it('should not move to previous slide when currentIndex is 0', () => {
    component.currentIndex = 0;
    const updateSpy = spyOn(component, 'updateVisibleSlides');

    component.prevSlide();

    expect(component.currentIndex).toBe(0);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should move to next slide when not at boundary', () => {
    component.visibleSlides = 3;
    component.currentIndex = 0;
    const updateSpy = spyOn(component, 'updateVisibleSlides');

    component.nextSlide();

    expect(component.currentIndex).toBe(1);
    expect(updateSpy).toHaveBeenCalled();
  });

  it('should not move to next slide when at boundary', () => {
    component.visibleSlides = 3;
    component.currentIndex = 1;
    const updateSpy = spyOn(component, 'updateVisibleSlides');

    component.nextSlide();

    expect(component.currentIndex).toBe(1);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should call updateVisibleSlides on resize', () => {
    const updateSpy = spyOn(component, 'updateVisibleSlides');

    component.onResize({} as Event);

    expect(updateSpy).toHaveBeenCalled();
  });
});
