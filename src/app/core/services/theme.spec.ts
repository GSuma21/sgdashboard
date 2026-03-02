import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return light theme by default', () => {
    expect(service.getTheme()()).toBe('light');
  });

  it('should update theme when setTheme is called', () => {
    service.setTheme('dark');
    expect(service.getTheme()()).toBe('dark');

    service.setTheme('light');
    expect(service.getTheme()()).toBe('light');
  });
});