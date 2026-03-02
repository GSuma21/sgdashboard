import { LoaderService } from './loader.service';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    service = new LoaderService();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should emit false by default', () => {
    let value: boolean | undefined;
    service.isLoading$.subscribe((v) => (value = v));
    expect(value).toBeFalse();
  });

  it('should emit true when show is called', () => {
    const emissions: boolean[] = [];
    service.isLoading$.subscribe((v) => emissions.push(v));

    service.show();

    expect(emissions[emissions.length - 1]).toBeTrue();
  });

  it('should stay true when hide is called but counter is still above zero', () => {
    const emissions: boolean[] = [];
    service.isLoading$.subscribe((v) => emissions.push(v));

    service.show();
    service.show();
    service.hide();

    expect(emissions[emissions.length - 1]).toBeTrue();
  });

  it('should emit false and clamp counter when hide reaches zero or below', () => {
    const emissions: boolean[] = [];
    service.isLoading$.subscribe((v) => emissions.push(v));

    service.show();
    service.hide(); // counter -> 0, should emit false
    service.hide(); // counter -> -1, should clamp to 0 and emit false again

    expect(emissions).toEqual([false, true, false, false]);
  });
});
