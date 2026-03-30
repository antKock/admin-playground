import { IndicatorCardData, IndicatorParams, ChildParamsChangeEvent } from '@app/shared/components/indicator-card/indicator-card.component';

/**
 * Minimal facade interface for section indicator param editing.
 * All three model facades (action, folder, entity) satisfy this.
 */
export interface SectionIndicatorParamFacade {
  getSectionIndicatorParams(sectionId: string, indicatorId: string): IndicatorParams;
  getSectionChildParams(sectionId: string, parentId: string, childId: string): IndicatorParams;
  updateSectionIndicatorParams(sectionId: string, indicatorId: string, params: IndicatorParams): void;
  updateSectionChildParams(sectionId: string, parentId: string, childId: string, params: IndicatorParams): void;
  isSectionIndicatorModified(sectionId: string, indicatorId: string): boolean;
  saveParamEdits(): Promise<void>;
  discardParamEdits(): void;
  unsavedCount: () => number;
}

export function getSectionIndicatorParams(facade: SectionIndicatorParamFacade, sectionId: string, indicatorId: string): IndicatorParams {
  return facade.getSectionIndicatorParams(sectionId, indicatorId);
}

export function getSectionChildParamsMap(facade: SectionIndicatorParamFacade, sectionId: string, card: IndicatorCardData): Record<string, IndicatorParams> {
  if (!card.children?.length) return {};
  const map: Record<string, IndicatorParams> = {};
  for (const child of card.children) {
    map[child.id] = facade.getSectionChildParams(sectionId, card.id, child.id);
  }
  return map;
}

export function onSectionIndicatorParamsChange(facade: SectionIndicatorParamFacade, sectionId: string, indicatorId: string, params: IndicatorParams): void {
  facade.updateSectionIndicatorParams(sectionId, indicatorId, params);
}

export function onSectionChildParamsChange(facade: SectionIndicatorParamFacade, sectionId: string, parentId: string, event: ChildParamsChangeEvent): void {
  facade.updateSectionChildParams(sectionId, parentId, event.childId, event.params);
}

export function handleParamSaveKeydown(facade: SectionIndicatorParamFacade, event: KeyboardEvent, saveFn: () => void): void {
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault();
    if (facade.unsavedCount() > 0) {
      saveFn();
    }
  }
}
