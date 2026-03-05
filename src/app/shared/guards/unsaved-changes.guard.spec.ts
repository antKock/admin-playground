import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { unsavedChangesGuard, HasUnsavedChanges } from './unsaved-changes.guard';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

describe('unsavedChangesGuard', () => {
  let confirmDialogService: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    confirmDialogService = TestBed.inject(ConfirmDialogService);
  });

  it('should allow navigation when no unsaved changes', async () => {
    const component: HasUnsavedChanges = { hasUnsavedChanges: () => false };

    const result = await TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component as any,
        {} as any,
        {} as any,
        {} as any,
      ),
    );

    expect(result).toBe(true);
  });

  it('should block navigation when unsaved changes and user cancels', async () => {
    const component: HasUnsavedChanges = { hasUnsavedChanges: () => true };

    const guardPromise = TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component as any,
        {} as any,
        {} as any,
        {} as any,
      ),
    );

    // Simulate user clicking "Cancel" (don't discard)
    confirmDialogService.close(false);

    const result = await guardPromise;
    expect(result).toBe(false);
  });

  it('should allow navigation when unsaved changes and user confirms discard', async () => {
    const component: HasUnsavedChanges = { hasUnsavedChanges: () => true };

    const guardPromise = TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component as any,
        {} as any,
        {} as any,
        {} as any,
      ),
    );

    // Simulate user clicking "Discard Changes"
    confirmDialogService.close(true);

    const result = await guardPromise;
    expect(result).toBe(true);
  });
});
