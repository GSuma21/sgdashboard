import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiAxisChartComponent } from './multi-axis-chart.component';

describe('MultiAxisChartComponent', () => {
  let component: MultiAxisChartComponent;
  let fixture: ComponentFixture<MultiAxisChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiAxisChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiAxisChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
