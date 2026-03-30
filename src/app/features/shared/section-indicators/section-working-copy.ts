import { computed, signal } from '@angular/core';

import { components } from '@app/core/api/generated/api-types';
import { SectionKey } from '@shared/components/section-card/section-card.models';
import { SectionParams } from '@shared/components/section-card/section-params-editor.component';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { DisplaySection, SECTION_RULE_DEFAULTS } from './display-section.model';


type AssociationEntityType = components['schemas']['AssociationEntityType'];
type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionChildIndicatorModelRead = components['schemas']['SectionChildIndicatorModelRead'];
type SectionIndicatorAssociationInput = components['schemas']['SectionIndicatorAssociationInput'];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Changeset {
  sectionsToCreate: {
    key: SectionKey;
    associationEntityType?: AssociationEntityType | null;
    params: SectionParams;
    indicators: SectionIndicatorAssociationInput[];
  }[];
  sectionsToDelete: string[];
  sectionsToUpdate: {
    sectionId: string;
    key: SectionKey;
    params: SectionParams;
  }[];
  indicatorUpdates: {
    sectionId: string;
    indicators: SectionIndicatorAssociationInput[];
  }[];
}

export interface SaveCallbacks {
  createSection(key: SectionKey, associationEntityType?: AssociationEntityType | null): Promise<{ id: string } | { error: string }>;
  deleteSection(sectionId: string): Promise<void | { error: string }>;
  updateSection(sectionId: string, key: SectionKey, params: SectionParams): Promise<void | { error: string }>;
  updateSectionIndicators(sectionId: string, indicators: SectionIndicatorAssociationInput[]): Promise<void | { error: string }>;
}

export interface SaveResult {
  success: boolean;
  validationError?: string;
  failedOperations?: { type: string; sectionKey: SectionKey; error: string }[];
}

// ─── Helper utilities ─────────────────────────────────────────────────────────

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Normalize null/undefined/'false' to 'false' for comparison purposes. */
function norm(value: string | null | undefined): string {
  return value ?? 'false';
}

function occurrenceRuleEqual(
  a: { min: string; max: string } | null | undefined,
  b: { min: string; max: string } | null | undefined,
): boolean {
  const aMin = norm(a?.min);
  const aMax = norm(a?.max);
  const bMin = norm(b?.min);
  const bMax = norm(b?.max);
  return aMin === bMin && aMax === bMax;
}

export function sectionParamsChanged(a: DisplaySection, b: DisplaySection): boolean {
  return (
    norm(a.hidden_rule) !== norm(b.hidden_rule) ||
    norm(a.required_rule) !== norm(b.required_rule) ||
    norm(a.disabled_rule) !== norm(b.disabled_rule) ||
    norm(a.constrained_rule) !== norm(b.constrained_rule) ||
    !occurrenceRuleEqual(a.occurrence_rule, b.occurrence_rule)
  );
}

export function indicatorsChanged(a: DisplaySection, b: DisplaySection): boolean {
  const aInds = a.indicators ?? [];
  const bInds = b.indicators ?? [];
  if (aInds.length !== bInds.length) return true;
  for (let i = 0; i < aInds.length; i++) {
    if (!indicatorEqual(aInds[i], bInds[i])) return true;
  }
  return false;
}

function indicatorEqual(a: SectionIndicatorModelRead, b: SectionIndicatorModelRead): boolean {
  if (a.id !== b.id) return false;
  if (a.position !== b.position) return false;
  if (
    norm(a.hidden_rule) !== norm(b.hidden_rule) ||
    norm(a.required_rule) !== norm(b.required_rule) ||
    norm(a.disabled_rule) !== norm(b.disabled_rule) ||
    norm(a.default_value_rule) !== norm(b.default_value_rule) ||
    norm(a.constrained_rule) !== norm(b.constrained_rule) ||
    !occurrenceRuleEqual(a.occurrence_rule, b.occurrence_rule)
  ) return false;
  // Check children
  const aCh = a.children ?? [];
  const bCh = b.children ?? [];
  if (aCh.length !== bCh.length) return false;
  for (let j = 0; j < aCh.length; j++) {
    if (!childIndicatorEqual(aCh[j], bCh[j])) return false;
  }
  return true;
}

function childIndicatorEqual(a: SectionChildIndicatorModelRead, b: SectionChildIndicatorModelRead): boolean {
  if (a.id !== b.id) return false;
  if (
    norm(a.hidden_rule) !== norm(b.hidden_rule) ||
    norm(a.required_rule) !== norm(b.required_rule) ||
    norm(a.disabled_rule) !== norm(b.disabled_rule) ||
    norm(a.default_value_rule) !== norm(b.default_value_rule) ||
    norm(a.constrained_rule) !== norm(b.constrained_rule) ||
    !occurrenceRuleEqual(a.occurrence_rule, b.occurrence_rule)
  ) return false;
  return true;
}

function extractSectionParams(s: DisplaySection): SectionParams {
  return {
    hidden_rule: s.hidden_rule,
    required_rule: s.required_rule,
    disabled_rule: s.disabled_rule,
    occurrence_rule: {
      min: s.occurrence_rule?.min ?? 'false',
      max: s.occurrence_rule?.max ?? 'false',
    },
    constrained_rule: s.constrained_rule,
  };
}

function ruleForApi(value: string | null | undefined): string {
  return value ?? 'false';
}

function buildIndicatorInputs(indicators: SectionIndicatorModelRead[]): SectionIndicatorAssociationInput[] {
  return indicators.map((ind, index) => ({
    indicator_model_id: ind.id,
    hidden_rule: ruleForApi(ind.hidden_rule),
    required_rule: ruleForApi(ind.required_rule),
    disabled_rule: ruleForApi(ind.disabled_rule),
    default_value_rule: ruleForApi(ind.default_value_rule),
    occurrence_rule: { min: ruleForApi(ind.occurrence_rule?.min), max: ruleForApi(ind.occurrence_rule?.max) },
    constrained_rule: ruleForApi(ind.constrained_rule),
    position: index,
  }));
}

function isChangesetEmpty(cs: Changeset): boolean {
  return cs.sectionsToCreate.length === 0 &&
    cs.sectionsToDelete.length === 0 &&
    cs.sectionsToUpdate.length === 0 &&
    cs.indicatorUpdates.length === 0;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createSectionWorkingCopy(sectionsFn: () => DisplaySection[]) {
  // _forked: when true, _working has diverged from source; when false, _working tracks source
  const _forked = signal(false);
  const _working = signal<DisplaySection[]>(structuredClone(sectionsFn()));

  // Original always reflects the current source (reactive)
  const originalSections = computed(() => sectionsFn());

  // Working sections: if not forked, track source; if forked, use local state
  const workingSections = computed(() => _forked() ? _working() : sectionsFn());

  const isDirty = computed(() => !deepEqual(workingSections(), originalSections()));

  const unsavedCount = computed(() => {
    const working = workingSections();
    const original = originalSections();

    let count = 0;

    // Added sections (stubs with indicators)
    count += working.filter((s) => s.id === null && (s.indicators?.length ?? 0) > 0 &&
      !original.some((o) => o.id === null && o.key === s.key && deepEqual(o, s))).length;

    // Deleted sections
    for (const o of original) {
      if (o.id !== null && !working.some((w) => w.id === o.id)) count++;
    }

    // Modified sections (matched by ID)
    for (const w of working) {
      if (w.id === null) continue;
      const o = original.find((s) => s.id === w.id);
      if (!o) continue;
      if (sectionParamsChanged(w, o)) count++;
      if (indicatorsChanged(w, o)) count++;
    }

    return count;
  });

  function reset(): void {
    _forked.set(false);
  }

  function refresh(): void {
    _forked.set(false);
  }

  // ─── Section mutations ────────────────────────────────────────────────

  function forkIfNeeded(): void {
    if (!_forked()) {
      _working.set(structuredClone(sectionsFn()));
      _forked.set(true);
    }
  }

  function addSection(key: SectionKey, associationEntityType?: AssociationEntityType): void {
    forkIfNeeded();
    _working.update((sections) => [
      ...sections,
      {
        id: null,
        name: key,
        key,
        association_entity_type: associationEntityType ?? null,
        is_enabled: true,
        position: sections.length,
        ...SECTION_RULE_DEFAULTS,
        created_at: '',
        last_updated_at: '',
        indicators: [],
      } as DisplaySection,
    ]);
  }

  function removeSection(sectionId: string): void {
    forkIfNeeded();
    _working.update((sections) => sections.filter((s) => s.id !== sectionId));
  }

  function updateSectionParams(sectionId: string | null, sectionKey: SectionKey, params: SectionParams): void {
    forkIfNeeded();
    _working.update((sections) =>
      sections.map((s) => {
        const match = sectionId != null ? s.id === sectionId : (s.id === null && s.key === sectionKey);
        if (!match) return s;
        return {
          ...s,
          hidden_rule: params.hidden_rule,
          required_rule: params.required_rule,
          disabled_rule: params.disabled_rule,
          occurrence_rule: params.occurrence_rule,
          constrained_rule: params.constrained_rule,
        };
      }),
    );
  }

  // ─── Indicator mutations ──────────────────────────────────────────────

  function addIndicator(
    sectionId: string | null,
    sectionKey: SectionKey,
    indicator: { id: string; name: string; technical_label: string; type: string },
  ): void {
    forkIfNeeded();
    _working.update((sections) =>
      sections.map((s) => {
        const match = sectionId != null ? s.id === sectionId : (s.id === null && s.key === sectionKey);
        if (!match) return s;
        const existing = s.indicators ?? [];
        return {
          ...s,
          indicators: [
            ...existing,
            {
              id: indicator.id,
              name: indicator.name,
              technical_label: indicator.technical_label,
              type: indicator.type,
              ...SECTION_RULE_DEFAULTS,
              default_value_rule: 'false',
              created_at: '',
              last_updated_at: '',
              position: existing.length,
              children: [],
            } as SectionIndicatorModelRead,
          ],
        };
      }),
    );
  }

  function removeIndicator(sectionId: string | null, sectionKey: SectionKey, indicatorId: string): void {
    forkIfNeeded();
    _working.update((sections) =>
      sections.map((s) => {
        const match = sectionId != null ? s.id === sectionId : (s.id === null && s.key === sectionKey);
        if (!match) return s;
        const indicators = (s.indicators ?? []).filter(
          (ind) => ind.id !== indicatorId,
        );
        return { ...s, indicators: reindex(indicators) };
      }),
    );
  }

  function reorderIndicators(sectionId: string | null, sectionKey: SectionKey, orderedIds: string[]): void {
    forkIfNeeded();
    _working.update((sections) =>
      sections.map((s) => {
        const match = sectionId != null ? s.id === sectionId : (s.id === null && s.key === sectionKey);
        if (!match) return s;
        const current = s.indicators ?? [];
        const reordered = orderedIds
          .map((id) => current.find((ind) => ind.id === id))
          .filter((ind): ind is SectionIndicatorModelRead => ind != null);
        return { ...s, indicators: reindex(reordered) };
      }),
    );
  }

  function updateIndicatorParams(
    sectionId: string | null,
    sectionKey: SectionKey,
    indicatorId: string,
    params: IndicatorParams,
  ): void {
    forkIfNeeded();
    _working.update((sections) =>
      sections.map((s) => {
        const match = sectionId != null ? s.id === sectionId : (s.id === null && s.key === sectionKey);
        if (!match) return s;
        return {
          ...s,
          indicators: (s.indicators ?? []).map((ind) =>
            ind.id === indicatorId ? applyIndicatorParams(ind, params) : ind,
          ),
        };
      }),
    );
  }

  function updateChildIndicatorParams(
    sectionId: string | null,
    sectionKey: SectionKey,
    parentId: string,
    childId: string,
    params: IndicatorParams,
  ): void {
    forkIfNeeded();
    _working.update((sections) =>
      sections.map((s) => {
        const match = sectionId != null ? s.id === sectionId : (s.id === null && s.key === sectionKey);
        if (!match) return s;
        return {
          ...s,
          indicators: (s.indicators ?? []).map((ind) => {
            if (ind.id !== parentId) return ind;
            return {
              ...ind,
              children: (ind.children ?? []).map((child) =>
                child.id === childId ? applyChildParams(child, params) : child,
              ),
            };
          }),
        };
      }),
    );
  }

  // ─── Rule validation ──────────────────────────────────────────────────

  function validateRules(): string | null {
    for (const section of workingSections()) {
      // Validate section-level rules
      const sectionRules = [section.hidden_rule, section.required_rule, section.disabled_rule, section.constrained_rule];
      if (section.occurrence_rule) {
        sectionRules.push(section.occurrence_rule.min, section.occurrence_rule.max);
      }
      const sectionError = validateRuleValues(sectionRules);
      if (sectionError) return sectionError;

      // Validate indicator-level rules
      for (const ind of section.indicators ?? []) {
        const indRules = [ind.hidden_rule, ind.required_rule, ind.disabled_rule, ind.default_value_rule, ind.constrained_rule];
        if (ind.occurrence_rule) {
          indRules.push(ind.occurrence_rule.min, ind.occurrence_rule.max);
        }
        const indError = validateRuleValues(indRules);
        if (indError) return indError;

        // Validate child indicator rules
        for (const child of ind.children ?? []) {
          const childRules = [child.hidden_rule, child.required_rule, child.disabled_rule, child.default_value_rule, child.constrained_rule];
          if (child.occurrence_rule) {
            childRules.push(child.occurrence_rule.min, child.occurrence_rule.max);
          }
          const childError = validateRuleValues(childRules);
          if (childError) return childError;
        }
      }
    }
    return null;
  }

  function validateRuleValues(rules: (string | null | undefined)[]): string | null {
    for (const rule of rules) {
      if (rule != null && rule !== 'true' && rule !== 'false') {
        const trimmed = rule.trim();
        if (trimmed) {
          try {
            JSON.parse(trimmed);
          } catch {
            return 'Corrigez les erreurs JSON avant d\'enregistrer';
          }
        }
      }
    }
    return null;
  }

  // ─── Changeset computation ────────────────────────────────────────────

  function computeChangeset(): Changeset {
    const working = workingSections();
    const original = originalSections();

    const sectionsToCreate: Changeset['sectionsToCreate'] = [];
    const sectionsToDelete: string[] = [];
    const sectionsToUpdate: Changeset['sectionsToUpdate'] = [];
    const indicatorUpdates: Changeset['indicatorUpdates'] = [];

    // Added sections: stubs (id === null) with indicators
    for (const w of working) {
      if (w.id !== null) continue;
      if ((w.indicators?.length ?? 0) === 0) continue;
      // Check if this stub existed in original with the same state (skip if unchanged)
      const origStub = original.find((o) => o.id === null && o.key === w.key);
      if (origStub && deepEqual(origStub, w)) continue;
      sectionsToCreate.push({
        key: w.key,
        associationEntityType: w.association_entity_type,
        params: extractSectionParams(w),
        indicators: buildIndicatorInputs(w.indicators ?? []),
      });
    }

    // Deleted sections: in original (by ID) but absent from working
    for (const o of original) {
      if (o.id === null) continue;
      if (!working.some((w) => w.id === o.id)) {
        sectionsToDelete.push(o.id);
      }
    }

    // Updated sections: matched by ID, check params and indicators
    for (const w of working) {
      if (w.id === null) continue;
      const o = original.find((s) => s.id === w.id);
      if (!o) continue;

      if (sectionParamsChanged(w, o)) {
        sectionsToUpdate.push({
          sectionId: w.id,
          key: w.key,
          params: extractSectionParams(w),
        });
      }

      if (indicatorsChanged(w, o)) {
        indicatorUpdates.push({
          sectionId: w.id,
          indicators: buildIndicatorInputs(w.indicators ?? []),
        });
      }
    }

    return { sectionsToCreate, sectionsToDelete, sectionsToUpdate, indicatorUpdates };
  }

  // ─── Save orchestration ───────────────────────────────────────────────

  async function save(callbacks: SaveCallbacks): Promise<SaveResult> {
    // Step 1: Validate rules
    const validationError = validateRules();
    if (validationError) {
      return { success: false, validationError };
    }

    // Step 2: Compute changeset
    const changeset = computeChangeset();
    if (isChangesetEmpty(changeset)) {
      return { success: true };
    }

    const failedOperations: SaveResult['failedOperations'] = [];

    // Map from stub key to created server ID
    const createdSectionIds = new Map<SectionKey, string>();

    // Step 3: Create new sections + delete removed sections (can run in parallel)
    const createPromises = changeset.sectionsToCreate.map(async (entry) => {
      const result = await callbacks.createSection(entry.key, entry.associationEntityType);
      if ('error' in result) {
        failedOperations!.push({ type: 'create', sectionKey: entry.key, error: result.error });
      } else {
        createdSectionIds.set(entry.key, result.id);
      }
    });

    const deletePromises = changeset.sectionsToDelete.map(async (sectionId) => {
      const original = originalSections().find((s) => s.id === sectionId);
      const result = await callbacks.deleteSection(sectionId);
      if (result && 'error' in result) {
        failedOperations!.push({ type: 'delete', sectionKey: (original?.key ?? 'unknown') as SectionKey, error: result.error });
      }
    });

    await Promise.all([...createPromises, ...deletePromises]);

    if (failedOperations!.length > 0) {
      return { success: false, failedOperations };
    }

    // Step 4: Update section params
    for (const entry of changeset.sectionsToUpdate) {
      const result = await callbacks.updateSection(entry.sectionId, entry.key, entry.params);
      if (result && 'error' in result) {
        failedOperations!.push({ type: 'update', sectionKey: entry.key, error: result.error });
      }
    }

    if (failedOperations!.length > 0) {
      return { success: false, failedOperations };
    }

    // Step 5: Update indicators (including for newly created sections)
    for (const entry of changeset.indicatorUpdates) {
      const result = await callbacks.updateSectionIndicators(entry.sectionId, entry.indicators);
      if (result && 'error' in result) {
        failedOperations!.push({ type: 'indicators', sectionKey: 'unknown' as SectionKey, error: result.error });
      }
    }

    // Also update indicators for newly created sections
    for (const entry of changeset.sectionsToCreate) {
      if (entry.indicators.length === 0) continue;
      const serverId = createdSectionIds.get(entry.key);
      if (!serverId) continue; // creation failed
      const result = await callbacks.updateSectionIndicators(serverId, entry.indicators);
      if (result && 'error' in result) {
        failedOperations!.push({ type: 'indicators', sectionKey: entry.key, error: result.error });
      }
    }

    if (failedOperations!.length > 0) {
      return { success: false, failedOperations };
    }

    return { success: true };
  }

  return {
    workingSections,
    originalSections,
    isDirty,
    unsavedCount,
    reset,
    refresh,
    // Section mutations
    addSection,
    removeSection,
    updateSectionParams,
    // Indicator mutations
    addIndicator,
    removeIndicator,
    reorderIndicators,
    updateIndicatorParams,
    updateChildIndicatorParams,
    // Validation & changeset
    validateRules,
    computeChangeset,
    save,
  };
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function reindex(indicators: SectionIndicatorModelRead[]): SectionIndicatorModelRead[] {
  return indicators.map((ind, i) => (ind.position === i ? ind : { ...ind, position: i }));
}

function applyIndicatorParams(ind: SectionIndicatorModelRead, params: IndicatorParams): SectionIndicatorModelRead {
  return {
    ...ind,
    hidden_rule: ruleForApi(params.hidden_rule),
    required_rule: ruleForApi(params.required_rule),
    disabled_rule: ruleForApi(params.disabled_rule),
    default_value_rule: ruleForApi(params.default_value_rule),
    occurrence_rule: params.occurrence_rule ? { min: params.occurrence_rule.min, max: params.occurrence_rule.max } : ind.occurrence_rule,
    constrained_rule: ruleForApi(params.constrained_rule),
  };
}

function applyChildParams(child: SectionChildIndicatorModelRead, params: IndicatorParams): SectionChildIndicatorModelRead {
  return {
    ...child,
    hidden_rule: ruleForApi(params.hidden_rule),
    required_rule: ruleForApi(params.required_rule),
    disabled_rule: ruleForApi(params.disabled_rule),
    default_value_rule: ruleForApi(params.default_value_rule),
    occurrence_rule: params.occurrence_rule ? { min: params.occurrence_rule.min, max: params.occurrence_rule.max } : child.occurrence_rule,
    constrained_rule: ruleForApi(params.constrained_rule),
  };
}
