import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoicesAnimationsComponent } from './voices-animations.component';

describe('VoicesAnimationsComponent', () => {
  let component: VoicesAnimationsComponent;
  let fixture: ComponentFixture<VoicesAnimationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VoicesAnimationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoicesAnimationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
