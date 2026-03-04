import { Injectable, inject, computed, Signal } from '@angular/core';
import { Router } from '@angular/router';

import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { FundingProgram, FundingProgramCreate, FundingProgramUpdate } from '@domains/funding-programs/funding-program.models';
import { ToastService } from '@app/shared/services/toast.service';
import { FundingProgramFeatureStore } from './funding-program.store';

@Injectable({ providedIn: 'root' })
export class FundingProgramFacade {
  private readonly domainStore = inject(FundingProgramDomainStore);
  private readonly featureStore = inject(FundingProgramFeatureStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Data signals — readonly (typed cast from unknown[] to FundingProgram[])
  readonly items: Signal<FundingProgram[]> = computed(() => this.featureStore.items() as FundingProgram[]);
  readonly selectedItem = this.featureStore.selectedItem;
  readonly isLoading = this.featureStore.isLoading;
  readonly isLoadingDetail = this.featureStore.isLoadingDetail;
  readonly hasMore = this.featureStore.hasMore;
  readonly error = this.featureStore.error;
  readonly isEmpty = this.featureStore.isEmpty;

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

  async create(data: FundingProgramCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Funding Program created');
      this.domainStore.load(undefined);
      this.router.navigate(['/funding-programs']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async update(id: string, data: FundingProgramUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Funding Program updated');
      this.router.navigate(['/funding-programs', id]);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Funding Program deleted');
      this.domainStore.load(undefined);
      this.router.navigate(['/funding-programs']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  private handleMutationError(error: unknown): void {
    const httpError = error as { status?: number; error?: { detail?: unknown; message?: string }; message?: string };
    if (httpError?.status === 409) {
      const reason = httpError.error?.detail || 'This program is linked to other resources';
      this.toast.error(`Cannot delete — ${typeof reason === 'string' ? reason : 'linked to other resources'}`);
    } else if (httpError?.status === 422 && httpError.error?.detail) {
      this.toast.error('Please fix the validation errors');
    } else {
      const message = httpError?.error?.detail || httpError?.error?.message || httpError?.message || 'An error occurred';
      this.toast.error(typeof message === 'string' ? message : 'An error occurred');
    }
  }
}
