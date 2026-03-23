import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { ConfirmDialogService } from '../components/confirm-dialog/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = async (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  const confirmDialog = inject(ConfirmDialogService);
  return confirmDialog.confirm({
    title: 'Modifications non enregistrées',
    message: 'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter cette page ?',
    confirmLabel: 'Abandonner les modifications',
    confirmVariant: 'danger',
  });
};
