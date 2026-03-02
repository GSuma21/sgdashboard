import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { firebaseService } from './firestore-service';
import { APP_LIMITS } from '../constants/actionConstants';

describe('firebaseService', () => {
  let service: firebaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        firebaseService,
        { provide: Firestore, useValue: {} }
      ]
    });

    service = TestBed.inject(firebaseService);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty array when storyIds is empty', async () => {
    const result = await service.getStoryCountsBulk([], 'browser-1');

    expect(result).toEqual([]);
  });

  it('should return empty array when storyIds is undefined', async () => {
    const result = await service.getStoryCountsBulk(undefined as unknown as string[], 'browser-1');

    expect(result).toEqual([]);
  });

  it('should throw when storyIds length exceeds limit', async () => {
    const storyIds = Array(APP_LIMITS.STORY_ID_QUERY_LIMIT + 1).fill('story');

    await expectAsync(service.getStoryCountsBulk(storyIds, 'browser-1')).toBeRejectedWithError(
      'Max 100 storyIds allowed'
    );
  });
});
