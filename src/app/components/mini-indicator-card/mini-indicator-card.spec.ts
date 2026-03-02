import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MiniIndicatorCardComponent } from './mini-indicator-card';

describe('MiniIndicatorCardComponent', () => {
  let component: MiniIndicatorCardComponent;
  let fixture: ComponentFixture<MiniIndicatorCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniIndicatorCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MiniIndicatorCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize input defaults', () => {
    expect(component.value).toBe('');
    expect(component.label).toBe('');
  });

  it('should render bound label and value when value is truthy', () => {
    component.label = 'Schools';
    component.value = 128;

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.mini-indicator-label')?.textContent?.trim()).toBe('Schools');
    expect(host.querySelector('.mini-indicator-value')?.textContent?.trim()).toBe('128');
  });

  it('should render 0 when value is falsy', () => {
    component.value = '';
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.mini-indicator-value')?.textContent?.trim()).toBe('0');
  });
});
