import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramDetails } from './program-details';

describe('ProgramDetails', () => {
  let component: ProgramDetails;
  let fixture: ComponentFixture<ProgramDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
