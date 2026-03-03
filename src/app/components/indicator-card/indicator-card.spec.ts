import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndicatorCardComponent } from './indicator-card';

describe('IndicatorCardComponent', () => {
  let component: IndicatorCardComponent;
  let fixture: ComponentFixture<IndicatorCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicatorCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize input defaults', () => {
    expect(component.value).toBe('');
    expect(component.label).toBe('');
    expect(component.icon).toBe('');
  });

  it('should render bound input values in the template', () => {
    component.value = '1,245';
    component.label = 'Total Schools';
    component.icon = 'assets/icons/school.svg';

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const valueEl = host.querySelector('.indicator-value');
    const labelEl = host.querySelector('.indicator-label');
    const iconEl = host.querySelector('.indicator-icon') as HTMLImageElement | null;

    expect(valueEl?.textContent?.trim()).toBe('1,245');
    expect(labelEl?.textContent?.trim()).toBe('Total Schools');
    expect(iconEl?.getAttribute('src')).toBe('assets/icons/school.svg');
    expect(iconEl?.getAttribute('alt')).toBe('indicator icon');
  });

  it('should render numeric values passed to value input', () => {
    component.value = 42;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.indicator-value')?.textContent?.trim()).toBe('42');
  });
});