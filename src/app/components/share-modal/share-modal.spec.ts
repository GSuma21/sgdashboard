import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TemplateRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';

import { ShareModal } from './share-modal';

// make sure environment has sensible defaults (tests may run in isolation)
environment.shareText ||= 'share text';
environment.linkedin ||= 'https://linkedin.com/share?url=';
environment.whatsapp ||= 'https://wa.me/?';
environment.facebook ||= 'https://facebook.com/sharer/sharer.php?u=';
environment.instagram ||= 'https://instagram.com';

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

  it('should create and compute shareLink/text', () => {
    expect(component).toBeTruthy();
    const origin = window.location.origin;
    expect(component.shareLink).toBe(`${origin}/voices-from-the-ground?storyId=abc`);
    expect(component.shareText).toBe(environment.shareText);
  });

  it('closeModal closes dialog', () => {
    component.closeModal();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  describe('copyText', () => {
    beforeEach(() => {
      dialogRefSpy.close.calls.reset();
      dialogSpy.open.calls.reset();
      spyOn(component, 'showSnackBar');
      // clean clipboard state
      delete (navigator as any).clipboard;
      // isSecureContext is read-only; override getter instead
      spyOnProperty(window, 'isSecureContext', 'get').and.returnValue(false);
    });

    it('uses navigator.clipboard when available & secure', async () => {
      const writeSpy = jasmine.createSpy().and.returnValue(Promise.resolve());
      (navigator as any).clipboard = { writeText: writeSpy };
      spyOnProperty(window, 'isSecureContext', 'get').and.returnValue(true);

      await component.copyText();
      expect(writeSpy).toHaveBeenCalledWith(`${environment.shareText}\n\n${component.shareLink}`);
      expect(component.showSnackBar).toHaveBeenCalledWith('Link & text copied to clipboard');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
    });

    it('falls back to execCommand when clipboard not present', async () => {
      spyOn(document, 'execCommand').and.returnValue(true);
      await component.copyText();
      expect(component.showSnackBar).toHaveBeenCalledWith('Link & text copied to clipboard');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
    });

    it('shows failure message when copy fallback fails', async () => {
      spyOn(document, 'execCommand').and.returnValue(false);
      await component.copyText();
      expect(component.showSnackBar).toHaveBeenCalledWith('Failed to copy link & text. Please copy manually.');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });

  describe('share()', () => {
    beforeEach(() => {
      dialogRefSpy.close.calls.reset();
      spyOn(window, 'open');
    });

    it('opens linkedin with correct url', () => {
      component.share('linkedin');
      const expected = environment.linkedin + encodeURIComponent(component.shareLink);
      expect(window.open).toHaveBeenCalledWith(expected, '_blank', 'noopener,noreferrer');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
    });

    it('opens whatsapp with correct url', () => {
      component.share('whatsapp');
      const text = encodeURIComponent(component.shareText);
      const expected = environment.whatsapp + `text=${text}%0A%0A` + encodeURIComponent(component.shareLink);
      expect(window.open).toHaveBeenCalledWith(expected, '_blank', 'noopener,noreferrer');
    });

    it('opens facebook with correct url', () => {
      component.share('facebook');
      const expected = environment.facebook + encodeURIComponent(component.shareLink);
      expect(window.open).toHaveBeenCalledWith(expected, '_blank', 'noopener,noreferrer');
    });

    it('instagram on desktop opens directly', () => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0');
      component.share('instagram');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
      expect(window.open).toHaveBeenCalledWith(environment.instagram, '_blank', 'noopener,noreferrer');
    });

    it('instagram on mobile sets href then opens after timeout', () => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('Android');
      // spyOnProperty allows monitoring of getters/setters
      spyOnProperty(window.location, 'href', 'set');
      jasmine.clock().install();

      component.share('instagram');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
      expect(window.location.href).toBe('instagram://app');

      jasmine.clock().tick(1500);
      expect(window.open).toHaveBeenCalledWith(environment.instagram, '_blank', 'noopener,noreferrer');
      jasmine.clock().uninstall();
    });
  });

  describe('shareNative()', () => {
    it('does nothing if navigator.share is missing', () => {
      delete (navigator as any).share;
      (component as any).shareNative();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('closes dialog on successful share', fakeAsync(() => {
      (navigator as any).share = jasmine.createSpy().and.returnValue(Promise.resolve());
      (component as any).shareNative();
      tick();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('ok');
    }));

    it('shows snackbar when share fails', fakeAsync(() => {
      spyOn(component, 'showSnackBar');
      (navigator as any).share = jasmine.createSpy().and.returnValue(Promise.reject());
      (component as any).shareNative();
      tick();
      expect(component.showSnackBar).toHaveBeenCalledWith('Sharing cancelled');
    }));
  });

  describe('showSnackBar()', () => {
    it('logs error when template not present', () => {
      component.dialogToast = undefined as any;
      spyOn(console, 'error');
      component.showSnackBar('oops');
      expect(console.error).toHaveBeenCalledWith('dialogToast template not found');
    });

    it('opens a toast dialog with correct positions', () => {
      component.dialogToast = {} as any;
      const fakeRef = { close: jasmine.createSpy() } as any;
      dialogSpy.open.and.returnValue(fakeRef);
      jasmine.clock().install();

      component.showSnackBar('hi', 5000, 'center', 'bottom');
      const recent = dialogSpy.open.calls.mostRecent();
      expect(recent).toBeDefined();
      // args property may be undefined according to typings, assert before using
      expect(recent!.args).toBeDefined();
      const args = recent!.args![1] as any; // now safe
      expect(args.data).toBe('hi');
      expect(args.position.left).toBe('50%');
      expect(args.position.bottom).toBe('16px');

      jasmine.clock().tick(5000);
      expect(fakeRef.close).toHaveBeenCalled();
      jasmine.clock().uninstall();
    });
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
