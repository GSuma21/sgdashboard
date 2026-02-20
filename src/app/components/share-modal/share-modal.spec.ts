import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TemplateRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';

import { ShareModal } from './share-modal';

describe('ShareModal', () => {
  let component: ShareModal;
  let fixture: ComponentFixture<ShareModal>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ShareModal>>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let toastDialogRefSpy: jasmine.SpyObj<{ close: () => void }>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    toastDialogRefSpy = jasmine.createSpyObj('ToastDialogRef', ['close']);
    dialogSpy.open.and.returnValue(toastDialogRefSpy as any);

    await TestBed.configureTestingModule({
      imports: [ShareModal],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: { storyId: 'story-123' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize shareLink from story id', () => {
    expect(component.shareLink).toContain('/voices-from-the-ground?storyId=story-123');
  });

  it('should close modal', () => {
    component.closeModal();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should copy text using navigator.clipboard in secure context', async () => {
    const writeTextSpy = jasmine.createSpy('writeText').and.resolveTo();
    const snackSpy = spyOn(component, 'showSnackBar');
    spyOnProperty(window, 'isSecureContext', 'get').and.returnValue(true);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true
    });

    await component.copyText();

    expect(writeTextSpy).toHaveBeenCalledWith(`${environment.shareText}\n\n${component.shareLink}`);
    expect(snackSpy).toHaveBeenCalledWith('Link & text copied to clipboard');
    expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
  });

  it('should copy text using fallback execCommand', async () => {
    const snackSpy = spyOn(component, 'showSnackBar');
    spyOnProperty(window, 'isSecureContext', 'get').and.returnValue(false);
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true
    });
    spyOn(document, 'execCommand').and.returnValue(true);

    await component.copyText();

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(snackSpy).toHaveBeenCalledWith('Link & text copied to clipboard');
    expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
  });

  it('should show failure snackbar when copy fails', async () => {
    const snackSpy = spyOn(component, 'showSnackBar');
    spyOnProperty(window, 'isSecureContext', 'get').and.returnValue(false);
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true
    });
    spyOn(document, 'execCommand').and.returnValue(false);

    await component.copyText();

    expect(snackSpy).toHaveBeenCalledWith('Failed to copy link & text. Please copy manually.');
  });

  it('should open linkedin share url', () => {
    const openSpy = spyOn(window, 'open');

    component.share('linkedin');

    expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
    expect(openSpy).toHaveBeenCalled();
  });

  it('should open whatsapp share url with text', () => {
    const openSpy = spyOn(window, 'open');

    component.share('whatsapp');

    const [url] = openSpy.calls.mostRecent().args;
    expect(url as string).toContain(environment.whatsapp);
    expect(url as string).toContain('text=');
  });

  it('should open instagram web url on desktop', () => {
    const openSpy = spyOn(window, 'open');
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Mozilla/5.0');

    component.share('instagram');

    expect(openSpy).toHaveBeenCalledWith(environment.instagram, '_blank', 'noopener,noreferrer');
  });

  it('should close dialog when shareNative succeeds', fakeAsync(() => {
    Object.defineProperty(navigator, 'share', {
      value: jasmine.createSpy('share').and.returnValue(Promise.resolve()),
      configurable: true
    });

    (component as any).shareNative();
    tick();

    expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
  }));

  it('should show cancelled snackbar when shareNative fails', fakeAsync(() => {
    Object.defineProperty(navigator, 'share', {
      value: jasmine.createSpy('share').and.returnValue(Promise.reject(new Error('cancel'))),
      configurable: true
    });
    const snackSpy = spyOn(component, 'showSnackBar');

    (component as any).shareNative();
    tick();

    expect(snackSpy).toHaveBeenCalledWith('Sharing cancelled');
  }));

  it('should show error when dialogToast is missing', () => {
    const errorSpy = spyOn(console, 'error');
    component.dialogToast = undefined as unknown as TemplateRef<any>;

    component.showSnackBar('test');

    expect(errorSpy).toHaveBeenCalledWith('dialogToast template not found');
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('should open and auto-close snackbar dialog', fakeAsync(() => {
    component.showSnackBar('test', 1000, 'center', 'bottom');
    tick(1000);

    expect(dialogSpy.open).toHaveBeenCalled();
    const args = dialogSpy.open.calls.mostRecent().args;
    const config = args[1] as any;
    expect(config.position.bottom).toBe('16px');
    expect(config.position.left).toBe('50%');
    expect(toastDialogRefSpy.close).toHaveBeenCalled();
  }));
});
