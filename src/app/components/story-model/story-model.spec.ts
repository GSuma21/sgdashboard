import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ACTIONS } from '../../../constants/actionConstants';
import { firebaseService } from '../../../firebase/firestore-service';
import { UtilsService } from '../../services/utils.services';
import { ShareService } from '../../services/share.service';
import { StoryModel } from './story-model';

describe('StoryModel', () => {
  let component: StoryModel;
  let dialogRefSpy: jasmine.SpyObj<any>;
  let firebaseSpy: jasmine.SpyObj<firebaseService>;
  let utilsSpy: jasmine.SpyObj<UtilsService>;
  let dialogSpy: jasmine.SpyObj<any>;
  let shareServiceSpy: jasmine.SpyObj<ShareService>;

  const storyData = {
    id: 'story-1',
    likesCount: 2,
    shareCount: 3,
    downloadCount: 1,
    like: 0,
    lang: [
      { code: 'eng', data: { title: 'English title' } },
      { code: 'hin', data: { title: 'Hindi title' } }
    ]
  };

  function createComponent(overrides?: Partial<typeof storyData>) {
    const story = { ...storyData, ...overrides };
    component = new StoryModel(
      dialogRefSpy,
      story,
      firebaseSpy,
      utilsSpy,
      dialogSpy,
      shareServiceSpy
    );
  }

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    firebaseSpy = jasmine.createSpyObj<firebaseService>('firebaseService', ['updateRecord']);
    utilsSpy = jasmine.createSpyObj<UtilsService>('UtilsService', ['getBrowserId']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    shareServiceSpy = jasmine.createSpyObj<ShareService>('ShareService', ['canNativeShare', 'nativeShare']);

    utilsSpy.getBrowserId.and.returnValue('browser-1');
    firebaseSpy.updateRecord.and.resolveTo({ status: 200, storyId: 'story-1', action: ACTIONS.LIKE, diff: 1 });
    shareServiceSpy.canNativeShare.and.returnValue(false);
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(undefined)
    } as any);

    createComponent();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.currentStory.title).toBe('English title');
    expect(component.currentStory.activeLangCode).toBe('hin');
  });

  it('should set storyLiked on init', () => {
    component.ngOnInit();
    expect(component.storyLiked).toBe(0);
  });

  it('should open share modal and return early on share click', async () => {
    const openShareSpy = spyOn(component, 'openShareModal');
    const processSpy = spyOn(component, 'processAction').and.callThrough();

    await component.handleUserClick(component.currentStory, ACTIONS.SHARE);

    expect(openShareSpy).toHaveBeenCalled();
    expect(processSpy).not.toHaveBeenCalled();
  });

  it('should update like state and process like action', fakeAsync(() => {
    const updateSpy = spyOn(component, 'updateLikeState').and.callThrough();
    const processSpy = spyOn(component, 'processAction').and.callThrough();

    component.ngOnInit();
    component.handleUserClick(component.currentStory, ACTIONS.LIKE);
    tick(1001);
    tick();

    expect(updateSpy).toHaveBeenCalledWith(component.currentStory);
    expect(processSpy).toHaveBeenCalled();
    expect(firebaseSpy.updateRecord).toHaveBeenCalledWith(component.currentStory, 'browser-1', ACTIONS.LIKE);
    expect(component.storyLiked).toBeTrue();
    expect(component.currentStory.like).toBe(1);
    expect(component.currentStory.likesCount).toBe(3);
  }));

  it('should keep likesCount non-negative when unliking', () => {
    component.storyLiked = true;
    component.currentStory.likesCount = 0;

    component.updateLikeState(component.currentStory);

    expect(component.storyLiked).toBeFalse();
    expect(component.currentStory.like).toBe(0);
    expect(component.currentStory.likesCount).toBe(0);
  });

  it('should use zero fallback for likesCount when current value is undefined', () => {
    component.storyLiked = false;
    component.currentStory.likesCount = undefined;

    component.updateLikeState(component.currentStory);

    expect(component.currentStory.likesCount).toBe(1);
  });

  it('should call updateRecord from processAction', async () => {
    const result = await component.processAction(component.currentStory, ACTIONS.LIKE);

    expect(firebaseSpy.updateRecord).toHaveBeenCalledWith(component.currentStory, 'browser-1', ACTIONS.LIKE);
    expect(result).toEqual({ status: 200, storyId: 'story-1', action: ACTIONS.LIKE, diff: 1 });
  });

  it('should toggle language and switch lang index', () => {
    const langSpy = spyOn(component, 'setStoryByLangIndex').and.callThrough();

    component.toggleLanguage();
    expect(component.isLangOn).toBeTrue();
    expect(langSpy).toHaveBeenCalledWith(1);

    component.toggleLanguage();
    expect(component.isLangOn).toBeFalse();
    expect(langSpy).toHaveBeenCalledWith(0);
  });

  it('should close modal with updated story counters', () => {
    component.currentStory.likesCount = 5;
    component.currentStory.shareCount = 9;
    component.currentStory.like = 1;

    component.closeModal();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
      likesCount: 5,
      shareCount: 9,
      like: 1
    }));
  });

  it('should set fallback story when language data is missing', () => {
    const warnSpy = spyOn(console, 'warn');
    component.story = {
      ...storyData,
      lang: [{ code: 'eng' }]
    };
    component.currentStory = { likesCount: 11, shareCount: 12, like: 1 };

    component.setStoryByLangIndex(1);

    expect(warnSpy).toHaveBeenCalledWith('Language data not found for index:', 1);
    expect(component.currentStory.likesCount).toBe(11);
    expect(component.currentStory.shareCount).toBe(12);
    expect(component.currentStory.like).toBe(1);
    expect(component.currentStory.activeLangCode).toBe('');
  });

  it('should fallback to story counters when language data is missing and currentStory is undefined', () => {
    component.story = {
      ...storyData,
      lang: [{ code: 'eng' }]
    };
    component.currentStory = undefined;

    component.setStoryByLangIndex(1);

    expect(component.currentStory.likesCount).toBe(storyData.likesCount);
    expect(component.currentStory.shareCount).toBe(storyData.shareCount);
    expect(component.currentStory.like).toBe(storyData.like);
  });

  it('should use story counters when currentStory values are nullish', () => {
    component.currentStory = { likesCount: undefined, shareCount: undefined, like: undefined };

    component.setStoryByLangIndex(0);

    expect(component.currentStory.likesCount).toBe(storyData.likesCount);
    expect(component.currentStory.shareCount).toBe(storyData.shareCount);
    expect(component.currentStory.like).toBe(storyData.like);
  });

  it('should use empty activeLangCode when alternate language code is missing', () => {
    component.story = {
      ...storyData,
      lang: [
        { code: 'eng', data: { title: 'English title' } },
        { data: { title: 'No code lang' } }
      ]
    };

    component.setStoryByLangIndex(0);

    expect(component.currentStory.activeLangCode).toBe('');
  });

  it('should use native share and queue share action on success', fakeAsync(() => {
    const nextSpy = spyOn<any>(component['action$'], 'next').and.callThrough();
    shareServiceSpy.canNativeShare.and.returnValue(true);
    shareServiceSpy.nativeShare.and.returnValue(Promise.resolve());

    component.openShareModal();
    tick();

    expect(shareServiceSpy.nativeShare).toHaveBeenCalledWith('story-1');
    expect(nextSpy).toHaveBeenCalledWith({
      story: component.currentStory,
      action: ACTIONS.SHARE
    });
  }));

  it('should log debug when native share fails', fakeAsync(() => {
    const debugSpy = spyOn(console, 'debug');
    const nextSpy = spyOn<any>(component['action$'], 'next').and.callThrough();
    shareServiceSpy.canNativeShare.and.returnValue(true);
    shareServiceSpy.nativeShare.and.returnValue(Promise.reject('cancelled'));

    component.openShareModal();
    tick();

    expect(debugSpy).toHaveBeenCalledWith('Native share cancelled or failed', 'cancelled');
    expect(nextSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({ action: ACTIONS.SHARE }));
  }));

  it('should open share dialog and queue share action when closed with ok', () => {
    const nextSpy = spyOn<any>(component['action$'], 'next').and.callThrough();
    dialogSpy.open.and.returnValue({
      afterClosed: () => of('ok')
    } as any);
    shareServiceSpy.canNativeShare.and.returnValue(false);

    component.openShareModal();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalledWith({
      story: component.currentStory,
      action: ACTIONS.SHARE
    });
  });

  it('should open share dialog and skip queue when dialog result is not ok', () => {
    const nextSpy = spyOn<any>(component['action$'], 'next').and.callThrough();
    dialogSpy.open.and.returnValue({
      afterClosed: () => of('cancel')
    } as any);

    component.openShareModal();

    expect(nextSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({ action: ACTIONS.SHARE }));
  });

  it('should increment shareCount from subscription for share result', fakeAsync(() => {
    const processSpy = spyOn(component, 'processAction').and.returnValue(
      Promise.resolve({ action: ACTIONS.SHARE, diff: 2 }) as any
    );
    component.currentStory.shareCount = 4;

    component.handleUserClick(component.currentStory, ACTIONS.DOWNLOAD);
    tick(1001);
    tick();

    expect(processSpy).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'story-1' }), ACTIONS.DOWNLOAD);
    expect(component.currentStory.shareCount).toBe(6);
  }));

  it('should use zero fallback for shareCount when subscription updates share result', fakeAsync(() => {
    spyOn(component, 'processAction').and.returnValue(
      Promise.resolve({ action: ACTIONS.SHARE, diff: 3 }) as any
    );
    component.currentStory.shareCount = undefined;

    component.handleUserClick(component.currentStory, ACTIONS.DOWNLOAD);
    tick(1001);
    tick();

    expect(component.currentStory.shareCount).toBe(3);
  }));

  it('should ignore subscription next updates when action is like or missing', fakeAsync(() => {
    const processSpy = spyOn(component, 'processAction').and.returnValues(
      Promise.resolve({ action: ACTIONS.LIKE, diff: 1 }) as any,
      Promise.resolve({}) as any
    );
    component.currentStory.shareCount = 7;

    component.handleUserClick(component.currentStory, ACTIONS.DOWNLOAD);
    tick(1001);
    tick();
    component.handleUserClick(component.currentStory, ACTIONS.DOWNLOAD);
    tick(1001);
    tick();

    expect(processSpy).toHaveBeenCalledTimes(2);
    expect(component.currentStory.shareCount).toBe(7);
  }));

  it('should log stream errors from action processing', fakeAsync(() => {
    const errorSpy = spyOn(console, 'error');
    spyOn(component, 'processAction').and.returnValue(throwError(() => 'stream-failed') as any);

    component.handleUserClick(component.currentStory, ACTIONS.DOWNLOAD);
    tick(1001);
    tick();

    expect(errorSpy).toHaveBeenCalledWith('Action failed:', 'stream-failed');
  }));

  it('should complete subject and unsubscribe on destroy when subscription exists', () => {
    const unsubscribeSpy = spyOn((component as any).actionSub, 'unsubscribe').and.callThrough();
    const completeSpy = spyOn((component as any).action$, 'complete').and.callThrough();

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should safely destroy when actionSub is missing', () => {
    const completeSpy = spyOn((component as any).action$, 'complete').and.callThrough();
    (component as any).actionSub = undefined;

    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(completeSpy).toHaveBeenCalled();
  });
});
