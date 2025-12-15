import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoriesCarouselComponent } from './stories-carousel.component';

describe('StoriesCarouselComponent', () => {
  let component: StoriesCarouselComponent;
  let fixture: ComponentFixture<StoriesCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoriesCarouselComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StoriesCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
