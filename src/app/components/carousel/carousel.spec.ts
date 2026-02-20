import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { CarouselComponent } from './carousel';

describe('CarouselComponent', () => {
  let component: CarouselComponent;
  let fixture: ComponentFixture<CarouselComponent>;

  const slides = [
    { header: 'H1', subHeader: 'S1', description: 'D1' },
    { header: 'H2', subHeader: 'S2', description: 'D2' },
    { header: 'H3', subHeader: 'S3', description: 'D3' }
  ];

  beforeEach(async () => {
    TestBed.overrideComponent(CarouselComponent, {
      set: {
        template: '<div #carouselTrack></div>'
      }
    });

    await TestBed.configureTestingModule({
      imports: [CarouselComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CarouselComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.slides = slides;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should prepare display slides with clone when slides length > 1', () => {
    component.slides = slides;
    fixture.detectChanges();

    expect(component.displaySlides.length).toBe(4);
    expect(component.displaySlides[3]).toEqual(slides[0]);
  });

  it('should keep display slides as-is when slides length <= 1', () => {
    component.slides = [slides[0]];
    fixture.detectChanges();

    expect(component.displaySlides).toEqual([slides[0]]);
  });

  it('should start autoplay and call nextSlide on interval', fakeAsync(() => {
    component.slides = slides;
    fixture.detectChanges();
    const nextSpy = spyOn(component, 'nextSlide').and.callThrough();

    component.startAutoPlay();
    tick(3000);

    expect(nextSpy).toHaveBeenCalled();
  }));

  it('should not start autoplay when slides are less than 2', fakeAsync(() => {
    component.slides = [slides[0]];
    fixture.detectChanges();
    const nextSpy = spyOn(component, 'nextSlide');

    component.startAutoPlay();
    tick(3500);

    expect(nextSpy).not.toHaveBeenCalled();
  }));

  it('should clear interval in stopAutoPlay', () => {
    component.slides = slides;
    fixture.detectChanges();
    const clearSpy = spyOn(window, 'clearInterval').and.callThrough();

    component.startAutoPlay();
    component.stopAutoPlay();

    expect(clearSpy).toHaveBeenCalled();
  });

  it('should move to next and previous slides', () => {
    const track = { style: { transition: '', transform: '' } };
    (component as any).carouselTrack = { nativeElement: track };
    component.displaySlides = [...slides, slides[0]];
    component.slides = slides;

    component.nextSlide();
    expect(component.currentSlide).toBe(1);
    expect(track.style.transform).toBe('translateX(-100%)');

    component.prevSlide();
    expect(component.currentSlide).toBe(0);
    expect(track.style.transform).toBe('translateX(-0%)');
  });

  it('should go to selected slide and restart autoplay', () => {
    const updateSpy = spyOn(component, 'updateSlidePosition');
    const autoplaySpy = spyOn(component, 'startAutoPlay');

    component.goToSlide(2);

    expect(component.currentSlide).toBe(2);
    expect(updateSpy).toHaveBeenCalled();
    expect(autoplaySpy).toHaveBeenCalled();
  });

  it('should update slide position with and without animation', () => {
    const track = { style: { transition: '', transform: '' } };
    (component as any).carouselTrack = { nativeElement: track };
    component.displaySlides = [...slides, slides[0]];
    component.currentSlide = 2;

    component.updateSlidePosition(true);
    expect(track.style.transition).toBe('transform 0.5s ease-in-out');
    expect(track.style.transform).toBe('translateX(-200%)');

    component.updateSlidePosition(false);
    expect(track.style.transition).toBe('none');
  });

  it('should reset current slide on transition end at cloned slide', () => {
    const updateSpy = spyOn(component, 'updateSlidePosition');
    component.slides = slides;
    component.currentSlide = slides.length;

    component.onTransitionEnd();

    expect(component.currentSlide).toBe(0);
    expect(updateSpy).toHaveBeenCalledWith(false);
  });

  it('should stop autoplay when document becomes hidden', () => {
    component.slides = slides;
    const stopSpy = spyOn(component, 'stopAutoPlay');
    spyOnProperty(document, 'hidden', 'get').and.returnValue(true);
    fixture.detectChanges();

    document.dispatchEvent(new Event('visibilitychange'));

    expect(stopSpy).toHaveBeenCalled();
  });

  it('should start autoplay when document becomes visible', () => {
    component.slides = slides;
    const startSpy = spyOn(component, 'startAutoPlay');
    spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    fixture.detectChanges();

    document.dispatchEvent(new Event('visibilitychange'));

    expect(startSpy).toHaveBeenCalled();
  });

  it('should clean up listeners and timers on destroy', () => {
    component.slides = slides;
    fixture.detectChanges();
    const removeEventSpy = spyOn(component.carouselTrack.nativeElement, 'removeEventListener').and.callThrough();
    const docRemoveSpy = spyOn(document, 'removeEventListener').and.callThrough();
    const stopSpy = spyOn(component, 'stopAutoPlay').and.callThrough();

    component.ngOnDestroy();

    expect(stopSpy).toHaveBeenCalled();
    expect(removeEventSpy).toHaveBeenCalledWith('transitionend', jasmine.any(Function));
    expect(docRemoveSpy).toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));
  });
});
