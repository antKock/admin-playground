// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { ActionThemeDomainStore } from '@domains/action-themes/action-theme.store';
import { ActionTheme, ActionThemeCreate, ActionThemeUpdate } from '@domains/action-themes/action-theme.models';
import { ToastService } from '@app/shared/services/toast.service';
import { ActionThemeFeatureStore } from './action-theme.store';

@Injectable({ providedIn: 'root' })
export class ActionThemeFacade {
  private readonly domainStore = inject(ActionThemeDomainStore);
  private readonly featureStore = inject(ActionThemeFeatureStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Data signals — readonly
  readonly items = this.featureStore.items;
  readonly selectedItem = this.featureStore.selectedItem;
  readonly isLoading = this.featureStore.isLoading;
  readonly isLoadingDetail = this.featureStore.isLoadingDetail;
  readonly hasMore = this.featureStore.hasMore;
  readonly error = this.featureStore.error;
  readonly detailError = this.featureStore.detailError;
  readonly isEmpty = this.featureStore.isEmpty;

  // Per-mutation CRUD status signals
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;

  // Per-mutation lifecycle status signals
  readonly publishIsPending = this.domainStore.publishMutationIsPending;
  readonly disableIsPending = this.domainStore.disableMutationIsPending;
  readonly activateIsPending = this.domainStore.activateMutationIsPending;
  readonly duplicateIsPending = this.domainStore.duplicateMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending() ||
    this.publishIsPending() || this.disableIsPending() ||
    this.activateIsPending() || this.duplicateIsPending(),
  );

  // Intention methods
  load(filters?: Record<string, string>): void {
    this.domainStore.load(filters);
  }

  loadMore(): void {
    this.domainStore.loadMore();
  }

  select(id: string): void {
    this.domainStore.selectById(id);
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
  }

  // CRUD mutations
  async create(data: ActionThemeCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Thème d\'action créé');
      this.router.navigate(['/action-themes']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async update(id: string, data: ActionThemeUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Thème d\'action mis à jour');
      this.domainStore.load(undefined);
      this.router.navigate(['/action-themes', id]);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Thème d\'action supprimé');
      this.router.navigate(['/action-themes']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  // Lifecycle / status mutations
  async publish(id: string): Promise<void> {
    const result = await this.domainStore.publishMutation(id);
    if (result.status === 'success') {
      this.toast.success('Thème d\'action publié');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error, 'Impossible de publier le thème d\'action');
    }
  }

  async disable(id: string): Promise<void> {
    const result = await this.domainStore.disableMutation(id);
    if (result.status === 'success') {
      this.toast.success('Thème d\'action désactivé');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error, 'Impossible de désactiver le thème d\'action');
    }
  }

  async activate(id: string): Promise<void> {
    const result = await this.domainStore.activateMutation(id);
    if (result.status === 'success') {
      this.toast.success('Thème d\'action activé');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error, 'Impossible d\'activer le thème d\'action');
    }
  }

  async duplicate(id: string): Promise<void> {
    const result = await this.domainStore.duplicateMutation(id);
    if (result.status === 'success') {
      this.toast.success('Thème d\'action dupliqué');
      const duplicated = result.value as ActionTheme;
      this.router.navigate(['/action-themes', duplicated.id]);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error, 'Échec de la duplication');
    }
  }

  // Intentionally inlined per facade (not shared) — each facade may need custom error handling in the future.
  private handleMutationError(error: unknown, prefix?: string): void {
    const httpError = error as { status?: number; error?: { detail?: unknown; message?: string }; message?: string };
    if (httpError?.status === 409) {
      const reason = httpError.error?.detail || 'lié à d\'autres ressources';
      this.toast.error(`Suppression impossible — ${typeof reason === 'string' ? reason : 'lié à d\'autres ressources'}`);
    } else if (httpError?.status === 422 && httpError.error?.detail) {
      this.toast.error('Veuillez corriger les erreurs de validation');
    } else {
      const message = httpError?.error?.detail || httpError?.error?.message || httpError?.message || 'Une erreur est survenue';
      const text = typeof message === 'string' ? message : 'Une erreur est survenue';
      this.toast.error(prefix ? `${prefix} — ${text}` : text);
    }
  }
}
