import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImprovementStoryComponent } from './improvement-story.component';

describe('ImprovementStoryComponent', () => {
  let component: ImprovementStoryComponent;
  let fixture: ComponentFixture<ImprovementStoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImprovementStoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImprovementStoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
