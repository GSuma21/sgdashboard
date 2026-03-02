import { fakeAsync, tick } from '@angular/core/testing';
import { ElementRef } from '@angular/core';

import { PartnerLogosComponent } from './partner-logos';

describe('PartnerLogosComponent', () => {
  const createComponent = (innerWidth: number, querySelector: (selector: string) => any = () => null) => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(innerWidth);
    const nativeElement = {
      querySelector: jasmine.createSpy('querySelector').and.callFake(querySelector)
    };
    const component = new PartnerLogosComponent({ nativeElement } as ElementRef);
    return { component, nativeElement };
  };

  it('should initialize logos, categories and default filtering', fakeAsync(() => {
    const { component } = createComponent(1200);
    component.partners = [
      { name: 'Zeta', category: 'Momentum', src: 'z', alt: 'z' },
      { name: 'Alpha', category: 'Collaborators', src: 'a', alt: 'a' },
      { name: 'Beta', category: ' ', src: 'b', alt: 'b' },
      { name: 'Gamma', category: '', src: 'g', alt: 'g' },
      { name: 'Delta', category: null, src: 'd', alt: 'd' }
    ];

    const updateSpy = spyOn<any>(component, 'updateScrollSpeed');
    component.ngOnInit();
    tick(0);

    expect(component.allLogos.map((p) => p.name)).toEqual(['Alpha', 'Beta', 'Delta', 'Gamma', 'Zeta']);
    expect(component.categories).toEqual(['Collaborators', 'Momentum']);
    expect(component.activeCategory).toBeNull();
    expect(component.filteredLogos).toEqual(component.allLogos);
    expect(updateSpy).toHaveBeenCalled();
  }));

  it('should filter logos by category and sort filtered output', fakeAsync(() => {
    const { component } = createComponent(1200);
    component.allLogos = [
      { name: 'Beta', category: 'Momentum' },
      { name: 'Alpha', category: 'Momentum' },
      { name: 'Gamma', category: 'Collaborators' }
    ];

    const updateSpy = spyOn<any>(component, 'updateScrollSpeed');
    component.filterLogos('Momentum');
    tick(0);

    expect(component.activeCategory).toBe('Momentum');
    expect(component.filteredLogos).toEqual([
      { name: 'Alpha', category: 'Momentum' },
      { name: 'Beta', category: 'Momentum' }
    ]);
    expect(updateSpy).toHaveBeenCalled();
  }));

  it('should call startJsScrollAnimation after filter on mobile', fakeAsync(() => {
    const { component } = createComponent(700);
    component.allLogos = [{ name: 'A', category: 'X' }];

    const startSpy = spyOn<any>(component, 'startJsScrollAnimation');
    component.filterLogos(null);
    tick(0);

    expect(startSpy).toHaveBeenCalled();
  }));

  it('should run mobile ngAfterViewInit path and trigger setup call', fakeAsync(() => {
    const scrollerInner = {} as HTMLElement;
    const { component } = createComponent(700, (selector) => selector === '.scroller__inner' ? scrollerInner : null);
    const setupSpy = spyOn<any>(component, 'setupMobileJsAnimation');

    component.ngAfterViewInit();
    tick(100);

    expect((component as any).scrollerInner).toBe(scrollerInner);
    expect(setupSpy).toHaveBeenCalled();
  }));

  it('should run desktop ngAfterViewInit path', () => {
    const scrollerInner = {} as HTMLElement;
    const { component } = createComponent(1200, (selector) => selector === '.scroller__inner' ? scrollerInner : null);
    const updateSpy = spyOn<any>(component, 'updateScrollSpeed');
    const setupSpy = spyOn<any>(component, 'setupDesktopCssAnimation');

    component.ngAfterViewInit();

    expect((component as any).scrollerInner).toBe(scrollerInner);
    expect(updateSpy).toHaveBeenCalled();
    expect(setupSpy).toHaveBeenCalled();
  });

  it('should return from setupMobileJsAnimation when scroller is missing', () => {
    const { component } = createComponent(700);

    (component as any).setupMobileJsAnimation();

    expect((component as any).userIsInteracting).toBeFalse();
  });

  it('should wire touch handlers in setupMobileJsAnimation and resume after delay', fakeAsync(() => {
    const handlers: Record<string, Function> = {};
    const scroller = {
      addEventListener: jasmine.createSpy('addEventListener').and.callFake((type: string, cb: EventListener) => {
        handlers[type] = cb as unknown as Function;
      })
    };
    const { component } = createComponent(700, (selector) => selector === '.scroller' ? scroller : null);
    const startSpy = spyOn<any>(component, 'startJsScrollAnimation');

    (component as any).scrollInterval = setInterval(() => undefined, 1000);
    (component as any).resumeTimeout = setTimeout(() => undefined, 1000);

    (component as any).setupMobileJsAnimation();
    handlers['touchstart']();
    handlers['touchend']();
    tick(2000);

    expect(scroller.addEventListener).toHaveBeenCalledTimes(2);
    expect(startSpy).toHaveBeenCalledTimes(2);
  }));

  it('should return from startJsScrollAnimation when scroller is missing', () => {
    const { component } = createComponent(700);

    (component as any).startJsScrollAnimation();

    expect((component as any).scrollInterval).toBeUndefined();
  });

  it('should advance scroll in startJsScrollAnimation', fakeAsync(() => {
    const scroller: any = {
      scrollWidth: 400,
      clientWidth: 100,
      scrollLeft: 10
    };
    const { component } = createComponent(700, (selector) => selector === '.scroller' ? scroller : null);

    (component as any).startJsScrollAnimation();
    tick(30);

    expect(scroller.scrollLeft).toBe(11);
    clearInterval((component as any).scrollInterval);
  }));

  it('should reset scroll position when duplicated width reached', fakeAsync(() => {
    const scroller: any = {
      scrollWidth: 400,
      clientWidth: 100,
      scrollLeft: 200
    };
    const { component } = createComponent(700, (selector) => selector === '.scroller' ? scroller : null);

    (component as any).startJsScrollAnimation();
    tick(30);

    expect(scroller.scrollLeft).toBe(0);
    clearInterval((component as any).scrollInterval);
  }));

  it('should return from setupDesktopCssAnimation when scrollerInner is missing', () => {
    const { component } = createComponent(1200);

    (component as any).setupDesktopCssAnimation();

    expect((component as any).scrollerInner).toBeNull();
  });

  it('should bind desktop listeners when scrollerInner exists', () => {
    const scrollerInner = {
      addEventListener: jasmine.createSpy('addEventListener')
    } as any;
    const { component } = createComponent(1200);
    (component as any).scrollerInner = scrollerInner;

    const winAddSpy = spyOn(window, 'addEventListener');
    const docAddSpy = spyOn(document, 'addEventListener');

    (component as any).setupDesktopCssAnimation();

    expect(scrollerInner.addEventListener).toHaveBeenCalledWith('touchstart', (component as any).pauseAnimation);
    expect(winAddSpy).toHaveBeenCalledWith('scroll', (component as any).resumeAnimation, { passive: true });
    expect(docAddSpy).toHaveBeenCalledWith('touchstart', (component as any).handleOutsideTap);
  });

  it('should pause and resume animation states', () => {
    const scrollerInner = { style: {} } as any;
    const { component } = createComponent(1200);
    (component as any).scrollerInner = scrollerInner;

    (component as any).pauseAnimation();
    expect(scrollerInner.style.animationPlayState).toBe('paused');

    (component as any).pauseAnimation();
    expect(scrollerInner.style.animationPlayState).toBe('paused');

    (component as any).resumeAnimation();
    expect(scrollerInner.style.animationPlayState).toBe('running');

    (component as any).resumeAnimation();
    expect(scrollerInner.style.animationPlayState).toBe('running');
  });

  it('should resume animation on outside tap only when paused', () => {
    const scrollerInner = {
      contains: jasmine.createSpy('contains').and.returnValue(false),
      style: {}
    } as any;
    const { component } = createComponent(1200);
    (component as any).scrollerInner = scrollerInner;
    (component as any).animationPaused = true;

    const resumeSpy = spyOn<any>(component, 'resumeAnimation').and.callThrough();
    (component as any).handleOutsideTap({ target: {} } as TouchEvent);
    expect(resumeSpy).toHaveBeenCalled();

    (component as any).animationPaused = false;
    (component as any).handleOutsideTap({ target: {} } as TouchEvent);
    expect(resumeSpy).toHaveBeenCalledTimes(1);
  });

  it('should clean up timers on mobile destroy', () => {
    const { component } = createComponent(700);
    (component as any).scrollInterval = setInterval(() => undefined, 1000);
    (component as any).resumeTimeout = setTimeout(() => undefined, 1000);

    const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();

    component.ngOnDestroy();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should clean up desktop listeners on destroy when scrollerInner exists', () => {
    const scrollerInner = {
      removeEventListener: jasmine.createSpy('removeEventListener')
    } as any;
    const { component } = createComponent(1200);
    (component as any).scrollerInner = scrollerInner;

    const winRemoveSpy = spyOn(window, 'removeEventListener');
    const docRemoveSpy = spyOn(document, 'removeEventListener');

    component.ngOnDestroy();

    expect(scrollerInner.removeEventListener).toHaveBeenCalledWith('touchstart', (component as any).pauseAnimation);
    expect(winRemoveSpy).toHaveBeenCalledWith('scroll', (component as any).resumeAnimation);
    expect(docRemoveSpy).toHaveBeenCalledWith('touchstart', (component as any).handleOutsideTap);
  });

  it('should skip desktop cleanup when scrollerInner is absent', () => {
    const { component } = createComponent(1200);
    const winRemoveSpy = spyOn(window, 'removeEventListener');

    component.ngOnDestroy();

    expect(winRemoveSpy).not.toHaveBeenCalled();
  });

  it('should return early in updateScrollSpeed for mobile', () => {
    const { component: mobileComponent } = createComponent(700);
    (mobileComponent as any).updateScrollSpeed();

    expect().nothing();
  });

  it('should return early in updateScrollSpeed when scrollerInner is missing on desktop', () => {
    const { component } = createComponent(1200);
    (component as any).updateScrollSpeed();

    expect().nothing();
  });

  it('should return from updateScrollSpeed when scroller element is missing', () => {
    const scrollerInner = { scrollWidth: 300, style: {} } as any;
    const { component } = createComponent(1200);
    (component as any).scrollerInner = scrollerInner;

    (component as any).updateScrollSpeed();

    expect().nothing();
  });

  it('should set animation duration in updateScrollSpeed (120hz path)', () => {
    const scrollerInner = {
      scrollWidth: 600,
      style: {}
    } as any;
    const scroller = {} as any;
    const { component } = createComponent(1200, (selector) => selector === '.scroller' ? scroller : null);
    (component as any).scrollerInner = scrollerInner;

    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    (component as any).updateScrollSpeed();

    expect(scrollerInner.style.animationDuration).toBe('10s');
  });

  it('should set animation duration in updateScrollSpeed (60hz path)', () => {
    const scrollerInner = {
      scrollWidth: 600,
      style: {}
    } as any;
    const scroller = {} as any;
    const { component } = createComponent(1200, (selector) => selector === '.scroller' ? scroller : null);
    (component as any).scrollerInner = scrollerInner;

    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    (component as any).updateScrollSpeed();

    expect(scrollerInner.style.animationDuration).toBe('5s');
  });

  it('should use fallback values for content width and device pixel ratio', () => {
    const scrollerInner = {
      scrollWidth: 0,
      style: {}
    } as any;
    const scroller = {} as any;
    const { component } = createComponent(1200, (selector) => selector === '.scroller' ? scroller : null);
    (component as any).scrollerInner = scrollerInner;

    spyOnProperty(window, 'devicePixelRatio', 'get').and.returnValue(0);
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    (component as any).updateScrollSpeed();

    expect(scrollerInner.style.animationDuration).toBe('0.008333333333333333s');
  });
});
