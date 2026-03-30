import { IndicatorCardData, ChildCardData, IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { ParamState, ParamHints } from '@app/shared/components/param-hint-icons/param-hint-icons.component';
import { components } from '@app/core/api/generated/api-types';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionChildIndicatorModelRead = components['schemas']['SectionChildIndicatorModelRead'];

function ruleState(value: string | null | undefined, defaultVal: string): ParamState {
  if (value == null || value === defaultVal) return 'off';
  if (value === 'true' || value === 'false') return 'on';
  return 'rule';
}

function occurrenceState(min: string | null | undefined, max: string | null | undefined): ParamState {
  const minState = ruleState(min, 'false');
  const maxState = ruleState(max, 'false');
  if (minState === 'off' && maxState === 'off') return 'off';
  if (minState === 'rule' || maxState === 'rule') return 'rule';
  return 'on';
}

function buildParamHints(source: {
  hidden_rule: string;
  required_rule: string;
  disabled_rule: string;
  default_value_rule: string;
  constrained_rule: string;
  occurrence_rule?: { min: string; max: string };
}): ParamHints {
  return {
    visibility: ruleState(source.hidden_rule, 'false'),
    required: ruleState(source.required_rule, 'false'),
    editable: ruleState(source.disabled_rule, 'false'),
    defaultValue: ruleState(source.default_value_rule, 'false'),
    occurrence: occurrenceState(source.occurrence_rule?.min, source.occurrence_rule?.max),
    constrained: ruleState(source.constrained_rule, 'false'),
  };
}

function buildParamHintsFromEdited(params: IndicatorParams): ParamHints {
  return {
    visibility: ruleState(params.hidden_rule, 'false'),
    required: ruleState(params.required_rule, 'false'),
    editable: ruleState(params.disabled_rule, 'false'),
    defaultValue: ruleState(params.default_value_rule, 'false'),
    occurrence: occurrenceState(params.occurrence_rule?.min, params.occurrence_rule?.max),
    constrained: ruleState(params.constrained_rule, 'false'),
  };
}

function mapChild(child: SectionChildIndicatorModelRead, paramEdits?: Map<string, IndicatorParams>, parentId?: string): ChildCardData {
  const childKey = parentId ? `${parentId}:${child.id}` : undefined;
  const edited = childKey ? paramEdits?.get(childKey) : undefined;
  return {
    id: child.id,
    name: child.name,
    technical_label: child.technical_label,
    type: child.type,
    paramHints: edited ? buildParamHintsFromEdited(edited) : buildParamHints(child),
  };
}

/**
 * Build display-ready indicator cards from section indicator data.
 * @param indicators - Section indicator models from the API
 * @param paramEdits - Optional map of edited params keyed by "indicatorId" or "parentId:childId"
 */
export function buildSectionIndicatorCards(
  indicators: SectionIndicatorModelRead[],
  paramEdits?: Map<string, IndicatorParams>,
): IndicatorCardData[] {
  return indicators.map((ind) => {
    const edited = paramEdits?.get(ind.id);
    const children = ind.children?.map((child) => mapChild(child, paramEdits, ind.id));
    return {
      id: ind.id,
      name: ind.name,
      technical_label: ind.technical_label,
      type: ind.type,
      paramHints: edited ? buildParamHintsFromEdited(edited) : buildParamHints(ind),
      children: children?.length ? children : undefined,
    };
  });
}
