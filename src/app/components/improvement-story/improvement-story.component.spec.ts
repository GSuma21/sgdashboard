import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { ImprovementStoryComponent } from './improvement-story.component';
import { firebaseService } from '../../../firebase/firestore-service';
import { ShareService } from '../../services/share.service';
import { ACTIONS } from '../../../constants/actionConstants';

describe('ImprovementStoryComponent', () => {
  let component: ImprovementStoryComponent;
  let fixture: ComponentFixture<ImprovementStoryComponent>;
  let firebaseSpy: jasmine.SpyObj<firebaseService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let shareServiceSpy: jasmine.SpyObj<ShareService>;

  const story = {
    id: 'story-1',
    like: 0,
    likesCount: 2,
    shareCount: 3,
    downloadCount: 1,
    lang: [{ data: { title: 'Story title', role: 'Teacher', district: 'Pune', state: 'maharashtra' } }],
    photos: ['https://example.com/photo.png'],
    color: '#123456'
  };

  beforeEach(async () => {
    firebaseSpy = jasmine.createSpyObj<firebaseService>('firebaseService', ['updateRecord']);
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    shareServiceSpy = jasmine.createSpyObj<ShareService>('ShareService', ['canNativeShare', 'nativeShare']);

    firebaseSpy.updateRecord.and.resolveTo({ status: 200, action: ACTIONS.LIKE, storyId: 'story-1', diff: 1 } as any);
    shareServiceSpy.canNativeShare.and.returnValue(false);
    shareServiceSpy.nativeShare.and.resolveTo();
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(undefined)
    } as any);

    await TestBed.configureTestingModule({
      imports: [ImprovementStoryComponent],
      providers: [
        { provide: firebaseService, useValue: firebaseSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ShareService, useValue: shareServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImprovementStoryComponent);
    component = fixture.componentInstance;
    component.browserId = 'browser-1';
    component.story = { ...story };
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('handleUserClick should open share modal and return for share action', async () => {
    const pauseSpy = spyOn(component.pauseCarousel, 'emit');
    const openShareSpy = spyOn(component, 'openShareModal');
    const updateLikeSpy = spyOn(component, 'updateLikeState');
    const processSpy = spyOn(component, 'processAction').and.callThrough();

    await component.handleUserClick(component.story, ACTIONS.SHARE);

    expect(pauseSpy).toHaveBeenCalledWith(false);
    expect(openShareSpy).toHaveBeenCalled();
    expect(updateLikeSpy).not.toHaveBeenCalled();
    expect(processSpy).not.toHaveBeenCalled();
  });

  it('handleUserClick should update like and process action through debounced stream', fakeAsync(() => {
    const pauseSpy = spyOn(component.pauseCarousel, 'emit');
    const storyActionSpy = spyOn(component.storyAction, 'emit');
    const updateLikeSpy = spyOn(component, 'updateLikeState').and.callThrough();

    component.handleUserClick(component.story, ACTIONS.LIKE);
    tick(1000);
    flushMicrotasks();

    expect(pauseSpy).toHaveBeenCalledWith(false);
    expect(updateLikeSpy).toHaveBeenCalledWith(component.story);
    expect(firebaseSpy.updateRecord).toHaveBeenCalledWith(component.story, 'browser-1', ACTIONS.LIKE);
    expect(storyActionSpy).not.toHaveBeenCalled();
  }));

  it('processAction should call firebase updateRecord', async () => {
    const result = await component.processAction(component.story, ACTIONS.DOWNLOAD);

    expect(firebaseSpy.updateRecord).toHaveBeenCalledWith(component.story, 'browser-1', ACTIONS.DOWNLOAD);
    expect(result).toEqual({ status: 200, action: ACTIONS.LIKE, storyId: 'story-1', diff: 1 } as any);
  });

  it('updateLikeState should toggle like on and increment likesCount', () => {
    const localStory = { like: 0, likesCount: 0 };

    component.updateLikeState(localStory);

    expect(localStory.like).toBe(1);
    expect(localStory.likesCount).toBe(1);
  });

  it('updateLikeState should toggle like off, use fallback, and keep likesCount non-negative', () => {
    const localStory: any = { like: 1, likesCount: undefined };

    component.updateLikeState(localStory);

    expect(localStory.like).toBe(0);
    expect(localStory.likesCount).toBe(0);
  });

  it('openStoryModal should emit resume only when modal closes without result', () => {
    const pauseSpy = spyOn(component.pauseCarousel, 'emit');
    const resumeSpy = spyOn(component.resumeCarousel, 'emit');
    const storyActionSpy = spyOn(component.storyAction, 'emit');

    dialogSpy.open.and.returnValue({
      afterClosed: () => of(undefined)
    } as any);

    component.openStoryModal();

    expect(pauseSpy).toHaveBeenCalledWith(true);
    expect(dialogSpy.open).toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalledWith(true);
    expect(storyActionSpy).not.toHaveBeenCalled();
  });

  it('openStoryModal should emit storyAction when modal returns a result', () => {
    const modalResult = { action: ACTIONS.SHARE };
    const storyActionSpy = spyOn(component.storyAction, 'emit');

    dialogSpy.open.and.returnValue({
      afterClosed: () => of(modalResult)
    } as any);

    component.openStoryModal();

    expect(storyActionSpy).toHaveBeenCalledWith(modalResult);
  });

  it('openShareModal should use native share and queue share action on success', fakeAsync(() => {
    const pauseSpy = spyOn(component.pauseCarousel, 'emit');
    const resumeSpy = spyOn(component.resumeCarousel, 'emit');
    const nextSpy = spyOn<any>(component['action$'], 'next').and.stub();

    shareServiceSpy.canNativeShare.and.returnValue(true);
    shareServiceSpy.nativeShare.and.returnValue(Promise.resolve());

    component.openShareModal();
    flushMicrotasks();

    expect(pauseSpy).toHaveBeenCalledWith(true);
    expect(shareServiceSpy.nativeShare).toHaveBeenCalledWith('story-1');
    expect(nextSpy).toHaveBeenCalledWith({ story: component.story, action: ACTIONS.SHARE });
    expect(resumeSpy).toHaveBeenCalledWith(true);
  }));

  it('openShareModal should log debug and still resume when native share fails', fakeAsync(() => {
    const resumeSpy = spyOn(component.resumeCarousel, 'emit');
    const nextSpy = spyOn<any>(component['action$'], 'next').and.stub();
    const debugSpy = spyOn(console, 'debug');

    shareServiceSpy.canNativeShare.and.returnValue(true);
    shareServiceSpy.nativeShare.and.returnValue(Promise.reject('cancelled'));

    component.openShareModal();
    flushMicrotasks();

    expect(debugSpy).toHaveBeenCalledWith('Native share cancelled or failed', 'cancelled');
    expect(nextSpy).not.toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalledWith(true);
  }));

  it('openShareModal should open dialog and queue share action when result is ok', () => {
    const nextSpy = spyOn<any>(component['action$'], 'next').and.stub();
    const resumeSpy = spyOn(component.resumeCarousel, 'emit');

    shareServiceSpy.canNativeShare.and.returnValue(false);
    dialogSpy.open.and.returnValue({
      afterClosed: () => of('ok')
    } as any);

    component.openShareModal();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalledWith({ story: component.story, action: ACTIONS.SHARE });
    expect(resumeSpy).toHaveBeenCalledWith(true);
  });

  it('openShareModal should open dialog and skip queue when result is not ok', () => {
    const nextSpy = spyOn<any>(component['action$'], 'next').and.stub();
    const resumeSpy = spyOn(component.resumeCarousel, 'emit');

    dialogSpy.open.and.returnValue({
      afterClosed: () => of('cancel')
    } as any);

    component.openShareModal();

    expect(nextSpy).not.toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalledWith(true);
  });

  it('constructor stream should emit storyAction for share result', fakeAsync(() => {
    const storyActionSpy = spyOn(component.storyAction, 'emit');
    firebaseSpy.updateRecord.and.resolveTo({ action: ACTIONS.SHARE, status: 200, storyId: 'story-1', diff: 1 } as any);

    component.handleUserClick(component.story, ACTIONS.LIKE);
    tick(1000);
    flushMicrotasks();

    expect(storyActionSpy).toHaveBeenCalledWith(jasmine.objectContaining({ action: ACTIONS.SHARE }));
  }));

  it('constructor stream should log error when action stream errors', () => {
    const error = new Error('update failed');
    const errorSpy = spyOn(console, 'error');
    (component as any).action$.error(error);

    expect(errorSpy).toHaveBeenCalledWith('Action failed:', error);
  });

  it('ngOnDestroy should unsubscribe and complete the action stream', () => {
    const unsubscribeSpy = spyOn<any>(component['actionSub'], 'unsubscribe').and.callThrough();
    const completeSpy = spyOn<any>(component['action$'], 'complete').and.callThrough();

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('ngOnDestroy should still complete stream when actionSub is missing', () => {
    (component as any).actionSub = undefined;
    const completeSpy = spyOn<any>(component['action$'], 'complete').and.callThrough();

    component.ngOnDestroy();

    expect(completeSpy).toHaveBeenCalled();
  });
});
