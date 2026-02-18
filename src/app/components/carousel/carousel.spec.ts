import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CarouselComponent } from './carousel';
import { NgZone } from '@angular/core';

describe('CarouselComponent', () => {
  let component: CarouselComponent;
  let fixture: ComponentFixture<CarouselComponent>;
  let zone: NgZone;

  const mockSlides = [
    { header: 'Slide 1', subHeader: 'Sub 1', description: 'Desc 1' },
    { header: 'Slide 2', subHeader: 'Sub 2', description: 'Desc 2' },
    { header: 'Slide 3', subHeader: 'Sub 3', description: 'Desc 3' },
  ];

  const mockStyles = {
    section: 'carousel-section',
    container: 'carousel-container',
    track: 'carousel-track',
    slide: 'carousel-slide',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarouselComponent);
    component = fixture.componentInstance;
    zone = TestBed.inject(NgZone);

    // prevent autoplay from running automatically during test initialization
    spyOn(component, 'startAutoPlay').and.callFake(() => {});

    // ✅ Assign slides & styles BEFORE detectChanges
    component.slides = [...mockSlides];
    component.styles = mockStyles;

    // prime displaySlides so that ngAfterViewInit doesn't change it later
    component.displaySlides = component.slides.length > 1 ? [...component.slides, component.slides[0]] : [...component.slides];

    // ✅ Mock carouselTrack ViewChild
    component.carouselTrack = {
      nativeElement: document.createElement('div'),
    } as any;

    fixture.detectChanges(); // triggers ngOnInit + ngAfterViewInit
    await fixture.whenStable();
    fixture.detectChanges(); // ensure no further expression-change errors
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // --------------------------------------------------
  // BASIC
  // --------------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize currentSlide to 0', () => {
    expect(component.currentSlide).toBe(0);
  });

  // --------------------------------------------------
  // DISPLAY SLIDES
  // --------------------------------------------------
  it('should append first slide for infinite effect when slides > 1', () => {
    expect(component.displaySlides.length).toBe(mockSlides.length + 1);
  });

  it('should render slides in DOM', () => {
    const slides = fixture.debugElement.queryAll(By.css('.carousel-slide'));
    expect(slides.length).toBe(component.displaySlides.length);
  });

  // --------------------------------------------------
  // AUTOPLAY
  // --------------------------------------------------
  it('should autoplay every 3 seconds', fakeAsync(() => {
    // restore real implementation for this test
    (component.startAutoPlay as jasmine.Spy).and.callThrough();

    component.currentSlide = 0;
    component.startAutoPlay();

    tick(3000);
    expect(component.currentSlide).toBe(1);

    tick(3000);
    expect(component.currentSlide).toBe(2);

    component.stopAutoPlay();
  }));

  it('should not autoplay if slides length < 2', fakeAsync(() => {
    (component.startAutoPlay as jasmine.Spy).and.callThrough();
    component.slides = [{ header: 'Only One' }];
    component.displaySlides = [...component.slides];
    component.startAutoPlay();

    tick(6000);
    expect(component.currentSlide).toBe(0);
    component.stopAutoPlay();
  }));

  it('should stop autoplay', () => {
    spyOn(window, 'clearInterval');
    (component.startAutoPlay as jasmine.Spy).and.callThrough();
    component.startAutoPlay();
    component.stopAutoPlay();
    expect(clearInterval).toHaveBeenCalled();
  });

  // --------------------------------------------------
  // NAVIGATION METHODS
  // --------------------------------------------------
  it('should increment slide on nextSlide()', () => {
    component.currentSlide = 0;
    component.nextSlide();
    expect(component.currentSlide).toBe(1);
  });

  it('should decrement slide on prevSlide()', () => {
    component.currentSlide = 1;
    component.prevSlide();
    expect(component.currentSlide).toBe(0);
  });

  it('should wrap around prevSlide from 0 to last', () => {
    component.currentSlide = 0;
    component.prevSlide();
    expect(component.currentSlide).toBe(component.slides.length - 1);
  });

  it('should go to specific slide and restart autoplay', fakeAsync(() => {
    (component.startAutoPlay as jasmine.Spy).and.callThrough();
    component.currentSlide = 0;
    component.startAutoPlay();

    component.goToSlide(2);
    expect(component.currentSlide).toBe(2);

    tick(3000);
    expect(component.currentSlide).toBe(3); // moves to next slide

    component.stopAutoPlay();
  }));

  // --------------------------------------------------
  // DOM STYLE UPDATE
  // --------------------------------------------------
  it('should update transform style correctly', () => {
    component.currentSlide = 1;
    component.updateSlidePosition();

    const track = component.carouselTrack.nativeElement;
    expect(track.style.transform).toContain('translateX(-100%)');
  });

  it('should disable animation when animate=false', () => {
    component.updateSlidePosition(false);
    const track = component.carouselTrack.nativeElement;
    expect(track.style.transition).toBe('none');
  });

  // --------------------------------------------------
  // TRANSITION END
  // --------------------------------------------------
  it('should reset to first slide after cloned slide', () => {
    component.currentSlide = mockSlides.length;
    component.onTransitionEnd();
    expect(component.currentSlide).toBe(0);
  });

  // --------------------------------------------------
  // DOTS
  // --------------------------------------------------
  it('should render dots when slides > 1', () => {
    const dots = fixture.debugElement.queryAll(By.css('.dot'));
    expect(dots.length).toBe(mockSlides.length);
  });

  it('should change slide when dot is clicked', () => {
    const dots = fixture.debugElement.queryAll(By.css('.dot'));
    // avoid starting autoplay during this interaction
    (component.startAutoPlay as jasmine.Spy).and.callFake(() => {});
    zone.run(() => {
      dots[1].nativeElement.click();
      fixture.detectChanges();
    });
    expect(component.currentSlide).toBe(1);
  });
  // --------------------------------------------------
  // MOUSE EVENTS
  // --------------------------------------------------
  it('should stop autoplay on mouseenter', () => {
    spyOn(component, 'stopAutoPlay');

    const container = fixture.debugElement.query(By.css('.carousel-container'));
    zone.run(() => {
      container.triggerEventHandler('mouseenter', null);
      fixture.detectChanges();
    });

    expect(component.stopAutoPlay).toHaveBeenCalled();
  });

  it('should start autoplay on mouseleave', () => {
    spyOn(component, 'startAutoPlay');

    const container = fixture.debugElement.query(By.css('.carousel-container'));
    zone.run(() => {
      container.triggerEventHandler('mouseleave', null);
      fixture.detectChanges();
    });

    expect(component.startAutoPlay).toHaveBeenCalled();
  });

  // --------------------------------------------------
  // VISIBILITY EVENTS
  // --------------------------------------------------
  it('should stop autoplay when document hidden', () => {
    spyOn(component, 'stopAutoPlay');
    Object.defineProperty(document, 'hidden', { get: () => true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(component.stopAutoPlay).toHaveBeenCalled();
  });

  it('should start autoplay when document becomes visible', () => {
    spyOn(component, 'startAutoPlay');
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(component.startAutoPlay).toHaveBeenCalled();
  });

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------
  it('should clean up on destroy', () => {
    spyOn(component, 'stopAutoPlay');
    component.ngOnDestroy();
    expect(component.stopAutoPlay).toHaveBeenCalled();

    // after destroy, visibility events should not trigger
    spyOn(component, 'startAutoPlay');
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(component.startAutoPlay).not.toHaveBeenCalled();
  });
});
