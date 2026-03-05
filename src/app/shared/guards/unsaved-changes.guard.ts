import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { ConfirmDialogService } from '../services/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = async (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  const confirmDialog = inject(ConfirmDialogService);
  return confirmDialog.confirm({
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Are you sure you want to leave this page?',
    confirmLabel: 'Discard Changes',
    confirmVariant: 'danger',
  });
};
