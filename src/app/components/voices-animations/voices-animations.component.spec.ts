import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoicesAnimationsComponent } from './voices-animations.component';
import { VOICE_ANIMATION, VOICE_ANIMATION_RESOLUTIONS } from '../../../constants/urlConstants';

describe('VoicesAnimationsComponent', () => {
  let component: VoicesAnimationsComponent;
  let fixture: ComponentFixture<VoicesAnimationsComponent>;
  let originalFetch: typeof fetch;

  const asJsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoicesAnimationsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VoicesAnimationsComponent);
    component = fixture.componentInstance;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should call fetchPageData', () => {
    const spy = spyOn(component, 'fetchPageData').and.callFake(() => undefined);

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('ngOnDestroy should mark component as destroyed', () => {
    expect((component as any).isDestroyed).toBeFalse();

    component.ngOnDestroy();

    expect((component as any).isDestroyed).toBeTrue();
  });

  it('onResize should call updatePositions', () => {
    const spy = spyOn(component, 'updatePositions').and.callFake(() => undefined);

    component.onResize({});

    expect(spy).toHaveBeenCalled();
  });

  it('updatePositions should apply matching breakpoints and ignore non-matching nodes', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    component.storyNodes = [
      {
        responsivePositions: [
          { minWidth: 400, top: '40%', left: '30%' },
          { minWidth: 1000, top: '10%', left: '20%' }
        ],
        dandelionTop: '0%',
        dandelionLeft: '0%'
      },
      {
        responsivePositions: [{ minWidth: 2000, top: '90%', left: '90%' }],
        dandelionTop: '1%',
        dandelionLeft: '1%'
      }
    ];

    component.updatePositions();

    expect(component.storyNodes[0].dandelionTop).toBe('10%');
    expect(component.storyNodes[0].dandelionLeft).toBe('20%');
    expect(component.storyNodes[1].dandelionTop).toBe('1%');
    expect(component.storyNodes[1].dandelionLeft).toBe('1%');
  });

  it('playAnimation should run full sequence and keep elements visible', async () => {
    component.storyNodes = [{}, {}] as any;
    spyOn(component, 'delay').and.resolveTo();

    await component.playAnimation();

    expect(component.showDandelionBase).toBeTrue();
    expect(component.growthStep).toBe(2);
    expect(component.problemsVisible.has(0)).toBeTrue();
    expect(component.problemsVisible.has(1)).toBeTrue();
    expect(component.dandelionsVisible.has(0)).toBeTrue();
    expect(component.dandelionsVisible.has(1)).toBeTrue();
    expect(component.solutionsVisible.has(0)).toBeTrue();
    expect(component.solutionsVisible.has(1)).toBeTrue();
    expect(component.solutionsAnimating.has(0)).toBeTrue();
    expect(component.solutionsAnimating.has(1)).toBeTrue();
  });

  it('playAnimation should return early when destroyed after first delay', async () => {
    component.storyNodes = [{}] as any;
    let call = 0;
    spyOn(component, 'delay').and.callFake(async () => {
      call += 1;
      if (call === 1) {
        (component as any).isDestroyed = true;
      }
    });

    await component.playAnimation();

    expect(component.showDandelionBase).toBeTrue();
    expect(component.growthStep).toBe(0);
    expect(component.problemsVisible.size).toBe(0);
  });

  it('playAnimation should hit all additional destroyed-return checkpoints', async () => {
    const checkpoints = [2, 3, 4, 5, 6];
    let stopAtTarget = -1;
    let call = 0;
    spyOn(component, 'delay').and.callFake(async () => {
      call += 1;
      if (call === stopAtTarget) {
        (component as any).isDestroyed = true;
      }
    });

    for (const checkpoint of checkpoints) {
      component.showDandelionBase = false;
      component.growthStep = 0;
      component.storyNodes = [{}] as any;
      component.dandelionsVisible.clear();
      component.problemsVisible.clear();
      component.solutionsVisible.clear();
      component.solutionsAnimating.clear();
      (component as any).isDestroyed = false;
      call = 0;
      stopAtTarget = checkpoint;

      await component.playAnimation();

      expect(component.showDandelionBase).toBeTrue();
    }
  });

  it('playAnimation should return at loop-start destroyed check', async () => {
    (component as any).isDestroyed = false;
    component.storyNodes = [] as any;
    Object.defineProperty(component, 'storyNodes', {
      configurable: true,
      get: () => {
        (component as any).isDestroyed = true;
        return [{}];
      }
    });
    spyOn(component, 'delay').and.resolveTo();

    await component.playAnimation();

    expect(component.growthStep).toBe(0.5);
    Object.defineProperty(component, 'storyNodes', { configurable: true, value: [] });
  });

  it('onSolutionAnimationDone should remove index from animating set', () => {
    component.solutionsAnimating.add(4);

    component.onSolutionAnimationDone(4);

    expect(component.solutionsAnimating.has(4)).toBeFalse();
  });

  it('getBubbleStyle should return expected styles for problem and solution', () => {
    const node = { dandelionTop: '20', dandelionLeft: '30' };

    const problem = component.getBubbleStyle(node, 'problem');
    const solution = component.getBubbleStyle(node, 'solution');

    expect(problem).toEqual({ left: '30%', top: '28%' });
    expect(solution).toEqual({ left: '30%', top: '-14%' });
  });

  it('fetchPageData should load data, enrich story nodes, and trigger animation', async () => {
    const pageData = {
      data: [
        { challenge: 'C1', role: 'Teacher', district: 'D1', state: 'S1', solutions: [{ solution: 'Sol1' }] },
        { challenge: 'C2', role: 'Headmaster', district: 'D2', state: 'S2', solutions: [{ solution: 'Sol2' }] },
        { challenge: 'C3', role: 'Parent', district: 'D3', state: 'S3', solutions: [{ solution: 'Sol3' }] },
        { challenge: 'C4', role: 'Student', district: 'D4', state: 'S4', solutions: [{ solution: 'Sol4' }] },
        { challenge: 'C5', role: 'Extra', district: 'D5', state: 'S5', solutions: [{ solution: 'Sol5' }] }
      ]
    };
    const resolutionData = [
      { responsivePositions: [{ minWidth: 0, top: '10%', left: '10%' }], dandelionTop: '0%', dandelionLeft: '0%' },
      { responsivePositions: [{ minWidth: 0, top: '20%', left: '20%' }], dandelionTop: '0%', dandelionLeft: '0%' },
      { responsivePositions: [{ minWidth: 0, top: '30%', left: '30%' }], dandelionTop: '0%', dandelionLeft: '0%' },
      { responsivePositions: [{ minWidth: 0, top: '40%', left: '40%' }], dandelionTop: '0%', dandelionLeft: '0%' }
    ];

    const updateSpy = spyOn(component, 'updatePositions').and.callThrough();
    const playSpy = spyOn(component, 'playAnimation').and.resolveTo();
    const logSpy = spyOn(console, 'log');

    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith(`/${VOICE_ANIMATION_RESOLUTIONS}`) || url.includes(VOICE_ANIMATION_RESOLUTIONS)) {
        return Promise.resolve(asJsonResponse(resolutionData));
      }
      if (url.endsWith(`/${VOICE_ANIMATION}`) || url.includes(VOICE_ANIMATION)) {
        return Promise.resolve(asJsonResponse(pageData));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as any;

    component.fetchPageData();
    await flushPromises();
    await flushPromises();

    expect(component.pageData.length).toBe(4);
    expect(component.storyNodes.length).toBe(4);
    expect(component.storyNodes[0].problem).toBe('C1');
    expect(component.storyNodes[1].author).toContain('Headmaster');
    expect(component.storyNodes[3].solution).toBe('Sol4');
    expect(updateSpy).toHaveBeenCalled();
    expect(playSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it('fetchPageData should handle inner resolution fetch error', async () => {
    const errorSpy = spyOn(console, 'error');

    globalThis.fetch = jasmine.createSpy('fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(VOICE_ANIMATION_RESOLUTIONS)) return Promise.reject(new Error('res-fail'));
      if (url.includes(VOICE_ANIMATION)) return Promise.resolve(asJsonResponse({ data: [] }));
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as any;

    component.fetchPageData();
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith('Error loading page data:', jasmine.any(Error));
  });

  it('fetchPageData should handle outer page-data fetch error', async () => {
    const errorSpy = spyOn(console, 'error');

    globalThis.fetch = jasmine.createSpy('fetch').and.returnValue(Promise.reject(new Error('page-fail'))) as any;

    component.fetchPageData();
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith('Error loading page data:', jasmine.any(Error));
  });

  it('delay should resolve', async () => {
    await expectAsync(component.delay(0)).toBeResolved();
  });
});
