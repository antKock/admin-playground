import { components } from '@app/core/api/generated/api-types';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { paramsToSectionRules } from './section-indicator-param-editor';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionChildIndicatorModelRead = components['schemas']['SectionChildIndicatorModelRead'];
type SectionIndicatorAssociationInput = components['schemas']['SectionIndicatorAssociationInput'];

function ruleForApi(value: string | null | undefined): string {
  return value ?? 'false';
}

function buildChildEntry(
  child: SectionChildIndicatorModelRead,
  parentId: string,
  position: number,
  paramEdits?: Map<string, IndicatorParams>,
): SectionIndicatorAssociationInput {
  const childKey = `${parentId}:${child.id}`;
  const edited = paramEdits?.get(childKey);
  if (edited) {
    return { indicator_model_id: child.id, ...paramsToSectionRules(edited), position };
  }
  return {
    indicator_model_id: child.id,
    hidden_rule: ruleForApi(child.hidden_rule),
    required_rule: ruleForApi(child.required_rule),
    disabled_rule: ruleForApi(child.disabled_rule),
    default_value_rule: ruleForApi(child.default_value_rule),
    occurrence_min_rule: ruleForApi(child.occurrence_min_rule),
    occurrence_max_rule: ruleForApi(child.occurrence_max_rule),
    constrained_rule: ruleForApi(child.constrained_rule),
    position,
  };
}

/**
 * Build API association inputs from section indicator data, optionally merging param edits.
 * Parents and children are flattened into a single array (children follow their parent).
 * @param indicators - Current section indicator models
 * @param paramEdits - Optional map of edited params keyed by "indicatorId" or "parentId:childId"
 */
export function buildSectionAssociationInputs(
  indicators: SectionIndicatorModelRead[],
  paramEdits?: Map<string, IndicatorParams>,
): SectionIndicatorAssociationInput[] {
  const result: SectionIndicatorAssociationInput[] = [];
  let position = 0;

  for (const ind of indicators) {
    const edited = paramEdits?.get(ind.id);
    if (edited) {
      result.push({ indicator_model_id: ind.id, ...paramsToSectionRules(edited), position: position++ });
    } else {
      result.push({
        indicator_model_id: ind.id,
        hidden_rule: ruleForApi(ind.hidden_rule),
        required_rule: ruleForApi(ind.required_rule),
        disabled_rule: ruleForApi(ind.disabled_rule),
        default_value_rule: ruleForApi(ind.default_value_rule),
        occurrence_min_rule: ruleForApi(ind.occurrence_min_rule),
        occurrence_max_rule: ruleForApi(ind.occurrence_max_rule),
        constrained_rule: ruleForApi(ind.constrained_rule),
        position: position++,
      });
    }

    // Include children as separate entries (children follow their parent)
    if (ind.children?.length) {
      for (const child of ind.children) {
        result.push(buildChildEntry(child, ind.id, position++, paramEdits));
      }
    }
  }

  return result;
}
