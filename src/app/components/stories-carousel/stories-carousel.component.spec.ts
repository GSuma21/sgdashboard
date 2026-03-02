import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { StoriesCarouselComponent } from './stories-carousel.component';
import { UtilsService } from '../../services/utils.services';
import { firebaseService } from '../../../firebase/firestore-service';

describe('StoriesCarouselComponent', () => {
  let component: StoriesCarouselComponent;
  let fixture: ComponentFixture<StoriesCarouselComponent>;

  let utilsMock: {
    assignColorsToStories: jasmine.Spy;
    getBrowserId: jasmine.Spy;
    updateStoryCounts: jasmine.Spy;
    updateStory: jasmine.Spy;
  };
  let firebaseMock: {
    getStoryCountsBulk: jasmine.Spy;
  };

  beforeEach(async () => {
    utilsMock = {
      assignColorsToStories: jasmine.createSpy('assignColorsToStories').and.callFake((stories: any[]) => stories),
      getBrowserId: jasmine.createSpy('getBrowserId').and.returnValue('browser-1'),
      updateStoryCounts: jasmine.createSpy('updateStoryCounts').and.callFake((slides: any[]) => slides),
      updateStory: jasmine.createSpy('updateStory').and.callFake((slides: any[]) => slides)
    };

    firebaseMock = {
      getStoryCountsBulk: jasmine.createSpy('getStoryCountsBulk').and.resolveTo([])
    };

    await TestBed.configureTestingModule({
      imports: [StoriesCarouselComponent],
      providers: [
        { provide: UtilsService, useValue: utilsMock },
        { provide: firebaseService, useValue: firebaseMock }
      ]
    })
      .overrideComponent(StoriesCarouselComponent, {
        set: {
          template: '<div></div>'
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(StoriesCarouselComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    document.querySelectorAll('.slides-area').forEach((n) => n.remove());
    component.stopAutoSlide();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should initialize, load data, and start auto slide', fakeAsync(() => {
    const data = {
      data: Array.from({ length: 20 }).map((_, i) => ({ id: i + 1 }))
    };
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = jasmine.createSpy('fetch').and.resolveTo(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    spyOn(component, 'getWeekNumber').and.returnValue(10);
    spyOn(component, 'adjustChunkSize').and.callThrough();
    spyOn(component, 'startAutoSlide').and.callFake(() => undefined);
    spyOn(component, 'loadStoryCounts').and.resolveTo();
    const addSpy = spyOn(window, 'addEventListener').and.callThrough();

    component.ngOnInit();
    tick(0);
    flushMicrotasks();

    expect(component.adjustChunkSize).toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalledWith('resize', jasmine.any(Function));
    expect(component.startAutoSlide).toHaveBeenCalled();

    (globalThis as any).fetch = originalFetch;
  }));

  it('ngOnInit should handle d3.json errors', fakeAsync(() => {
    const err = new Error('network');
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = jasmine.createSpy('fetch').and.rejectWith(err);
    const consoleSpy = spyOn(console, 'error');

    component.ngOnInit();
    tick(0);
    flushMicrotasks();

    expect(consoleSpy).toHaveBeenCalledWith(err);

    (globalThis as any).fetch = originalFetch;
  }));

  it('ngOnInit should use short-data branch when length is less than currentWeek - 7', fakeAsync(() => {
    const data = {
      data: Array.from({ length: 10 }).map((_, i) => ({ id: i + 1 }))
    };
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = jasmine.createSpy('fetch').and.resolveTo(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    spyOn(component, 'getWeekNumber').and.returnValue(999);
    spyOn(component, 'loadStoryCounts').and.resolveTo();

    component.ngOnInit();
    tick(1);
    flushMicrotasks();
    expect(component).toBeTruthy();
    (globalThis as any).fetch = originalFetch;
  }));

  it('ngOnInit should evaluate fallback side of OR branch when middle slice is undefined', fakeAsync(() => {
    const data = {
      data: Array.from({ length: 20 }).map((_, i) => ({ id: i + 1 }))
    };
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = jasmine.createSpy('fetch').and.resolveTo(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    const originalSlice = Array.prototype.slice;
    let count = 0;
    Array.prototype.slice = function (...args: any[]) {
      count++;
      if (count === 1) return undefined as any;
      return originalSlice.apply(this, args as [number, number]);
    };

    spyOn(component, 'getWeekNumber').and.returnValue(1);
    spyOn(component, 'loadStoryCounts').and.resolveTo();

    component.ngOnInit();
    tick(1);
    flushMicrotasks();

    expect(count).toBeGreaterThan(1);
    Array.prototype.slice = originalSlice;
    (globalThis as any).fetch = originalFetch;
  }));

  it('loadStoryCounts should return early for empty stories and still update chunks', async () => {
    component.slides = [];
    const chunkSpy = spyOn(component, 'updateChunks');

    await component.loadStoryCounts();

    expect(utilsMock.getBrowserId).toHaveBeenCalled();
    expect(firebaseMock.getStoryCountsBulk).not.toHaveBeenCalled();
    expect(chunkSpy).toHaveBeenCalled();
  });

  it('loadStoryCounts should merge server counts into slides', async () => {
    component.slides = [{ id: 1, likesCount: 0 }, { id: 2, likesCount: 0 }];
    firebaseMock.getStoryCountsBulk.and.resolveTo([
      { storyId: 1, likesCount: 5, shareCount: 2, downloadCount: 1, like: 1 }
    ]);
    const chunkSpy = spyOn(component, 'updateChunks');

    await component.loadStoryCounts();

    expect(component.browserId).toBe('browser-1');
    expect(firebaseMock.getStoryCountsBulk).toHaveBeenCalledWith([1, 2], 'browser-1');
    expect(component.slides[0].likesCount).toBe(5);
    expect(component.slides[1].likesCount).toBe(0);
    expect(chunkSpy).toHaveBeenCalled();
  });

  it('loadStoryCounts should apply fallback defaults when service fails', async () => {
    component.slides = [{ id: 1 }, { id: 2, likesCount: 3, like: 1 }];
    firebaseMock.getStoryCountsBulk.and.rejectWith(new Error('fail'));
    const chunkSpy = spyOn(component, 'updateChunks');

    await component.loadStoryCounts();

    expect(component.slides[0].likesCount).toBe(0);
    expect(component.slides[0].shareCount).toBe(0);
    expect(component.slides[0].downloadCount).toBe(0);
    expect(component.slides[0].like).toBe(0);
    expect(component.slides[1].likesCount).toBe(3);
    expect(component.slides[1].like).toBe(1);
    expect(chunkSpy).toHaveBeenCalled();
  });

  it('updateStory should ignore empty input and update matching story for valid input', () => {
    component.slides = [
      { id: 1, likesCount: 1, shareCount: 1, like: 0 },
      { id: 2, likesCount: 9, shareCount: 9, like: 1 }
    ];
    const chunkSpy = spyOn(component, 'updateChunks');

    component.updateStory(null as any);
    expect(chunkSpy).not.toHaveBeenCalled();

    component.updateStory({ id: 1, likesCount: 2, shareCount: 3, like: 1 });
    expect(component.slides[0].likesCount).toBe(2);
    expect(component.slides[0].shareCount).toBe(3);
    expect(component.slides[0].like).toBe(1);
    expect(component.slides[1].likesCount).toBe(9);
    expect(chunkSpy).toHaveBeenCalled();
  });

  it('adjustChunkSize should only update when breakpoint changes', () => {
    const chunkSpy = spyOn(component, 'updateChunks');

    component.chunkSize = 2;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    component.adjustChunkSize();
    expect(component.chunkSize).toBe(2);
    expect(chunkSpy).not.toHaveBeenCalled();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    component.adjustChunkSize();
    expect(component.chunkSize).toBe(1);
    expect(chunkSpy).toHaveBeenCalledTimes(1);
  });

  it('onStoryAction should use updateStoryCounts when status true and updateStory when false', async () => {
    component.slides = [{ id: 1 }];
    const chunkSpy = spyOn(component, 'updateChunks');
    utilsMock.updateStoryCounts.and.returnValue([{ id: 11 }]);
    utilsMock.updateStory.and.returnValue([{ id: 22 }]);

    await component.onStoryAction({ status: true });
    expect(utilsMock.updateStoryCounts).toHaveBeenCalled();
    expect(component.slides).toEqual([{ id: 11 }]);

    await component.onStoryAction({ status: false });
    expect(utilsMock.updateStory).toHaveBeenCalled();
    expect(component.slides).toEqual([{ id: 22 }]);
    expect(chunkSpy).toHaveBeenCalledTimes(2);
  });

  it('updateChunks should create clones for multiple chunks and no clones for single chunk', () => {
    const posSpy = spyOn(component, 'updateSlidePosition');

    component.slides = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    component.chunkSize = 2;
    component.updateChunks();

    expect(component.chunkedSlides.length).toBe(2);
    expect(component.extendedSlides.length).toBe(4);
    expect(component.currentChunkIndex).toBe(1);

    component.slides = [{ id: 1 }];
    component.chunkSize = 2;
    component.updateChunks();

    expect(component.chunkedSlides.length).toBe(1);
    expect(component.extendedSlides.length).toBe(1);
    expect(component.currentChunkIndex).toBe(0);
    expect(posSpy).toHaveBeenCalledWith(false);
  });

  it('chunkArray should split by chunk size', () => {
    expect(component.chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('getWeekNumber should return expected week number', () => {
    const week = component.getWeekNumber(new Date('2026-01-05T00:00:00Z'));
    expect(week).toBe(2);
  });

  it('getWeekNumber should handle Sunday using fallback day value', () => {
    const week = component.getWeekNumber(new Date('2026-01-04T00:00:00Z'));
    expect(week).toBe(1);
  });

  it('navigateSlide should guard when transitioning or no extended slides', () => {
    component.isTransitioning = true;
    component.extendedSlides = [[{ id: 1 }], [{ id: 2 }]];
    const updateSpy = spyOn(component, 'updateSlidePosition');

    component.navigateSlide(1);
    expect(updateSpy).not.toHaveBeenCalled();

    component.isTransitioning = false;
    component.extendedSlides = [[{ id: 1 }]];
    component.navigateSlide(1);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('navigateSlide should move in normal path and clear transitioning', fakeAsync(() => {
    component.extendedSlides = [[{ id: 1 }], [{ id: 2 }], [{ id: 3 }], [{ id: 4 }]];
    component.currentChunkIndex = 1;
    const updateSpy = spyOn(component, 'updateSlidePosition');
    const resetSpy = spyOn(component, 'resetAutoSlide');

    component.navigateSlide(1);
    expect(component.isTransitioning).toBeTrue();
    expect(updateSpy).toHaveBeenCalledWith(true);
    expect(resetSpy).toHaveBeenCalled();

    tick(500);
    expect(component.isTransitioning).toBeFalse();
  }));

  it('navigateSlide should loop from last clone to first real slide', fakeAsync(() => {
    component.extendedSlides = [[{ id: 9 }], [{ id: 1 }], [{ id: 2 }], [{ id: 1 }]];
    component.currentChunkIndex = 2;
    const updateSpy = spyOn(component, 'updateSlidePosition');

    component.navigateSlide(1, false);
    tick(500);

    expect(component.currentChunkIndex).toBe(1);
    expect(updateSpy).toHaveBeenCalledWith(true);
    expect(updateSpy).toHaveBeenCalledWith(false);
    expect(component.isTransitioning).toBeFalse();
  }));

  it('navigateSlide should loop from first clone to last real slide', fakeAsync(() => {
    component.extendedSlides = [[{ id: 9 }], [{ id: 1 }], [{ id: 2 }], [{ id: 1 }]];
    component.currentChunkIndex = 1;
    const updateSpy = spyOn(component, 'updateSlidePosition');

    component.navigateSlide(-1, false);
    tick(500);

    expect(component.currentChunkIndex).toBe(2);
    expect(updateSpy).toHaveBeenCalledWith(true);
    expect(updateSpy).toHaveBeenCalledWith(false);
    expect(component.isTransitioning).toBeFalse();
  }));

  it('updateSlidePosition should no-op without slides area and update DOM when present', () => {
    const renderer = (component as any).renderer as Renderer2;
    const styleSpy = spyOn(renderer, 'setStyle').and.callThrough();
    const querySpy = spyOn(document, 'querySelector');
    const area = { style: {}, offsetWidth: 250, scrollLeft: 0 } as any;
    querySpy.and.returnValues(null, area, area);

    component.currentChunkIndex = 2;
    component.updateSlidePosition(true);
    expect(styleSpy).not.toHaveBeenCalled();

    component.updateSlidePosition(true);
    expect(styleSpy).toHaveBeenCalledWith(area, 'scrollBehavior', 'smooth');
    expect(area.scrollLeft).toBe(500);

    component.updateSlidePosition(false);
    expect(styleSpy).toHaveBeenCalledWith(area, 'scrollBehavior', 'auto');
  });

  it('startAutoSlide should set interval once and navigate automatically', fakeAsync(() => {
    const navSpy = spyOn(component, 'navigateSlide');
    component.autoSlideDelay = 10;

    component.startAutoSlide();
    const firstInterval = component.slideInterval;
    component.startAutoSlide();
    expect(component.slideInterval).toBe(firstInterval);

    tick(11);
    expect(navSpy).toHaveBeenCalledWith(1, false);
  }));

  it('stopAutoSlide should clear and null interval', () => {
    component.startAutoSlide();
    expect(component.slideInterval).toBeTruthy();

    component.stopAutoSlide();
    expect(component.slideInterval).toBeNull();
  });

  it('resetAutoSlide should stop and restart', () => {
    const stopSpy = spyOn(component, 'stopAutoSlide').and.callThrough();
    const startSpy = spyOn(component, 'startAutoSlide').and.callThrough();

    component.resetAutoSlide();

    expect(stopSpy).toHaveBeenCalled();
    expect(startSpy).toHaveBeenCalled();
  });

  it('onPauseCarousel should stop and set modal flag only when called from modal', () => {
    const stopSpy = spyOn(component, 'stopAutoSlide');

    component.isModalOpen = false;
    component.onPauseCarousel(true);
    expect(component.isModalOpen).toBeTrue();
    expect(stopSpy).toHaveBeenCalled();

    component.isModalOpen = false;
    component.onPauseCarousel(false);
    expect(component.isModalOpen).toBeFalse();

    component.onPauseCarousel();
    expect(component.isModalOpen).toBeFalse();
  });

  it('onResumeCarousel should update modal state and respect modal lock', () => {
    const startSpy = spyOn(component, 'startAutoSlide');

    component.isModalOpen = true;
    component.onResumeCarousel(false);
    expect(startSpy).not.toHaveBeenCalled();

    component.isModalOpen = true;
    component.onResumeCarousel(true);
    expect(component.isModalOpen).toBeFalse();
    expect(startSpy).toHaveBeenCalledTimes(1);

    component.onResumeCarousel();
    expect(startSpy).toHaveBeenCalledTimes(2);
  });

  it('ngOnDestroy should stop interval and remove resize listener', () => {
    const stopSpy = spyOn(component, 'stopAutoSlide');
    const removeSpy = spyOn(window, 'removeEventListener').and.callThrough();

    component.ngOnDestroy();

    expect(stopSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('resize', jasmine.any(Function));
  });
});
