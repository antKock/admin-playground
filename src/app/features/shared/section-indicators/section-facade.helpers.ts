/**
 * Shared helpers for section indicator operations across all model facades.
 *
 * Delegates all section/indicator mutations to a SectionWorkingCopy instance.
 * The facade provides model-specific API callbacks via SaveCallbacks.
 * All changes are local until save() is called.
 */
import { components } from '@app/core/api/generated/api-types';
import { SectionKey } from '@shared/components/section-card/section-card.models';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { SectionParams } from '@shared/components/section-card/section-params-editor.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { createSectionWorkingCopy, occurrenceRuleEqual, SaveCallbacks } from './section-working-copy';
import { DisplaySection } from './display-section.model';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionChildIndicatorModelRead = components['schemas']['SectionChildIndicatorModelRead'];

function sectionIndicatorToParams(ind: SectionIndicatorModelRead | SectionChildIndicatorModelRead): IndicatorParams {
  const occ = ind.occurrence_rule;
  return {
    hidden_rule: ind.hidden_rule,
    required_rule: ind.required_rule,
    disabled_rule: ind.disabled_rule,
    default_value_rule: ind.default_value_rule,
    occurrence_rule: occ && (occ.min !== 'false' || occ.max !== 'false') ? occ : null,
    constrained_rule: ind.constrained_rule,
  };
}

export interface SectionFacadeContext {
  toast: ToastService;
  getSections: () => DisplaySection[];
  buildSaveCallbacks: () => SaveCallbacks;
  refresh: () => void;
}

function isParamModified(original: IndicatorParams, current: IndicatorParams): boolean {
  return (
    (original.hidden_rule ?? 'false') !== (current.hidden_rule ?? 'false') ||
    (original.required_rule ?? 'false') !== (current.required_rule ?? 'false') ||
    (original.disabled_rule ?? 'false') !== (current.disabled_rule ?? 'false') ||
    (original.default_value_rule ?? 'false') !== (current.default_value_rule ?? 'false') ||
    !occurrenceRuleEqual(current.occurrence_rule, original.occurrence_rule) ||
    (original.constrained_rule ?? 'false') !== (current.constrained_rule ?? 'false')
  );
}

/**
 * Creates a set of facade methods backed by a SectionWorkingCopy.
 * Each facade calls this once with a model-specific context, then
 * delegates its section methods to the returned object.
 */
export function createSectionFacadeHelpers(ctx: SectionFacadeContext) {
  const wc = createSectionWorkingCopy(ctx.getSections);

  const isDirty = wc.isDirty;
  const unsavedCount = wc.unsavedCount;
  const workingSections = wc.workingSections;

  // ─── Indicator param access ─────────────────────────────────────────

  function getSectionIndicatorParams(sectionId: string, indicatorId: string): IndicatorParams {
    const section = wc.workingSections().find((s) => s.id === sectionId);
    const ind = section?.indicators?.find((i) => i.id === indicatorId);
    if (ind) return sectionIndicatorToParams(ind);
    return { hidden_rule: null, required_rule: null, disabled_rule: null, default_value_rule: null, occurrence_rule: null, constrained_rule: null };
  }

  function getSectionChildParams(sectionId: string, parentId: string, childId: string): IndicatorParams {
    const section = wc.workingSections().find((s) => s.id === sectionId);
    const parent = section?.indicators?.find((i) => i.id === parentId);
    const child = parent?.children?.find((c) => c.id === childId);
    if (child) return sectionIndicatorToParams(child);
    return { hidden_rule: null, required_rule: null, disabled_rule: null, default_value_rule: null, occurrence_rule: null, constrained_rule: null };
  }

  function updateSectionIndicatorParams(sectionId: string, indicatorId: string, params: IndicatorParams): void {
    const section = wc.workingSections().find((s) => s.id === sectionId);
    if (section) {
      wc.updateIndicatorParams(sectionId, section.key, indicatorId, params);
    }
  }

  function updateSectionChildParams(sectionId: string, parentId: string, childId: string, params: IndicatorParams): void {
    const section = wc.workingSections().find((s) => s.id === sectionId);
    if (section) {
      wc.updateChildIndicatorParams(sectionId, section.key, parentId, childId, params);
    }
  }

  function isSectionIndicatorModified(sectionId: string, indicatorId: string): boolean {
    const ws = wc.workingSections().find((s) => s.id === sectionId);
    const os = wc.originalSections().find((s) => s.id === sectionId);
    if (!ws || !os) return false;
    const wi = ws.indicators?.find((i) => i.id === indicatorId);
    const oi = os.indicators?.find((i) => i.id === indicatorId);
    if (!wi || !oi) return !!wi !== !!oi; // one exists but not the other
    return isParamModified(sectionIndicatorToParams(oi), sectionIndicatorToParams(wi));
  }

  // ─── Section operations ─────────────────────────────────────────────

  function addSection(key: SectionKey, associationEntityType?: string): void {
    wc.addSection(key, associationEntityType as Parameters<typeof wc.addSection>[1]);
  }

  function removeSection(sectionId: string): void {
    wc.removeSection(sectionId);
  }

  function updateSectionParamsMethod(sectionId: string | null, sectionKey: SectionKey, params: SectionParams): void {
    wc.updateSectionParams(sectionId, sectionKey, params);
  }

  function addIndicatorToSection(sectionId: string | null, sectionKey: SectionKey, indicator: { id: string; name: string; technical_label: string; type: string }): void {
    wc.addIndicator(sectionId, sectionKey, indicator);
  }

  function removeIndicatorFromSection(sectionId: string | null, sectionKey: SectionKey, indicatorModelId: string): void {
    wc.removeIndicator(sectionId, sectionKey, indicatorModelId);
  }

  function reorderSectionIndicators(sectionId: string | null, sectionKey: SectionKey, orderedIds: string[]): void {
    wc.reorderIndicators(sectionId, sectionKey, orderedIds);
  }

  // ─── Save / Discard ─────────────────────────────────────────────────

  async function save(): Promise<void> {
    const result = await wc.save(ctx.buildSaveCallbacks());
    if (result.validationError) {
      ctx.toast.error(result.validationError);
      return;
    }
    if (result.success) {
      ctx.toast.success('Configuration enregistrée');
      ctx.refresh();
      // After refresh, reset working copy — it will auto-sync from sectionsFn()
      setTimeout(() => wc.refresh(), 0);
    } else if (result.failedOperations?.length) {
      const first = result.failedOperations[0];
      ctx.toast.error(`Erreur lors de la sauvegarde de la section ${first.sectionKey}`);
    }
  }

  function discard(): void {
    wc.reset();
  }

  return {
    isDirty,
    workingSections,
    unsavedCount,

    // Working copy instance (for advanced usage)
    workingCopy: wc,

    getSectionIndicatorParams,
    getSectionChildParams,
    updateSectionIndicatorParams,
    updateSectionChildParams,
    isSectionIndicatorModified,

    saveParamEdits: save,
    discardParamEdits: discard,

    // Section operations (all local-only until saveParamEdits)
    reorderSectionIndicators,
    addIndicatorToSection,
    removeIndicatorFromSection,
    addSection,
    removeSection,
    updateSectionParams: updateSectionParamsMethod,
  };
}
