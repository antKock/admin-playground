// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ActionModelDomainStore } from '@domains/action-models/action-model.store';
import {
  ActionModelCreate, ActionModelUpdate, IndicatorModelAssociationInput,
  IndicatorModelWithAssociation, ChildIndicatorModelAssociationInput,
} from '@domains/action-models/action-model.models';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { ActionThemeDomainStore } from '@domains/action-themes/action-theme.store';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { buildIndicatorCards } from './use-cases/build-indicator-cards';
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

  // Per-mutation lifecycle status signals
  readonly publishIsPending = this.domainStore.publishMutationIsPending;
  readonly disableIsPending = this.domainStore.disableMutationIsPending;
  readonly activateIsPending = this.domainStore.activateMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending() ||
    this.publishIsPending() || this.disableIsPending() || this.activateIsPending(),
  );

  // --- Indicator parameter edit sub-system ---
  // Tracks unsaved changes to indicator params (rules) before persisting.
  // _paramEdits is a Map<key, modified IndicatorParams>. Keys are either an indicator ID
  // (for parent indicators) or "parentId:childId" (for child indicators within a group).
  // unsavedCount/modifiedIds derive which indicators have diverged from server state.
  // saveParamEdits() validates all JSON rules, then sends the full association list to the API.
  // discardParamEdits() clears the map without saving.
  private readonly _paramEdits = signal<Map<string, IndicatorParams>>(new Map());

  readonly paramEdits = this._paramEdits.asReadonly();

  // Display-ready indicator cards for detail component
  readonly indicatorCards = computed(() => buildIndicatorCards({
    attached: this.attachedIndicators(),
    available: this.availableIndicators(),
    paramEdits: this._paramEdits(),
  }));

  private static childKey(parentId: string, childId: string): string {
    return `${parentId}:${childId}`;
  }

  readonly unsavedCount = computed(() => {
    const edits = this._paramEdits();
    const attached = this.attachedIndicators();
    let count = 0;
    for (const [key, edited] of edits) {
      if (key.includes(':')) {
        const [parentId, childId] = key.split(':');
        const parent = attached.find((im) => im.id === parentId);
        const child = parent?.children?.find((c) => c.id === childId);
        if (child && this.isParamModified(child, edited)) count++;
      } else {
        const original = attached.find((im) => im.id === key);
        if (original && this.isParamModified(original, edited)) count++;
      }
    }
    return count;
  });

  readonly modifiedIds = computed(() => {
    const edits = this._paramEdits();
    const attached = this.attachedIndicators();
    const ids: string[] = [];
    for (const [key, edited] of edits) {
      if (key.includes(':')) {
        const [parentId, childId] = key.split(':');
        const parent = attached.find((im) => im.id === parentId);
        const child = parent?.children?.find((c) => c.id === childId);
        if (child && this.isParamModified(child, edited)) ids.push(key);
      } else {
        const original = attached.find((im) => im.id === key);
        if (original && this.isParamModified(original, edited)) ids.push(key);
      }
    }
    return ids;
  });

  private isParamModified(
    original: { hidden_rule: string; required_rule: string; disabled_rule: string; default_value_rule: string; duplicable_rule: string; constrained_rule: string },
    edited: IndicatorParams,
  ): boolean {
    return (
      original.hidden_rule !== (edited.hidden_rule ?? 'false') ||
      original.required_rule !== (edited.required_rule ?? 'false') ||
      original.disabled_rule !== (edited.disabled_rule ?? 'false') ||
      original.default_value_rule !== (edited.default_value_rule ?? 'false') ||
      original.duplicable_rule !== (edited.duplicable_rule ?? 'false') ||
      original.constrained_rule !== (edited.constrained_rule ?? 'false')
    );
  }

  getParamsForIndicator(indicatorId: string): IndicatorParams {
    const edited = this._paramEdits().get(indicatorId);
    if (edited) return edited;
    const attached = this.attachedIndicators().find((im) => im.id === indicatorId);
    if (!attached) {
      return { hidden_rule: null, required_rule: null, disabled_rule: null, default_value_rule: null, duplicable_rule: null, constrained_rule: null };
    }
    return this.toIndicatorParams(attached);
  }

  private toIndicatorParams(im: {
    hidden_rule: string; required_rule: string; disabled_rule: string;
    default_value_rule: string; duplicable_rule: string; constrained_rule: string;
  }): IndicatorParams {
    return {
      hidden_rule: im.hidden_rule,
      required_rule: im.required_rule,
      disabled_rule: im.disabled_rule,
      default_value_rule: im.default_value_rule,
      duplicable_rule: im.duplicable_rule,
      constrained_rule: im.constrained_rule,
    };
  }

  /** Builds an API association input for an attached indicator, preserving children associations. */
  private toAssociationInput(
    im: IndicatorModelWithAssociation,
    paramsOverride?: IndicatorParams,
  ): IndicatorModelAssociationInput {
    const p = paramsOverride ?? this.toIndicatorParams(im);
    const input: IndicatorModelAssociationInput = {
      indicator_model_id: im.id,
      hidden_rule: ruleForApi(p.hidden_rule, 'false'),
      required_rule: ruleForApi(p.required_rule, 'false'),
      disabled_rule: ruleForApi(p.disabled_rule, 'false'),
      default_value_rule: ruleForApi(p.default_value_rule, 'false'),
      duplicable_rule: ruleForApi(p.duplicable_rule, 'false'),
      constrained_rule: ruleForApi(p.constrained_rule, 'false'),
    };
    if (im.children?.length) {
      const edits = this._paramEdits();
      input.children_associations = im.children.map((child): ChildIndicatorModelAssociationInput => {
        const childEdited = edits.get(ActionModelFacade.childKey(im.id, child.id));
        const cp = childEdited ?? this.toIndicatorParams(child);
        return {
          indicator_model_id: child.id,
          hidden_rule: ruleForApi(cp.hidden_rule, 'false'),
          required_rule: ruleForApi(cp.required_rule, 'false'),
          disabled_rule: ruleForApi(cp.disabled_rule, 'false'),
          default_value_rule: ruleForApi(cp.default_value_rule, 'false'),
          duplicable_rule: ruleForApi(cp.duplicable_rule, 'false'),
          constrained_rule: ruleForApi(cp.constrained_rule, 'false'),
        };
      });
    }
    return input;
  }

  getParamsForChild(parentId: string, childId: string): IndicatorParams {
    const key = ActionModelFacade.childKey(parentId, childId);
    const edited = this._paramEdits().get(key);
    if (edited) return edited;
    const parent = this.attachedIndicators().find((im) => im.id === parentId);
    const child = parent?.children?.find((c) => c.id === childId);
    if (!child) {
      return { hidden_rule: null, required_rule: null, disabled_rule: null, default_value_rule: null, duplicable_rule: null, constrained_rule: null };
    }
    return this.toIndicatorParams(child);
  }

  updateParams(indicatorId: string, params: IndicatorParams): void {
    const next = new Map(this._paramEdits());
    next.set(indicatorId, params);
    this._paramEdits.set(next);
  }

  updateChildParams(parentId: string, childId: string, params: IndicatorParams): void {
    const next = new Map(this._paramEdits());
    next.set(ActionModelFacade.childKey(parentId, childId), params);
    this._paramEdits.set(next);
  }

  discardParamEdits(): void {
    this._paramEdits.set(new Map());
  }

  async saveParamEdits(actionModelId: string): Promise<void> {
    const edits = this._paramEdits();
    for (const [, params] of edits) {
      for (const rule of [params.hidden_rule, params.required_rule, params.disabled_rule, params.default_value_rule, params.duplicable_rule, params.constrained_rule]) {
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
      return this.toAssociationInput(im, edited ?? undefined);
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

  load(filters?: FilterParams): void {
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

  // Lifecycle / status mutations
  async publish(id: string): Promise<void> {
    const result = await this.domainStore.publishMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action publié');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de publier le modèle d\'action');
    }
  }

  async disable(id: string): Promise<void> {
    const result = await this.domainStore.disableMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action désactivé');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de désactiver le modèle d\'action');
    }
  }

  async activate(id: string): Promise<void> {
    const result = await this.domainStore.activateMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action activé');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible d\'activer le modèle d\'action');
    }
  }

  async attachIndicator(actionModelId: string, indicatorModelId: string): Promise<void> {
    const current = this.attachedIndicators();
    if (current.some((im) => im.id === indicatorModelId)) {
      this.toast.error('L\'indicateur est déjà attaché');
      return;
    }
    const associations: IndicatorModelAssociationInput[] = [
      ...current.map((im) => this.toAssociationInput(im)),
      {
        indicator_model_id: indicatorModelId,
        hidden_rule: 'false',
        required_rule: 'false',
        disabled_rule: 'false',
        default_value_rule: 'false',
        duplicable_rule: 'false',
        constrained_rule: 'false',
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
      .map((im) => this.toAssociationInput(im));
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
      .filter((im): im is IndicatorModelWithAssociation => !!im)
      .map((im) => this.toAssociationInput(im));
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
