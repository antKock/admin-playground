import { TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmDialogService);
  });

  it('should start with no dialog', () => {
    expect(service.dialog()).toBeNull();
  });

  it('should open a dialog', () => {
    service.confirm({ title: 'Delete?', message: 'Are you sure?' });
    expect(service.dialog()).toBeTruthy();
    expect(service.dialog()?.title).toBe('Delete?');
    service.close(false);
  });

  it('should resolve with true on confirm', async () => {
    const promise = service.confirm({ title: 'Test', message: 'Msg' });
    service.close(true);
    const result = await promise;
    expect(result).toBe(true);
  });

  it('should resolve with false on cancel', async () => {
    const promise = service.confirm({ title: 'Test', message: 'Msg' });
    service.close(false);
    const result = await promise;
    expect(result).toBe(false);
  });

  it('should clear dialog after close', async () => {
    const promise = service.confirm({ title: 'Test', message: 'Msg' });
    service.close(true);
    await promise;
    expect(service.dialog()).toBeNull();
  });
});

describe('ConfirmDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not render dialog when no dialog state', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.confirm-overlay');
    expect(overlay).toBeFalsy();
  });

  it('should render dialog when opened', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const service = TestBed.inject(ConfirmDialogService);
    service.confirm({ title: 'Delete item?', message: 'This cannot be undone.' });
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('.confirm-dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Delete item?');
    expect(dialog.textContent).toContain('This cannot be undone.');
    service.close(false);
  });

  it('should render Cancel and Confirm buttons', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const service = TestBed.inject(ConfirmDialogService);
    service.confirm({ title: 'Test', message: 'Msg' });
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const buttonTexts = Array.from(buttons).map((b) => (b as HTMLButtonElement).textContent?.trim());
    expect(buttonTexts).toContain('Cancel');
    expect(buttonTexts).toContain('Confirm');
    service.close(false);
  });

  it('should use custom confirm label', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const service = TestBed.inject(ConfirmDialogService);
    service.confirm({ title: 'Test', message: 'Msg', confirmLabel: 'Delete' });
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const buttonTexts = Array.from(buttons).map((b) => (b as HTMLButtonElement).textContent?.trim());
    expect(buttonTexts).toContain('Delete');
    service.close(false);
  });

  it('should have role="alertdialog" for accessibility', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const service = TestBed.inject(ConfirmDialogService);
    service.confirm({ title: 'Test', message: 'Msg' });
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialog).toBeTruthy();
    service.close(false);
  });

  it('should have cdkTrapFocus for focus management', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const service = TestBed.inject(ConfirmDialogService);
    service.confirm({ title: 'Test', message: 'Msg' });
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[cdktrapfocus]');
    expect(dialog).toBeTruthy();
    service.close(false);
  });

  it('should close on Escape key', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const service = TestBed.inject(ConfirmDialogService);
    service.confirm({ title: 'Test', message: 'Msg' });
    fixture.detectChanges();
    fixture.componentInstance.onEscape();
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.confirm-overlay');
    expect(overlay).toBeFalsy();
  });
});
