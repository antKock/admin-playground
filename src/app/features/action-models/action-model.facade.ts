// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ActionModelDomainStore } from '@domains/action-models/action-model.store';
import { ActionModelCreate, ActionModelUpdate, IndicatorModelAssociationInput } from '@domains/action-models/action-model.models';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { ActionThemeDomainStore } from '@domains/action-themes/action-theme.store';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { ToastService } from '@app/shared/services/toast.service';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { ActionModelFeatureStore } from './action-model.store';

@Injectable({ providedIn: 'root' })
export class ActionModelFacade {
  private readonly domainStore = inject(ActionModelDomainStore);
  private readonly featureStore = inject(ActionModelFeatureStore);
  private readonly fpDomainStore = inject(FundingProgramDomainStore);
  private readonly atDomainStore = inject(ActionThemeDomainStore);
  private readonly imDomainStore = inject(IndicatorModelDomainStore);
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

  // Cross-domain signals for FP/AT dropdowns (projected through feature store)
  readonly fpOptions = this.featureStore.fpOptions;
  readonly atOptions = this.featureStore.atOptions;
  readonly fpLoading = this.featureStore.fpLoading;
  readonly atLoading = this.featureStore.atLoading;

  // Cross-domain: indicator model signals
  readonly availableIndicators = this.featureStore.availableIndicators;
  readonly indicatorsLoading = this.featureStore.indicatorsLoading;
  readonly attachedIndicators = this.featureStore.attachedIndicators;

  // Per-mutation CRUD status signals (projected through feature store)
  readonly createIsPending = this.featureStore.createIsPending;
  readonly updateIsPending = this.featureStore.updateIsPending;
  readonly deleteIsPending = this.featureStore.deleteIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending(),
  );

  // Unsaved parameter state — map of indicatorModelId → modified params
  private readonly _paramEdits = signal<Map<string, IndicatorParams>>(new Map());

  readonly paramEdits = this._paramEdits.asReadonly();

  readonly unsavedCount = computed(() => {
    const edits = this._paramEdits();
    const attached = this.attachedIndicators();
    let count = 0;
    for (const [id, edited] of edits) {
      const original = attached.find((im) => im.id === id);
      if (original && this.isParamModified(original, edited)) {
        count++;
      }
    }
    return count;
  });

  readonly modifiedIds = computed(() => {
    const edits = this._paramEdits();
    const attached = this.attachedIndicators();
    const ids: string[] = [];
    for (const [id, edited] of edits) {
      const original = attached.find((im) => im.id === id);
      if (original && this.isParamModified(original, edited)) {
        ids.push(id);
      }
    }
    return ids;
  });

  private isParamModified(
    original: { visibility_rule: string; required_rule: string; editable_rule: string; default_value_rule?: string | null; duplicable?: { enabled: boolean; min_count?: number | null; max_count?: number | null } | null; constrained_values?: { enabled: boolean; min_value?: number | null; max_value?: number | null } | null },
    edited: IndicatorParams,
  ): boolean {
    return (
      original.visibility_rule !== edited.visibility_rule ||
      original.required_rule !== edited.required_rule ||
      original.editable_rule !== edited.editable_rule ||
      (original.default_value_rule ?? null) !== edited.default_value_rule ||
      JSON.stringify(original.duplicable ?? null) !== JSON.stringify(edited.duplicable) ||
      JSON.stringify(original.constrained_values ?? null) !== JSON.stringify(edited.constrained_values)
    );
  }

  getParamsForIndicator(indicatorId: string): IndicatorParams {
    const edited = this._paramEdits().get(indicatorId);
    if (edited) return edited;
    const attached = this.attachedIndicators().find((im) => im.id === indicatorId);
    if (!attached) {
      return { visibility_rule: 'true', required_rule: 'false', editable_rule: 'true', default_value_rule: null, duplicable: null, constrained_values: null };
    }
    return this.toIndicatorParams(attached);
  }

  private toIndicatorParams(im: {
    visibility_rule: string; required_rule: string; editable_rule: string;
    default_value_rule?: string | null;
    duplicable?: { enabled: boolean; min_count?: number | null; max_count?: number | null } | null;
    constrained_values?: { enabled: boolean; min_value?: number | null; max_value?: number | null } | null;
  }): IndicatorParams {
    return {
      visibility_rule: im.visibility_rule,
      required_rule: im.required_rule,
      editable_rule: im.editable_rule,
      default_value_rule: im.default_value_rule ?? null,
      duplicable: im.duplicable ? { enabled: im.duplicable.enabled, min_count: im.duplicable.min_count ?? null, max_count: im.duplicable.max_count ?? null } : null,
      constrained_values: im.constrained_values ? { enabled: im.constrained_values.enabled, min_value: im.constrained_values.min_value ?? null, max_value: im.constrained_values.max_value ?? null } : null,
    };
  }

  updateParams(indicatorId: string, params: IndicatorParams): void {
    const next = new Map(this._paramEdits());
    next.set(indicatorId, params);
    this._paramEdits.set(next);
  }

  discardParamEdits(): void {
    this._paramEdits.set(new Map());
  }

  async saveParamEdits(actionModelId: string): Promise<void> {
    const edits = this._paramEdits();
    for (const [, params] of edits) {
      for (const rule of [params.visibility_rule, params.required_rule, params.editable_rule]) {
        if (rule !== 'true' && rule !== 'false') {
          const trimmed = rule.trim();
          if (trimmed) {
            try {
              JSON.parse(trimmed);
            } catch {
              this.toast.error('Fix JSON errors before saving');
              return;
            }
          }
        }
      }
    }

    const attached = this.attachedIndicators();
    const associations: IndicatorModelAssociationInput[] = attached.map((im) => {
      const edited = edits.get(im.id);
      const params = edited ?? this.toIndicatorParams(im);
      return {
        indicator_model_id: im.id,
        visibility_rule: params.visibility_rule,
        required_rule: params.required_rule,
        editable_rule: params.editable_rule,
        default_value_rule: params.default_value_rule,
        duplicable: params.duplicable,
        constrained_values: params.constrained_values,
      };
    });
    const result = await this.domainStore.updateMutation({
      id: actionModelId,
      data: { indicator_model_associations: associations },
    });
    if (result.status === 'success') {
      this.toast.success('Parameters saved');
      this._paramEdits.set(new Map());
      this.domainStore.selectById(actionModelId);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  // Intention methods
  // TODO: [H3] load() only fetches the first page (default limit ~20). If there are >20 FPs/ATs,
  // dropdown options will be incomplete. Fix: add a loadAll() to withCursorPagination or use a
  // dedicated non-paginated endpoint for association selectors.
  loadAssociationData(): void {
    this.fpDomainStore.load(undefined);
    this.atDomainStore.load(undefined);
  }

  loadIndicators(): void {
    this.imDomainStore.load(undefined);
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

  async attachIndicator(actionModelId: string, indicatorModelId: string): Promise<void> {
    const current = this.attachedIndicators();
    if (current.some((im) => im.id === indicatorModelId)) {
      this.toast.error('Indicator is already attached');
      return;
    }
    const associations: IndicatorModelAssociationInput[] = [
      ...current.map((im) => ({
        indicator_model_id: im.id,
        visibility_rule: im.visibility_rule,
        required_rule: im.required_rule,
        editable_rule: im.editable_rule,
        default_value_rule: im.default_value_rule ?? null,
        duplicable: im.duplicable ?? null,
        constrained_values: im.constrained_values ?? null,
      })),
      {
        indicator_model_id: indicatorModelId,
        visibility_rule: 'true',
        required_rule: 'false',
        editable_rule: 'true',
        default_value_rule: null,
        duplicable: null,
        constrained_values: null,
      },
    ];
    const result = await this.domainStore.updateMutation({
      id: actionModelId,
      data: { indicator_model_associations: associations },
    });
    if (result.status === 'success') {
      this.toast.success('Indicator attached');
      this.domainStore.selectById(actionModelId);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async detachIndicator(actionModelId: string, indicatorModelId: string): Promise<void> {
    const current = this.attachedIndicators();
    const associations: IndicatorModelAssociationInput[] = current
      .filter((im) => im.id !== indicatorModelId)
      .map((im) => ({
        indicator_model_id: im.id,
        visibility_rule: im.visibility_rule,
        required_rule: im.required_rule,
        editable_rule: im.editable_rule,
        default_value_rule: im.default_value_rule ?? null,
        duplicable: im.duplicable ?? null,
        constrained_values: im.constrained_values ?? null,
      }));
    const result = await this.domainStore.updateMutation({
      id: actionModelId,
      data: { indicator_model_associations: associations },
    });
    if (result.status === 'success') {
      this.toast.success('Indicator detached');
      this.domainStore.selectById(actionModelId);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  reorderIndicators(actionModelId: string, reorderedIds: string[]): void {
    const current = this.attachedIndicators();
    const associations: IndicatorModelAssociationInput[] = reorderedIds
      .map((id) => current.find((im) => im.id === id))
      .filter(Boolean)
      .map((im) => ({
        indicator_model_id: im!.id,
        visibility_rule: im!.visibility_rule,
        required_rule: im!.required_rule,
        editable_rule: im!.editable_rule,
        default_value_rule: im!.default_value_rule ?? null,
        duplicable: im!.duplicable ?? null,
        constrained_values: im!.constrained_values ?? null,
      }));
    // Fire-and-forget for optimistic UI — component reorders locally, server confirms or reverts
    this.domainStore.updateMutation({
      id: actionModelId,
      data: { indicator_model_associations: associations },
    }).then((result) => {
      if (result.status === 'success') {
        this.domainStore.selectById(actionModelId);
      } else if (result.status === 'error') {
        this.handleMutationError(result.error);
        this.domainStore.selectById(actionModelId); // Revert to server state
      }
    });
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
