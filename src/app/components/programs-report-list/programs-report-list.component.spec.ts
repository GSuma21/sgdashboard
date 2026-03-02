import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramsReportListComponent } from './programs-report-list.component';

describe('ProgramsReportListComponent', () => {
  let component: ProgramsReportListComponent;
  let fixture: ComponentFixture<ProgramsReportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramsReportListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProgramsReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
