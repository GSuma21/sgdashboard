import { ShareService } from './share.service';
import { environment } from '../../../environments/environment';

describe('ShareService', () => {
  let service: ShareService;
  let originalUserAgent: string;
  let originalShare: any;

  const setUserAgent = (ua: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: ua,
    });
  };

  const setNavigatorShare = (value: any) => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      writable: true,
      value,
    });
  };

  beforeEach(() => {
    service = new ShareService();
    originalUserAgent = navigator.userAgent;
    originalShare = (navigator as any).share;
  });

  afterEach(() => {
    setUserAgent(originalUserAgent);
    if (originalShare === undefined) {
      delete (navigator as any).share;
    } else {
      setNavigatorShare(originalShare);
    }
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should return true for native share support on mobile', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    setNavigatorShare(jasmine.createSpy('share').and.returnValue(Promise.resolve()));

    expect(service.canNativeShare()).toBeTrue();
  });

  it('should return false when navigator.share is not available', () => {
    setUserAgent('Mozilla/5.0 (Android 14)');
    delete (navigator as any).share;

    expect(service.canNativeShare()).toBeFalse();
  });

  it('should return false on non-mobile user agent', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    setNavigatorShare(jasmine.createSpy('share').and.returnValue(Promise.resolve()));

    expect(service.canNativeShare()).toBeFalse();
  });

  it('should reject nativeShare when native share is not supported', async () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    delete (navigator as any).share;

    await expectAsync(service.nativeShare('story-1')).toBeRejectedWithError(
      'Native share is not supported on this platform',
    );
  });

  it('should call navigator.share with encoded story url and configured text', async () => {
    setUserAgent('Mozilla/5.0 (Android 14)');
    const shareSpy = jasmine.createSpy('share').and.returnValue(Promise.resolve());
    setNavigatorShare(shareSpy);

    const storyId = 'story id/ä';
    await service.nativeShare(storyId);

    expect(shareSpy).toHaveBeenCalledWith({
      text: environment.shareText,
      url: `${window.location.origin}/voices-from-the-ground?storyId=${encodeURIComponent(storyId)}`,
    });
  });
});
