import { Subject, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { VoicesComponent } from './voices.component';
import { UtilsService } from '../../services/utils.services';
import { firebaseService } from '../../../firebase/firestore-service';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { ACTIONS } from '../../../constants/actionConstants';

describe('VoicesComponent', () => {
  let component: VoicesComponent;
  let queryParams$: Subject<any>;
  let route: ActivatedRoute;
  let dialog: jasmine.SpyObj<MatDialog>;
  let utils: jasmine.SpyObj<UtilsService>;
  let sg: jasmine.SpyObj<firebaseService>;
  let router: jasmine.SpyObj<Router>;
  let loaderRunner: jasmine.SpyObj<LoaderRunnerService>;

  const storiesPayload = {
    data: [
      { id: 's1', title: 'Story 1', likesCount: 1, shareCount: 2, like: false },
      { id: 's2', title: 'Story 2', likesCount: 3, shareCount: 4, like: true },
    ],
  };
  const storiesWithoutIdPayload = {
    data: [{ title: 'No id story' }],
  };

  const jsonResponse = (data: any): Promise<Response> =>
    Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

  const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    queryParams$ = new Subject<any>();
    route = { queryParams: queryParams$.asObservable() } as ActivatedRoute;
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    utils = jasmine.createSpyObj<UtilsService>('UtilsService', ['getBrowserId']);
    sg = jasmine.createSpyObj<firebaseService>('firebaseService', ['getStoryCountsBulk']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    loaderRunner = jasmine.createSpyObj<LoaderRunnerService>('LoaderRunnerService', ['run']);
    loaderRunner.run.and.callFake(<T>(runner: () => Promise<T>) => runner());
    utils.getBrowserId.and.returnValue('browser-1');

    component = new VoicesComponent(route, dialog, utils, sg, router, loaderRunner);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize, fetch story counts, subscribe to query params and open modal', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    const pageDataSpy = spyOn(component, 'fetchPageData');
    const clearSpy = spyOn(component, 'clearQueryParams').and.callThrough();
    const storyCompSpy = jasmine.createSpy('updateStory');
    component.storyComp = { updateStory: storyCompSpy } as any;

    sg.getStoryCountsBulk.and.callFake((ids: string[]) => {
      if (ids[0] === 's1') {
        return Promise.resolve([{ likesCount: 7, shareCount: 8, like: true }]) as any;
      }
      return Promise.resolve([{ id: 's2', likesCount: 20, shareCount: 30, like: false }]) as any;
    });

    dialog.open.and.returnValue({
      afterClosed: () => of({ id: 's1', likesCount: 99, shareCount: 88, like: false }),
    } as any);

    spyOn(window, 'fetch').and.callFake((input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('stories.json')) {
        return jsonResponse(storiesPayload) as any;
      }
      return Promise.reject(`unexpected:${url}`) as any;
    });

    await component.ngOnInit();
    queryParams$.next({ storyId: 's2' });
    await flushPromises();

    expect(loaderRunner.run).toHaveBeenCalled();
    expect(utils.getBrowserId).toHaveBeenCalled();
    expect(component.browserId).toBe('browser-1');
    expect(pageDataSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(storyCompSpy).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    expect(component.story.likesCount).toBe(99);
    expect(component.story.shareCount).toBe(88);
    expect(component.story.like).toBeFalse();
  });

  it('should return early for query params without storyId', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    spyOn(component, 'fetchPageData');
    sg.getStoryCountsBulk.and.returnValue(Promise.resolve([{}]) as any);
    dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();
    queryParams$.next({});
    await flushPromises();

    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should select fallback story when current week is beyond data length', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(5);
    spyOn(component, 'fetchPageData');
    sg.getStoryCountsBulk.and.returnValue(Promise.resolve([{}]) as any);
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();

    expect(component.story.id).toBe('s1');
  });

  it('should fallback to first story when computed week index is out of bounds', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(0);
    spyOn(component, 'fetchPageData');
    sg.getStoryCountsBulk.and.returnValue(Promise.resolve([{}]) as any);
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();

    expect(component.story.id).toBe('s1');
  });

  it('should fetch page data and return when story id is missing', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    const pageDataSpy = spyOn(component, 'fetchPageData');
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesWithoutIdPayload) as any);

    await component.ngOnInit();

    expect(pageDataSpy).toHaveBeenCalled();
    expect(sg.getStoryCountsBulk).not.toHaveBeenCalled();
  });

  it('should warn when story counts are missing for query storyId', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    spyOn(component, 'fetchPageData');
    sg.getStoryCountsBulk.and.returnValues(
      Promise.resolve([{ likesCount: 1 }]) as any,
      Promise.resolve([]) as any,
    );
    const warnSpy = spyOn(console, 'warn');
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();
    queryParams$.next({ storyId: 'missing-counts' });
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledWith('Story counts not found for storyId:', 'missing-counts');
  });

  it('should warn when story data is missing for query storyId', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    spyOn(component, 'fetchPageData');
    sg.getStoryCountsBulk.and.returnValues(
      Promise.resolve([{ likesCount: 1 }]) as any,
      Promise.resolve([{ likesCount: 2 }]) as any,
    );
    const warnSpy = spyOn(console, 'warn');
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();
    queryParams$.next({ storyId: 'unknown-story' });
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledWith('Story data not found for storyId:', 'unknown-story');
  });

  it('should clear query params when modal closes without valid result', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    spyOn(component, 'fetchPageData');
    const clearSpy = spyOn(component, 'clearQueryParams').and.callThrough();
    sg.getStoryCountsBulk.and.returnValues(
      Promise.resolve([{}]) as any,
      Promise.resolve([{}]) as any,
    );
    dialog.open.and.returnValue({ afterClosed: () => of({}) } as any);
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();
    queryParams$.next({ storyId: 's1' });
    await flushPromises();

    expect(clearSpy).toHaveBeenCalled();
  });

  it('should warn when story component is missing during modal close update', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    spyOn(component, 'fetchPageData');
    const warnSpy = spyOn(console, 'warn');
    sg.getStoryCountsBulk.and.returnValues(
      Promise.resolve([{}]) as any,
      Promise.resolve([{ likesCount: 10, shareCount: 20, like: true }]) as any,
    );
    dialog.open.and.returnValue({
      afterClosed: () => of({ id: 's1', likesCount: 11, shareCount: 22, like: false }),
    } as any);
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();
    queryParams$.next({ storyId: 's1' });
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledWith('StoriesCarouselComponent not initialized yet');
  });

  it('should preserve existing story counts when modal result misses fields', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    spyOn(component, 'fetchPageData');
    component.storyComp = { updateStory: jasmine.createSpy('updateStory') } as any;
    sg.getStoryCountsBulk.and.returnValues(
      Promise.resolve([{ likesCount: 10, shareCount: 20, like: true }]) as any,
      Promise.resolve([{ likesCount: 10, shareCount: 20, like: true }]) as any,
    );
    dialog.open.and.returnValue({ afterClosed: () => of({ id: 's1' }) } as any);
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();
    queryParams$.next({ storyId: 's1' });
    await flushPromises();

    expect(component.story.likesCount).toBe(10);
    expect(component.story.shareCount).toBe(20);
    expect(component.story.like).toBeTrue();
  });

  it('should handle story count fetch failure in ngOnInit and still fetch page data', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    const pageDataSpy = spyOn(component, 'fetchPageData');
    const errorSpy = spyOn(console, 'error');
    sg.getStoryCountsBulk.and.returnValue(Promise.reject('counts-failed') as any);
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith('Failed to load story counts:', 'counts-failed');
    expect(pageDataSpy).toHaveBeenCalled();
  });

  it('should handle query story modal failure', async () => {
    spyOn(component, 'getWeekNumber').and.returnValue(1);
    spyOn(component, 'fetchPageData');
    const errorSpy = spyOn(console, 'error');
    sg.getStoryCountsBulk.and.returnValues(
      Promise.resolve([{}]) as any,
      Promise.reject('modal-failed') as any,
    );
    spyOn(window, 'fetch').and.returnValue(jsonResponse(storiesPayload) as any);

    await component.ngOnInit();
    queryParams$.next({ storyId: 's1' });
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith('Failed to open story modal:', 'modal-failed');
  });

  it('should handle stories.json load error in ngOnInit', async () => {
    const errorSpy = spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject('stories-json-failed') as any);

    await component.ngOnInit();

    expect(errorSpy).toHaveBeenCalledWith('Error loading page data:', 'stories-json-failed');
  });

  it('should fetch voices page data successfully', async () => {
    const voicesData = [{ type: 'branch-animation' }];
    const logSpy = spyOn(console, 'log');
    spyOn(window, 'fetch').and.callFake((input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('voices.json')) {
        return jsonResponse(voicesData) as any;
      }
      return Promise.reject('unexpected') as any;
    });

    component.fetchPageData();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component.pageData).toEqual(voicesData);
    expect(logSpy).toHaveBeenCalledWith(voicesData);
  });

  it('should handle voices page fetch error', async () => {
    const errorSpy = spyOn(console, 'error');
    spyOn(window, 'fetch').and.returnValue(Promise.reject('voices-json-failed') as any);

    component.fetchPageData();
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith('Error loading page data:', 'voices-json-failed');
  });

  it('should clear query params', () => {
    component.clearQueryParams();
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: {},
      replaceUrl: true,
    });
  });

  it('should handle onStoryAction for share and non-status payload', () => {
    component.story = { id: 's1', shareCount: 10, likesCount: 1 };
    component.onStoryAction({ status: true, action: ACTIONS.SHARE, diff: 2 });
    expect(component.story.shareCount).toBe(12);

    component.onStoryAction({ id: 's2', status: false, shareCount: 4 });
    expect(component.story).toEqual({ id: 's2', status: false, shareCount: 4 });
  });

  it('should use zero as default shareCount when story share count is missing', () => {
    component.story = { id: 's1' };
    component.onStoryAction({ status: true, action: ACTIONS.SHARE, diff: 3 });
    expect(component.story.shareCount).toBe(3);
  });

  it('should not mutate shareCount for non-share status=true action', () => {
    component.story = { id: 's1', shareCount: 5 };
    component.onStoryAction({ status: true, action: ACTIONS.LIKE, diff: 7 });
    expect(component.story).toEqual({ id: 's1', shareCount: 5 });
  });

  it('should compute week number', () => {
    const week = component.getWeekNumber(new Date('2026-01-08T00:00:00.000Z'));
    expect(week).toBeGreaterThan(0);
  });

  it('should compute week number for sunday path', () => {
    const week = component.getWeekNumber(new Date('2026-01-04T00:00:00.000Z'));
    expect(week).toBeGreaterThan(0);
  });

  it('should unsubscribe on destroy when subscription exists', () => {
    const unsubSpy = jasmine.createSpy('unsubscribe');
    (component as any).queryParamsSubscription = { unsubscribe: unsubSpy };
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });

  it('should safely destroy when subscription does not exist', () => {
    (component as any).queryParamsSubscription = undefined;
    component.ngOnDestroy();
    expect().nothing();
  });
});
