import { IndicatorCardData, ChildCardData } from '@app/shared/components/indicator-card/indicator-card.component';
import { ParamState, ParamHints } from '@app/shared/components/param-hint-icons/param-hint-icons.component';
import { components } from '@app/core/api/generated/api-types';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionChildIndicatorModelRead = components['schemas']['SectionChildIndicatorModelRead'];

function ruleState(value: string | null | undefined, defaultVal: string): ParamState {
  if (value == null || value === defaultVal) return 'off';
  if (value === 'true' || value === 'false') return 'on';
  return 'rule';
}

function buildParamHints(source: {
  hidden_rule: string;
  required_rule: string;
  disabled_rule: string;
  default_value_rule: string;
  constrained_rule: string;
}): ParamHints {
  return {
    visibility: ruleState(source.hidden_rule, 'false'),
    required: ruleState(source.required_rule, 'false'),
    editable: ruleState(source.disabled_rule, 'false'),
    defaultValue: ruleState(source.default_value_rule, 'false'),
    occurrence: 'off',
    constrained: ruleState(source.constrained_rule, 'false'),
  };
}

function mapChild(child: SectionChildIndicatorModelRead): ChildCardData {
  return {
    id: child.id,
    name: child.name,
    technical_label: child.technical_label,
    type: child.type,
    paramHints: buildParamHints(child),
  };
}

export function buildSectionIndicatorCards(indicators: SectionIndicatorModelRead[]): IndicatorCardData[] {
  return indicators.map((ind) => {
    const children = ind.children?.map(mapChild);
    return {
      id: ind.id,
      name: ind.name,
      technical_label: ind.technical_label,
      type: ind.type,
      paramHints: buildParamHints(ind),
      children: children?.length ? children : undefined,
    };
  });
}
