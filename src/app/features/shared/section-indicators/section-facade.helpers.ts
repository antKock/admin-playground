/**
 * Shared helpers for section indicator operations across all model facades.
 *
 * Each facade provides a `SectionFacadeContext` that supplies model-specific
 * mutation functions and refresh callbacks. The helpers implement the shared
 * orchestration logic (validate, mutate, toast, refresh).
 */
import { components } from '@app/core/api/generated/api-types';
import { MutationResult } from '@angular-architects/ngrx-toolkit';
import { SectionKey, SECTION_TYPE_MAP } from '@shared/components/section-card/section-card.models';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { buildSectionAssociationInputs } from './build-section-association-inputs';
import { createSectionIndicatorParamEditor } from './section-indicator-param-editor';
import { SECTION_RULE_DEFAULTS } from './display-section.model';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionIndicatorAssociationInput = components['schemas']['SectionIndicatorAssociationInput'];
type SectionModelUpdate = components['schemas']['SectionModelUpdate'];

export interface SectionFacadeContext {
  toast: ToastService;
  getSelectedItem(): { sections?: { id: string; key: string; indicators?: SectionIndicatorModelRead[] }[] } | null;
  updateSectionIndicatorsMutation(sectionId: string, data: SectionIndicatorAssociationInput[]): Promise<MutationResult<unknown>>;
  createSectionMutation(data: { key: SectionKey; name: string; is_enabled: boolean; position: number;
    hidden_rule: string; disabled_rule: string; required_rule: string;
    occurrence_min_rule: string; occurrence_max_rule: string; constrained_rule: string;
  }): Promise<MutationResult<{ id: string }>>;
  updateSectionMutation(sectionId: string, data: SectionModelUpdate): Promise<MutationResult<unknown>>;
  refresh(): void;
}

export async function saveParamEdits(
  ctx: SectionFacadeContext,
  editor: ReturnType<typeof createSectionIndicatorParamEditor>,
): Promise<void> {
  const validationError = editor.validateRules();
  if (validationError) {
    ctx.toast.error(validationError);
    return;
  }

  const m = ctx.getSelectedItem();
  if (!m) return;

  const editedSectionIds = editor.editedSectionIds();
  if (editedSectionIds.size === 0) return;

  const sections = m.sections ?? [];
  let hasError = false;

  for (const sectionId of editedSectionIds) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) continue;

    const sectionEdits = editor.getEditsForSection(sectionId);
    const inputs = buildSectionAssociationInputs(section.indicators ?? [], sectionEdits);

    const result = await ctx.updateSectionIndicatorsMutation(sectionId, inputs);
    if (result.status === 'error') {
      handleMutationError(ctx.toast, result.error);
      hasError = true;
      break;
    }
  }

  if (!hasError) {
    ctx.toast.success('Paramètres enregistrés');
    editor.discard();
    ctx.refresh();
  }
}

export async function reorderSectionIndicators(
  ctx: SectionFacadeContext,
  editor: ReturnType<typeof createSectionIndicatorParamEditor>,
  sectionId: string,
  orderedIds: string[],
): Promise<void> {
  const m = ctx.getSelectedItem();
  if (!m) return;

  const section = (m.sections ?? []).find((s) => s.id === sectionId);
  if (!section) return;

  const indicators = section.indicators ?? [];
  const reordered = orderedIds
    .map((id) => indicators.find((ind) => ind.id === id))
    .filter((ind): ind is NonNullable<typeof ind> => !!ind);

  const sectionEdits = editor.getEditsForSection(sectionId);
  const inputs = buildSectionAssociationInputs(reordered, sectionEdits);

  const result = await ctx.updateSectionIndicatorsMutation(sectionId, inputs);
  if (result.status === 'success') {
    ctx.refresh();
  } else if (result.status === 'error') {
    handleMutationError(ctx.toast, result.error);
    ctx.refresh();
  }
}

export async function addIndicatorToSection(
  ctx: SectionFacadeContext,
  sectionId: string | null,
  sectionKey: SectionKey,
  indicatorModelId: string,
): Promise<void> {
  const m = ctx.getSelectedItem();
  if (!m) return;

  let resolvedId = sectionId;
  if (!resolvedId) {
    resolvedId = await ensureSectionExists(ctx, sectionKey);
    if (!resolvedId) return;
  }

  const section = (m.sections ?? []).find((s) => s.id === resolvedId);
  const existing = section?.indicators ?? [];
  const inputs: SectionIndicatorAssociationInput[] = [
    ...buildSectionAssociationInputs(existing),
    {
      indicator_model_id: indicatorModelId,
      ...SECTION_RULE_DEFAULTS,
      default_value_rule: 'false',
      position: existing.length,
    },
  ];

  const result = await ctx.updateSectionIndicatorsMutation(resolvedId, inputs);
  if (result.status === 'success') {
    ctx.toast.success('Indicateur ajouté à la section');
    ctx.refresh();
  } else if (result.status === 'error') {
    handleMutationError(ctx.toast, result.error, 'Impossible d\'ajouter l\'indicateur');
  }
}

export async function removeIndicatorFromSection(
  ctx: SectionFacadeContext,
  sectionId: string,
  indicatorModelId: string,
): Promise<void> {
  const m = ctx.getSelectedItem();
  if (!m) return;

  const section = (m.sections ?? []).find((s) => s.id === sectionId);
  if (!section) return;

  const remaining = (section.indicators ?? []).filter((ind) => ind.id !== indicatorModelId);
  const inputs = buildSectionAssociationInputs(remaining);

  const result = await ctx.updateSectionIndicatorsMutation(sectionId, inputs);
  if (result.status === 'success') {
    ctx.toast.success('Indicateur retiré de la section');
    ctx.refresh();
  } else if (result.status === 'error') {
    handleMutationError(ctx.toast, result.error, 'Impossible de retirer l\'indicateur');
  }
}

export async function ensureSectionExists(
  ctx: SectionFacadeContext,
  sectionKey: SectionKey,
): Promise<string | null> {
  const m = ctx.getSelectedItem();
  if (!m) return null;

  const existing = (m.sections ?? []).find((s) => s.key === sectionKey);
  if (existing) return existing.id;

  const config = SECTION_TYPE_MAP[sectionKey];
  const result = await ctx.createSectionMutation({
    key: sectionKey,
    name: config.label,
    is_enabled: true,
    position: 0,
    ...SECTION_RULE_DEFAULTS,
  });

  if (result.status === 'success') {
    return result.value.id;
  } else if (result.status === 'error') {
    handleMutationError(ctx.toast, result.error, 'Impossible de créer la section');
    return null;
  }
  return null;
}

export async function updateSectionParams(
  ctx: SectionFacadeContext,
  sectionId: string | null,
  sectionKey: SectionKey,
  params: SectionModelUpdate,
): Promise<void> {
  const m = ctx.getSelectedItem();
  if (!m) return;

  let resolvedId = sectionId;
  if (!resolvedId) {
    resolvedId = await ensureSectionExists(ctx, sectionKey);
    if (!resolvedId) return;
  }

  const result = await ctx.updateSectionMutation(resolvedId, params);
  if (result.status === 'success') {
    ctx.toast.success('Paramètres de section enregistrés');
    ctx.refresh();
  } else if (result.status === 'error') {
    handleMutationError(ctx.toast, result.error, 'Impossible de mettre à jour la section');
  }
}

/**
 * Creates a set of facade methods backed by shared section helpers.
 * Each facade calls this once with a model-specific context, then
 * delegates its section methods to the returned object.
 */
export function createSectionFacadeHelpers(
  ctx: SectionFacadeContext,
  sectionsFn: () => { id: string; key: string; indicators?: SectionIndicatorModelRead[] }[],
) {
  const editor = createSectionIndicatorParamEditor(sectionsFn);

  return {
    editor,
    sectionParamEdits: editor.edits,
    unsavedCount: editor.unsavedCount,
    modifiedIds: editor.modifiedIds,

    getSectionIndicatorParams(sectionId: string, indicatorId: string): IndicatorParams {
      return editor.getParamsForIndicator(sectionId, indicatorId);
    },
    getSectionChildParams(sectionId: string, parentId: string, childId: string): IndicatorParams {
      return editor.getParamsForChild(sectionId, parentId, childId);
    },
    updateSectionIndicatorParams(sectionId: string, indicatorId: string, params: IndicatorParams): void {
      editor.updateParams(sectionId, indicatorId, params);
    },
    updateSectionChildParams(sectionId: string, parentId: string, childId: string, params: IndicatorParams): void {
      editor.updateChildParams(sectionId, parentId, childId, params);
    },
    getEditsForSection(sectionId: string): Map<string, IndicatorParams> {
      return editor.getEditsForSection(sectionId);
    },
    isSectionIndicatorModified(sectionId: string, indicatorId: string): boolean {
      return editor.isModified(sectionId, indicatorId);
    },
    discardParamEdits(): void {
      editor.discard();
    },
    saveParamEdits(): Promise<void> {
      return saveParamEdits(ctx, editor);
    },
    reorderSectionIndicators(sectionId: string, orderedIds: string[]): Promise<void> {
      return reorderSectionIndicators(ctx, editor, sectionId, orderedIds);
    },
    addIndicatorToSection(sectionId: string | null, sectionKey: SectionKey, indicatorModelId: string): Promise<void> {
      return addIndicatorToSection(ctx, sectionId, sectionKey, indicatorModelId);
    },
    removeIndicatorFromSection(sectionId: string, indicatorModelId: string): Promise<void> {
      return removeIndicatorFromSection(ctx, sectionId, indicatorModelId);
    },
    ensureSectionExists(sectionKey: SectionKey): Promise<string | null> {
      return ensureSectionExists(ctx, sectionKey);
    },
    updateSectionParams(sectionId: string | null, sectionKey: SectionKey, params: SectionModelUpdate): Promise<void> {
      return updateSectionParams(ctx, sectionId, sectionKey, params);
    },
  };
}
