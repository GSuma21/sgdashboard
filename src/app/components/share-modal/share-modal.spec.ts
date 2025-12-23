import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareModal } from './share-modal';

describe('ShareModal', () => {
  let component: ShareModal;
  let fixture: ComponentFixture<ShareModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
