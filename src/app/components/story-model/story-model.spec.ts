import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryModel } from './story-model';

describe('StoryModel', () => {
  let component: StoryModel;
  let fixture: ComponentFixture<StoryModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryModel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryModel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
