import {
  IndicatorModelAssociationInput,
  IndicatorModelWithAssociation,
  ChildIndicatorModelAssociationInput,
} from '@domains/action-models/action-model.models';
import { IndicatorParams, OccurrenceRule } from '@app/shared/components/indicator-card/indicator-card.component';

// Backend currently expects string defaults — convert null to the backend's expected defaults.
// TODO: Remove after backend migrates to null defaults (backend-work-summary.md item 5).
function ruleForApi(value: string | null, backendDefault: string): string {
  return value ?? backendDefault;
}

function toOccurrenceRule(im: { occurrence_rule?: { min: string; max: string } }): OccurrenceRule | null {
  return im.occurrence_rule ? { min: im.occurrence_rule.min, max: im.occurrence_rule.max } : null;
}

function toIndicatorParams(im: {
  hidden_rule: string; required_rule: string; disabled_rule: string;
  default_value_rule: string; occurrence_rule?: { min: string; max: string }; constrained_rule: string;
}): IndicatorParams {
  return {
    hidden_rule: im.hidden_rule,
    required_rule: im.required_rule,
    disabled_rule: im.disabled_rule,
    default_value_rule: im.default_value_rule,
    occurrence_rule: toOccurrenceRule(im),
    constrained_rule: im.constrained_rule,
  };
}

function occurrenceRuleForApi(occ: OccurrenceRule | null): { min: string; max: string } {
  return {
    min: ruleForApi(occ?.min ?? null, 'false'),
    max: ruleForApi(occ?.max ?? null, 'false'),
  };
}

function paramsToApi(p: IndicatorParams): Omit<IndicatorModelAssociationInput, 'indicator_model_id' | 'children_associations' | 'position'> {
  return {
    hidden_rule: ruleForApi(p.hidden_rule, 'false'),
    required_rule: ruleForApi(p.required_rule, 'false'),
    disabled_rule: ruleForApi(p.disabled_rule, 'false'),
    default_value_rule: ruleForApi(p.default_value_rule, 'false'),
    occurrence_rule: occurrenceRuleForApi(p.occurrence_rule),
    constrained_rule: ruleForApi(p.constrained_rule, 'false'),
  };
}

function childKey(parentId: string, childId: string): string {
  return `${parentId}:${childId}`;
}

/** Builds an API association input for a single attached indicator, preserving children associations. */
export function buildAssociationInput(
  im: IndicatorModelWithAssociation,
  paramEdits: Map<string, IndicatorParams>,
  paramsOverride?: IndicatorParams,
  position?: number,
): IndicatorModelAssociationInput {
  const p = paramsOverride ?? paramEdits.get(im.id) ?? toIndicatorParams(im);
  const input: IndicatorModelAssociationInput = {
    indicator_model_id: im.id,
    position: position ?? im.position ?? 0,
    ...paramsToApi(p),
  };
  if (im.children?.length) {
    input.children_associations = im.children.map((child): ChildIndicatorModelAssociationInput => {
      const childEdited = paramEdits.get(childKey(im.id, child.id));
      const cp = childEdited ?? toIndicatorParams(child);
      return {
        indicator_model_id: child.id,
        ...paramsToApi(cp),
      };
    });
  }
  return input;
}

/** Builds the full association input array from all attached indicators. */
export function buildAllAssociationInputs(
  attached: IndicatorModelWithAssociation[],
  paramEdits: Map<string, IndicatorParams>,
): IndicatorModelAssociationInput[] {
  return attached.map((im, index) => buildAssociationInput(im, paramEdits, undefined, index));
}
