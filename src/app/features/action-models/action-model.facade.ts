// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { ActionModelDomainStore } from '@domains/action-models/action-model.store';
import { ActionModelCreate, ActionModelUpdate } from '@domains/action-models/action-model.models';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { ActionThemeDomainStore } from '@domains/action-themes/action-theme.store';
import { ToastService } from '@app/shared/services/toast.service';
import { ActionModelFeatureStore } from './action-model.store';

@Injectable({ providedIn: 'root' })
export class ActionModelFacade {
  private readonly domainStore = inject(ActionModelDomainStore);
  private readonly featureStore = inject(ActionModelFeatureStore);
  private readonly fpDomainStore = inject(FundingProgramDomainStore);
  private readonly atDomainStore = inject(ActionThemeDomainStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Data signals — readonly
  readonly items = this.featureStore.items;
  readonly selectedItem = this.featureStore.selectedItem;
  readonly isLoading = this.featureStore.isLoading;
  readonly isLoadingDetail = this.featureStore.isLoadingDetail;
  readonly hasMore = this.featureStore.hasMore;
  readonly error = this.featureStore.error;
  readonly isEmpty = this.featureStore.isEmpty;

  // Cross-domain signals for FP/AT dropdowns (projected through feature store)
  readonly fpOptions = this.featureStore.fpOptions;
  readonly atOptions = this.featureStore.atOptions;
  readonly fpLoading = this.featureStore.fpLoading;
  readonly atLoading = this.featureStore.atLoading;

  // Per-mutation CRUD status signals (projected through feature store)
  readonly createIsPending = this.featureStore.createIsPending;
  readonly updateIsPending = this.featureStore.updateIsPending;
  readonly deleteIsPending = this.featureStore.deleteIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending(),
  );

  // Intention methods
  // TODO: [H3] load() only fetches the first page (default limit ~20). If there are >20 FPs/ATs,
  // dropdown options will be incomplete. Fix: add a loadAll() to withCursorPagination or use a
  // dedicated non-paginated endpoint for association selectors.
  loadAssociationData(): void {
    this.fpDomainStore.load(undefined);
    this.atDomainStore.load(undefined);
  }

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

  async create(data: ActionModelCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Action Model created');
      this.router.navigate(['/action-models']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async update(id: string, data: ActionModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Action Model updated');
      this.domainStore.refresh(undefined);
      this.router.navigate(['/action-models', id]);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Action Model deleted');
      this.router.navigate(['/action-models']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  private handleMutationError(error: unknown): void {
    const httpError = error as { status?: number; error?: { detail?: unknown; message?: string }; message?: string };
    if (httpError?.status === 409) {
      const reason = httpError.error?.detail || 'This resource is linked to other resources';
      this.toast.error(`Conflict — ${typeof reason === 'string' ? reason : 'linked to other resources'}`);
    } else if (httpError?.status === 422 && httpError.error?.detail) {
      this.toast.error('Please fix the validation errors');
    } else {
      const message = httpError?.error?.detail || httpError?.error?.message || httpError?.message || 'An error occurred';
      this.toast.error(typeof message === 'string' ? message : 'An error occurred');
    }
  }
}
