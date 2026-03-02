import { UtilsService } from './utils.services';
import { ACTIONS, SVG_COLORS } from '../../constants/actionConstants';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(() => {
    service = new UtilsService();
    localStorage.clear();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should create and persist browser id when not present', () => {
    const id = service.getBrowserId();

    expect(id).toBeTruthy();
    expect(localStorage.getItem('browserId')).toBe(id);
  });

  it('should return existing browser id from localStorage', () => {
    localStorage.setItem('browserId', 'existing-browser-id');

    const id = service.getBrowserId();

    expect(id).toBe('existing-browser-id');
  });

  it('should update likes for matching story and clamp to zero', () => {
    const list = [
      { storyId: 's1', likesCount: 1, like: false },
      { storyId: 's2', likesCount: 5, like: true },
    ];

    const updated = service.updateStoryCounts(list, {
      storyId: 's1',
      action: ACTIONS.LIKE,
      diff: -5,
    });

    expect(updated[0].likesCount).toBe(0);
    expect(updated[0].like).toBeTrue();
    expect(updated[1]).toBe(list[1]);
  });

  it('should update share and download counts for matching story', () => {
    const base = [{ storyId: 's1', shareCount: 2, downloadCount: 3 }];

    const shared = service.updateStoryCounts(base, {
      storyId: 's1',
      action: ACTIONS.SHARE,
    });
    expect(shared[0].shareCount).toBe(3);

    const downloaded = service.updateStoryCounts(base, {
      storyId: 's1',
      action: ACTIONS.DOWNLOAD,
    });
    expect(downloaded[0].downloadCount).toBe(4);
  });

  it('should return original slide for unknown action and non-matching story', () => {
    const list = [
      { storyId: 's1', likesCount: 1 },
      { storyId: 's2', likesCount: 2 },
    ];

    const unknown = service.updateStoryCounts(list, {
      storyId: 's1',
      action: 'UNKNOWN',
    });
    expect(unknown[0]).toBe(list[0]);

    const nonMatching = service.updateStoryCounts(list, {
      storyId: 'missing',
      action: ACTIONS.LIKE,
      diff: 1,
    });
    expect(nonMatching[0]).toBe(list[0]);
    expect(nonMatching[1]).toBe(list[1]);
  });

  it('should merge only the targeted story in updateStory', () => {
    const list = [
      { id: '1', title: 'A', shareCount: 1 },
      { id: '2', title: 'B', shareCount: 2 },
    ];

    const updated = service.updateStory(list, { id: '2', shareCount: 10, extra: true });

    expect(updated[0]).toEqual(list[0]);
    expect(updated[1]).toEqual({ id: '2', title: 'B', shareCount: 10, extra: true });
  });

  it('should assign colors in order and wrap over SVG_COLORS length', () => {
    const stories = Array.from({ length: SVG_COLORS.length + 2 }, (_, i) => ({ id: `${i}` }));

    const result = service.assignColorsToStories(stories);

    expect(result[0].color).toBe(SVG_COLORS[0]);
    expect(result[SVG_COLORS.length - 1].color).toBe(SVG_COLORS[SVG_COLORS.length - 1]);
    expect(result[SVG_COLORS.length].color).toBe(SVG_COLORS[0]);
    expect(result[SVG_COLORS.length + 1].color).toBe(SVG_COLORS[1]);
  });
});
