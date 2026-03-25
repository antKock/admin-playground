import { IndicatorCardData, ChildCardData } from '@app/shared/components/indicator-card/indicator-card.component';
import { ParamState, ParamHints } from '@app/shared/components/param-hint-icons/param-hint-icons.component';
import { IndicatorModelWithAssociation, ChildIndicatorModelWithAssociation } from '@domains/action-models/action-model.models';
import { IndicatorModel } from '@domains/indicator-models/indicator-model.models';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';

export interface BuildIndicatorCardsInput {
  attached: IndicatorModelWithAssociation[];
  available: IndicatorModel[];
  paramEdits: Map<string, IndicatorParams>;
}

function ruleState(value: string | null, defaultVal: string): ParamState {
  if (value == null || value === defaultVal) return 'off';
  if (value === 'true' || value === 'false') return 'on';
  return 'rule';
}

function occurrenceState(occ: { min: string; max: string } | null | undefined): ParamState {
  if (!occ) return 'off';
  const minState = ruleState(occ.min, 'false');
  const maxState = ruleState(occ.max, 'false');
  if (minState === 'off' && maxState === 'off') return 'off';
  if (minState === 'rule' || maxState === 'rule') return 'rule';
  return 'on';
}

function buildParamHints(source: {
  hidden_rule: string; required_rule: string; disabled_rule: string;
  default_value_rule: string; occurrence_rule?: { min: string; max: string }; constrained_rule: string;
}): ParamHints {
  return {
    visibility: ruleState(source.hidden_rule, 'false'),
    required: ruleState(source.required_rule, 'false'),
    editable: ruleState(source.disabled_rule, 'false'),
    defaultValue: ruleState(source.default_value_rule, 'false'),
    occurrence: occurrenceState(source.occurrence_rule),
    constrained: ruleState(source.constrained_rule, 'false'),
  };
}

export function buildIndicatorCards(input: BuildIndicatorCardsInput): IndicatorCardData[] {
  const { attached, available, paramEdits } = input;
  const availableMap = new Map(available.map(a => [a.id, a]));

  return attached.map(im => {
    const edited = paramEdits.get(im.id);
    const p = edited ?? im;
    const full = availableMap.get(im.id);

    const children: ChildCardData[] | undefined = im.children?.map((child: ChildIndicatorModelWithAssociation) => {
      const childEdited = paramEdits.get(`${im.id}:${child.id}`);
      const cp = childEdited ?? child;
      return {
        id: child.id,
        name: child.name,
        technical_label: child.technical_label,
        type: child.type,
        paramHints: buildParamHints({
          hidden_rule: cp.hidden_rule ?? 'false',
          required_rule: cp.required_rule ?? 'false',
          disabled_rule: cp.disabled_rule ?? 'false',
          default_value_rule: cp.default_value_rule ?? 'false',
          occurrence_rule: cp.occurrence_rule ?? undefined,
          constrained_rule: cp.constrained_rule ?? 'false',
        }),
      };
    });

    return {
      id: im.id,
      name: im.name,
      technical_label: full?.technical_label,
      type: im.type,
      paramHints: buildParamHints({
        hidden_rule: p.hidden_rule ?? 'false',
        required_rule: p.required_rule ?? 'false',
        disabled_rule: p.disabled_rule ?? 'false',
        default_value_rule: p.default_value_rule ?? 'false',
        occurrence_rule: p.occurrence_rule ?? undefined,
        constrained_rule: p.constrained_rule ?? 'false',
      }),
      children: children?.length ? children : undefined,
    };
  });
}
