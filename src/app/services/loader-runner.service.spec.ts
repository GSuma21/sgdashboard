import { LoaderRunnerService } from './loader-runner.service';
import { LoaderService } from './loader.service';

describe('LoaderRunnerService', () => {
  let service: LoaderRunnerService;
  let loader: jasmine.SpyObj<LoaderService>;

  beforeEach(() => {
    loader = jasmine.createSpyObj<LoaderService>('LoaderService', ['show', 'hide']);
    service = new LoaderRunnerService(loader);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should call show before work and hide after successful work', async () => {
    const result = await service.run(async () => 'done');

    expect(result).toBe('done');
    expect(loader.show).toHaveBeenCalledTimes(1);
    expect(loader.hide).toHaveBeenCalledTimes(1);
    expect(loader.show).toHaveBeenCalledBefore(loader.hide);
  });

  it('should call hide even when work throws', async () => {
    await expectAsync(
      service.run(async () => {
        throw new Error('runner-failed');
      }),
    ).toBeRejectedWithError('runner-failed');

    expect(loader.show).toHaveBeenCalledTimes(1);
    expect(loader.hide).toHaveBeenCalledTimes(1);
    expect(loader.show).toHaveBeenCalledBefore(loader.hide);
  });
});
