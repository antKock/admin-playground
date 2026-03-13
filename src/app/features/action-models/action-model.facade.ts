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
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { ActionModelFeatureStore } from './action-model.store';

// Backend currently expects string defaults — convert null to the backend's expected defaults.
// TODO: Remove after backend migrates to null defaults (backend-work-summary.md item 5).
function ruleForApi(value: string | null, backendDefault: string): string {
  return value ?? backendDefault;
}

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
  readonly totalCount = this.featureStore.totalCount;

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

  // --- Indicator parameter edit sub-system ---
  // Tracks unsaved changes to indicator params (rules, duplicable, constrained_values) before persisting.
  // _paramEdits is a Map<indicatorModelId, modified IndicatorParams>. UI edits accumulate here;
  // unsavedCount/modifiedIds derive which indicators have diverged from server state.
  // saveParamEdits() validates all JSON rules, then sends the full association list to the API.
  // discardParamEdits() clears the map without saving.
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
    original: { visibility_rule: string | null; required_rule: string | null; editable_rule: string | null; default_value_rule?: string | null; duplicable?: { enabled: boolean; min_count?: number | null; max_count?: number | null } | null; constrained_values?: { enabled: boolean; min_value?: number | null; max_value?: number | null } | null },
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
      return { visibility_rule: null, required_rule: null, editable_rule: null, default_value_rule: null, duplicable: null, constrained_values: null };
    }
    return this.toIndicatorParams(attached);
  }

  private toIndicatorParams(im: {
    visibility_rule: string | null; required_rule: string | null; editable_rule: string | null;
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
        if (rule != null && rule !== 'true' && rule !== 'false') {
          const trimmed = rule.trim();
          if (trimmed) {
            try {
              JSON.parse(trimmed);
            } catch {
              this.toast.error('Corrigez les erreurs JSON avant d\'enregistrer');
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
        visibility_rule: ruleForApi(params.visibility_rule, 'true'),
        required_rule: ruleForApi(params.required_rule, 'false'),
        editable_rule: ruleForApi(params.editable_rule, 'true'),
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
      this.toast.success('Paramètres enregistrés');
      this._paramEdits.set(new Map());
      this.domainStore.selectById(actionModelId);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  // Intention methods
  loadAssociationData(): void {
    this.fpDomainStore.loadAll(undefined);
    this.atDomainStore.loadAll(undefined);
  }

  loadIndicators(): void {
    this.imDomainStore.loadAll(undefined);
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
    this._paramEdits.set(new Map());
  }

  async create(data: ActionModelCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action créé');
      this.router.navigate(['/action-models']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: ActionModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action mis à jour');
      this.domainStore.refresh(undefined);
      this.router.navigate(['/action-models', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action supprimé');
      this.router.navigate(['/action-models']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async attachIndicator(actionModelId: string, indicatorModelId: string): Promise<void> {
    const current = this.attachedIndicators();
    if (current.some((im) => im.id === indicatorModelId)) {
      this.toast.error('L\'indicateur est déjà attaché');
      return;
    }
    const associations: IndicatorModelAssociationInput[] = [
      ...current.map((im) => ({
        indicator_model_id: im.id,
        visibility_rule: ruleForApi(im.visibility_rule, 'true'),
        required_rule: ruleForApi(im.required_rule, 'false'),
        editable_rule: ruleForApi(im.editable_rule, 'true'),
        default_value_rule: im.default_value_rule ?? null,
        duplicable: im.duplicable ?? null,
        constrained_values: im.constrained_values ?? null,
      })),
      {
        indicator_model_id: indicatorModelId,
        visibility_rule: ruleForApi(null, 'true'),
        required_rule: ruleForApi(null, 'false'),
        editable_rule: ruleForApi(null, 'true'),
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
      this.toast.success('Indicateur attaché');
      this.domainStore.selectById(actionModelId);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async detachIndicator(actionModelId: string, indicatorModelId: string): Promise<void> {
    const current = this.attachedIndicators();
    const associations: IndicatorModelAssociationInput[] = current
      .filter((im) => im.id !== indicatorModelId)
      .map((im) => ({
        indicator_model_id: im.id,
        visibility_rule: ruleForApi(im.visibility_rule, 'true'),
        required_rule: ruleForApi(im.required_rule, 'false'),
        editable_rule: ruleForApi(im.editable_rule, 'true'),
        default_value_rule: im.default_value_rule ?? null,
        duplicable: im.duplicable ?? null,
        constrained_values: im.constrained_values ?? null,
      }));
    const result = await this.domainStore.updateMutation({
      id: actionModelId,
      data: { indicator_model_associations: associations },
    });
    if (result.status === 'success') {
      this.toast.success('Indicateur retiré');
      this.domainStore.selectById(actionModelId);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  reorderIndicators(actionModelId: string, reorderedIds: string[]): void {
    const current = this.attachedIndicators();
    const associations: IndicatorModelAssociationInput[] = reorderedIds
      .map((id) => current.find((im) => im.id === id))
      .filter(Boolean)
      .map((im) => ({
        indicator_model_id: im!.id,
        visibility_rule: ruleForApi(im!.visibility_rule, 'true'),
        required_rule: ruleForApi(im!.required_rule, 'false'),
        editable_rule: ruleForApi(im!.editable_rule, 'true'),
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
        handleMutationError(this.toast, result.error);
        this.domainStore.selectById(actionModelId); // Revert to server state
      }
    });
  }
}
