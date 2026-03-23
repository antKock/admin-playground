import {
  IndicatorModelAssociationInput,
  IndicatorModelWithAssociation,
  ChildIndicatorModelAssociationInput,
} from '@domains/action-models/action-model.models';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';

// Backend currently expects string defaults — convert null to the backend's expected defaults.
// TODO: Remove after backend migrates to null defaults (backend-work-summary.md item 5).
function ruleForApi(value: string | null, backendDefault: string): string {
  return value ?? backendDefault;
}

function toIndicatorParams(im: {
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

function paramsToApi(p: IndicatorParams): Omit<IndicatorModelAssociationInput, 'indicator_model_id' | 'children_associations'> {
  return {
    hidden_rule: ruleForApi(p.hidden_rule, 'false'),
    required_rule: ruleForApi(p.required_rule, 'false'),
    disabled_rule: ruleForApi(p.disabled_rule, 'false'),
    default_value_rule: ruleForApi(p.default_value_rule, 'false'),
    duplicable_rule: ruleForApi(p.duplicable_rule, 'false'),
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
): IndicatorModelAssociationInput {
  const p = paramsOverride ?? paramEdits.get(im.id) ?? toIndicatorParams(im);
  const input: IndicatorModelAssociationInput = {
    indicator_model_id: im.id,
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
  return attached.map((im) => buildAssociationInput(im, paramEdits));
}
