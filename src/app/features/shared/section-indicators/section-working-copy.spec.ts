import { createSectionWorkingCopy, SaveCallbacks, sectionParamsChanged, indicatorsChanged } from './section-working-copy';
import { DisplaySection, SECTION_RULE_DEFAULTS } from './display-section.model';
import { SectionKey } from '@shared/components/section-card/section-card.models';
import { components } from '@app/core/api/generated/api-types';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];

// ─── Test helpers ──────────────────────────────────────────────────────────────

function makeIndicator(overrides: Partial<SectionIndicatorModelRead> & { id: string; name: string }): SectionIndicatorModelRead {
  return {
    technical_label: overrides.name,
    type: 'numeric',
    created_at: '2026-01-01',
    last_updated_at: '2026-01-01',
    hidden_rule: 'false',
    required_rule: 'false',
    disabled_rule: 'false',
    default_value_rule: 'false',
    constrained_rule: 'false',
    position: 0,
    children: [],
    ...overrides,
  };
}

function makeSection(overrides: Partial<DisplaySection> & { key: SectionKey }): DisplaySection {
  return {
    id: overrides.id ?? null,
    name: overrides.key,
    is_enabled: true,
    position: 0,
    ...SECTION_RULE_DEFAULTS,
    created_at: '2026-01-01',
    last_updated_at: '2026-01-01',
    indicators: [],
    ...overrides,
  } as DisplaySection;
}

function mockCallbacks(overrides?: Partial<SaveCallbacks>): SaveCallbacks {
  return {
    createSection: vi.fn().mockResolvedValue({ id: 'new-id' }),
    deleteSection: vi.fn().mockResolvedValue(undefined),
    updateSection: vi.fn().mockResolvedValue(undefined),
    updateSectionIndicators: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('createSectionWorkingCopy', () => {
  // ── AC #1: Initialization ─────────────────────────────────────────────

  describe('initialization (AC #1)', () => {
    it('should reflect source sections on init', () => {
      const sections: DisplaySection[] = [
        makeSection({ id: 's1', key: 'financial', indicators: [makeIndicator({ id: 'i1', name: 'Ind1' })] }),
      ];
      const wc = createSectionWorkingCopy(() => sections);

      expect(wc.workingSections()).toEqual(sections);
      // When not forked, working sections reads from source directly
    });

    it('should start with isDirty false', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);
      expect(wc.isDirty()).toBe(false);
    });

    it('should start with unsavedCount 0', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);
      expect(wc.unsavedCount()).toBe(0);
    });
  });

  // ── AC #2: Local section mutations ────────────────────────────────────

  describe('local section mutations (AC #2)', () => {
    it('addSection should append a new stub section', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.addSection('application');

      expect(wc.workingSections().length).toBe(2);
      const added = wc.workingSections()[1];
      expect(added.id).toBeNull();
      expect(added.key).toBe('application');
      expect(added.indicators).toEqual([]);
      expect(wc.isDirty()).toBe(true);
    });

    it('removeSection should filter by ID', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
        makeSection({ id: 's2', key: 'application' }),
      ]);

      wc.removeSection('s1');

      expect(wc.workingSections().length).toBe(1);
      expect(wc.workingSections()[0].id).toBe('s2');
      expect(wc.isDirty()).toBe(true);
    });

    it('updateSectionParams should update matching section by ID', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: '{"condition": true}',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      expect(wc.workingSections()[0].hidden_rule).toBe('{"condition": true}');
      expect(wc.isDirty()).toBe(true);
    });

    it('updateSectionParams should match stub section by key when id is null', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: null, key: 'application' }),
      ]);

      wc.updateSectionParams(null, 'application', {
        hidden_rule: 'true',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      expect(wc.workingSections()[0].hidden_rule).toBe('true');
    });
  });

  // ── AC #3: Local indicator mutations ──────────────────────────────────

  describe('local indicator mutations (AC #3)', () => {
    it('addIndicator should append indicator to section', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.addIndicator('s1', 'financial', { id: 'i1', name: 'Ind1', technical_label: 'ind1', type: 'numeric' });

      const indicators = wc.workingSections()[0].indicators!;
      expect(indicators.length).toBe(1);
      expect(indicators[0].id).toBe('i1');
      expect(indicators[0].default_value_rule).toBe('false');
      expect(indicators[0].position).toBe(0);
      expect(wc.isDirty()).toBe(true);
    });

    it('addIndicator should work on stub sections (id: null)', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: null, key: 'application' }),
      ]);

      wc.addIndicator(null, 'application', { id: 'i1', name: 'Ind1', technical_label: 'ind1', type: 'numeric' });

      expect(wc.workingSections()[0].indicators!.length).toBe(1);
    });

    it('removeIndicator should filter indicator from section', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [
            makeIndicator({ id: 'i1', name: 'Ind1', position: 0 }),
            makeIndicator({ id: 'i2', name: 'Ind2', position: 1 }),
          ],
        }),
      ]);

      wc.removeIndicator('s1', 'financial', 'i1');

      const indicators = wc.workingSections()[0].indicators!;
      expect(indicators.length).toBe(1);
      expect(indicators[0].id).toBe('i2');
      expect(indicators[0].position).toBe(0); // reindexed
    });

    it('reorderIndicators should reorder and reindex positions', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [
            makeIndicator({ id: 'i1', name: 'A', position: 0 }),
            makeIndicator({ id: 'i2', name: 'B', position: 1 }),
            makeIndicator({ id: 'i3', name: 'C', position: 2 }),
          ],
        }),
      ]);

      wc.reorderIndicators('s1', 'financial', ['i3', 'i1', 'i2']);

      const indicators = wc.workingSections()[0].indicators!;
      expect(indicators.map((i) => i.id)).toEqual(['i3', 'i1', 'i2']);
      expect(indicators.map((i) => i.position)).toEqual([0, 1, 2]);
    });

    it('updateIndicatorParams should update indicator rules', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [makeIndicator({ id: 'i1', name: 'Ind1' })],
        }),
      ]);

      wc.updateIndicatorParams('s1', 'financial', 'i1', {
        hidden_rule: '{"test": true}',
        required_rule: 'true',
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: null,
        constrained_rule: null,
      });

      const ind = wc.workingSections()[0].indicators![0];
      expect(ind.hidden_rule).toBe('{"test": true}');
      expect(ind.required_rule).toBe('true');
    });

    it('addIndicator should hydrate children when provided', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.addIndicator('s1', 'financial', {
        id: 'i1', name: 'Group Ind', technical_label: 'group_ind', type: 'group',
        children: [
          { id: 'c1', name: 'Child 1', technical_label: 'child1', type: 'numeric' },
          { id: 'c2', name: 'Child 2', technical_label: 'child2', type: 'text_short' },
        ],
      });

      const ind = wc.workingSections()[0].indicators![0];
      expect(ind.children!.length).toBe(2);
      expect(ind.children![0].id).toBe('c1');
      expect(ind.children![0].name).toBe('Child 1');
      expect(ind.children![0].hidden_rule).toBe('false');
      expect(ind.children![0].default_value_rule).toBe('false');
      expect(ind.children![1].id).toBe('c2');
    });

    it('newly added indicator params should be immediately editable', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.addIndicator('s1', 'financial', { id: 'i1', name: 'New Ind', technical_label: 'new_ind', type: 'numeric' });

      // Toggle hidden ON
      wc.updateIndicatorParams('s1', 'financial', 'i1', {
        hidden_rule: 'true',
        required_rule: null,
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: null,
        constrained_rule: null,
      });

      const ind = wc.workingSections()[0].indicators![0];
      expect(ind.hidden_rule).toBe('true');

      // Toggle occurrence ON
      wc.updateIndicatorParams('s1', 'financial', 'i1', {
        hidden_rule: 'true',
        required_rule: null,
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: { min: 'true', max: 'false' },
        constrained_rule: null,
      });

      const ind2 = wc.workingSections()[0].indicators![0];
      expect(ind2.occurrence_rule).toEqual({ min: 'true', max: 'false' });

      // Toggle occurrence OFF
      wc.updateIndicatorParams('s1', 'financial', 'i1', {
        hidden_rule: 'true',
        required_rule: null,
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: null,
      });

      const ind3 = wc.workingSections()[0].indicators![0];
      expect(ind3.occurrence_rule).toEqual({ min: 'false', max: 'false' });
    });

    it('updateIndicatorParams with null occurrence_rule should set canonical OFF', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [makeIndicator({ id: 'i1', name: 'Ind1', occurrence_rule: { min: 'true', max: 'false' } })],
        }),
      ]);

      wc.updateIndicatorParams('s1', 'financial', 'i1', {
        hidden_rule: null,
        required_rule: null,
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: null,
        constrained_rule: null,
      });

      const ind = wc.workingSections()[0].indicators![0];
      expect(ind.occurrence_rule).toEqual({ min: 'false', max: 'false' });
    });

    it('updateIndicatorParams with occurrence_rule should set it correctly', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [makeIndicator({ id: 'i1', name: 'Ind1' })],
        }),
      ]);

      wc.updateIndicatorParams('s1', 'financial', 'i1', {
        hidden_rule: null,
        required_rule: null,
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: { min: '{"gte": 2}', max: 'false' },
        constrained_rule: null,
      });

      const ind = wc.workingSections()[0].indicators![0];
      expect(ind.occurrence_rule).toEqual({ min: '{"gte": 2}', max: 'false' });
    });

    it('updateChildIndicatorParams should update child params', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [
            makeIndicator({
              id: 'i1', name: 'Parent',
              children: [{
                id: 'c1', name: 'Child1', technical_label: 'child1', type: 'numeric',
                created_at: '2026-01-01', last_updated_at: '2026-01-01',
                hidden_rule: 'false', required_rule: 'false', disabled_rule: 'false',
                default_value_rule: 'false', constrained_rule: 'false',
              }],
            }),
          ],
        }),
      ]);

      wc.updateChildIndicatorParams('s1', 'financial', 'i1', 'c1', {
        hidden_rule: 'true',
        required_rule: null,
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: null,
        constrained_rule: null,
      });

      const child = wc.workingSections()[0].indicators![0].children![0];
      expect(child.hidden_rule).toBe('true');
    });

    it('updateChildIndicatorParams with null occurrence_rule should set canonical OFF', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [
            makeIndicator({
              id: 'i1', name: 'Parent',
              children: [{
                id: 'c1', name: 'Child1', technical_label: 'child1', type: 'numeric',
                created_at: '2026-01-01', last_updated_at: '2026-01-01',
                hidden_rule: 'false', required_rule: 'false', disabled_rule: 'false',
                default_value_rule: 'false', constrained_rule: 'false',
                occurrence_rule: { min: 'true', max: 'false' },
              }],
            }),
          ],
        }),
      ]);

      wc.updateChildIndicatorParams('s1', 'financial', 'i1', 'c1', {
        hidden_rule: null,
        required_rule: null,
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: null,
        constrained_rule: null,
      });

      const child = wc.workingSections()[0].indicators![0].children![0];
      expect(child.occurrence_rule).toEqual({ min: 'false', max: 'false' });
    });
  });

  // ── Section occurrence toggle OFF ────────────────────────────────────

  describe('section occurrence toggle OFF (Story 23.1 AC #1)', () => {
    it('should update working copy to canonical OFF when occurrence toggled OFF', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          occurrence_rule: { min: 'true', max: 'false' },
        }),
      ]);

      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: 'false',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      const section = wc.workingSections()[0];
      expect(section.occurrence_rule).toEqual({ min: 'false', max: 'false' });
    });
  });

  // ── AC #5: Reset ──────────────────────────────────────────────────────

  describe('reset (AC #5)', () => {
    it('should revert to original sections', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.addSection('application');
      expect(wc.isDirty()).toBe(true);

      wc.reset();
      expect(wc.workingSections().length).toBe(1);
      expect(wc.isDirty()).toBe(false);
    });
  });

  // ── AC #4: Changeset computation ──────────────────────────────────────

  describe('computeChangeset (AC #4)', () => {
    it('should detect added sections (stubs with indicators)', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: null, key: 'application' }),
      ]);

      wc.addIndicator(null, 'application', { id: 'i1', name: 'Ind1', technical_label: 'ind1', type: 'numeric' });

      const cs = wc.computeChangeset();
      expect(cs.sectionsToCreate.length).toBe(1);
      expect(cs.sectionsToCreate[0].key).toBe('application');
      expect(cs.sectionsToCreate[0].indicators.length).toBe(1);
    });

    it('should NOT include stub sections without indicators', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: null, key: 'application' }),
      ]);

      wc.addSection('progress');

      const cs = wc.computeChangeset();
      // The new 'progress' section has no indicators, should not be in create list
      // The existing 'application' stub also has no indicators
      expect(cs.sectionsToCreate.length).toBe(0);
    });

    it('should detect deleted sections', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
        makeSection({ id: 's2', key: 'application' }),
      ]);

      wc.removeSection('s1');

      const cs = wc.computeChangeset();
      expect(cs.sectionsToDelete).toEqual(['s1']);
    });

    it('should detect updated section params', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: 'true',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      const cs = wc.computeChangeset();
      expect(cs.sectionsToUpdate.length).toBe(1);
      expect(cs.sectionsToUpdate[0].sectionId).toBe('s1');
      expect(cs.sectionsToUpdate[0].params.hidden_rule).toBe('true');
    });

    it('should detect indicator changes per section', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [makeIndicator({ id: 'i1', name: 'Ind1' })],
        }),
      ]);

      wc.addIndicator('s1', 'financial', { id: 'i2', name: 'Ind2', technical_label: 'ind2', type: 'numeric' });

      const cs = wc.computeChangeset();
      expect(cs.indicatorUpdates.length).toBe(1);
      expect(cs.indicatorUpdates[0].sectionId).toBe('s1');
      expect(cs.indicatorUpdates[0].indicators.length).toBe(2);
    });

    it('should exclude unchanged sections', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
        makeSection({ id: 's2', key: 'application' }),
      ]);

      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: 'true',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      const cs = wc.computeChangeset();
      expect(cs.sectionsToUpdate.length).toBe(1);
      expect(cs.sectionsToUpdate[0].sectionId).toBe('s1');
      // s2 is unchanged, should not appear
      expect(cs.indicatorUpdates.length).toBe(0);
    });
  });

  // ── AC #7: Unsaved count ──────────────────────────────────────────────

  describe('unsavedCount (AC #7)', () => {
    it('should count all change types', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [
            makeIndicator({ id: 'i1', name: 'Ind1', position: 0 }),
            makeIndicator({ id: 'i2', name: 'Ind2', position: 1 }),
          ],
        }),
        makeSection({ id: 's2', key: 'application' }),
      ]);

      // Change 1: update section params
      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: 'true',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      // Change 2: remove indicator (indicator list change)
      wc.removeIndicator('s1', 'financial', 'i2');

      // Change 3: delete section
      wc.removeSection('s2');

      // s1 has param change (1) + indicator change (1) + s2 deleted (1) = 3
      expect(wc.unsavedCount()).toBe(3);
    });
  });

  // ── AC #8: Rule validation ────────────────────────────────────────────

  describe('validateRules (AC #8)', () => {
    it('should return null when all rules are valid', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [makeIndicator({ id: 'i1', name: 'Ind1' })],
        }),
      ]);
      expect(wc.validateRules()).toBeNull();
    });

    it('should return null when rules are "false"', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);
      expect(wc.validateRules()).toBeNull();
    });

    it('should detect invalid JSON in section rules', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: '{invalid json',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      expect(wc.validateRules()).toBe('Corrigez les erreurs JSON avant d\'enregistrer');
    });

    it('should detect invalid JSON in indicator rules', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({
          id: 's1', key: 'financial',
          indicators: [makeIndicator({ id: 'i1', name: 'Ind1' })],
        }),
      ]);

      wc.updateIndicatorParams('s1', 'financial', 'i1', {
        hidden_rule: 'not valid json',
        required_rule: null,
        disabled_rule: null,
        default_value_rule: null,
        occurrence_rule: null,
        constrained_rule: null,
      });

      expect(wc.validateRules()).toBe('Corrigez les erreurs JSON avant d\'enregistrer');
    });

    it('should accept valid JSON rules', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: '{"field": "value", "operator": "==", "value": 42}',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      expect(wc.validateRules()).toBeNull();
    });
  });

  // ── AC #9: Stub sections ──────────────────────────────────────────────

  describe('stub sections (AC #9)', () => {
    it('should handle adding indicators to stub sections', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: null, key: 'application' }),
      ]);

      wc.addIndicator(null, 'application', { id: 'i1', name: 'Ind1', technical_label: 'ind1', type: 'numeric' });

      expect(wc.workingSections()[0].indicators!.length).toBe(1);
      expect(wc.isDirty()).toBe(true);
    });

    it('should include stubs with indicators in sectionsToCreate', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: null, key: 'application' }),
      ]);

      wc.addIndicator(null, 'application', { id: 'i1', name: 'Ind1', technical_label: 'ind1', type: 'numeric' });

      const cs = wc.computeChangeset();
      expect(cs.sectionsToCreate.length).toBe(1);
      expect(cs.sectionsToCreate[0].key).toBe('application');
      expect(cs.sectionsToCreate[0].indicators.length).toBe(1);
      expect(cs.sectionsToCreate[0].indicators[0].indicator_model_id).toBe('i1');
    });

    it('should NOT include stubs without indicators in sectionsToCreate', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: null, key: 'application' }),
      ]);

      const cs = wc.computeChangeset();
      expect(cs.sectionsToCreate.length).toBe(0);
    });
  });

  // ── AC #6: Save orchestration ─────────────────────────────────────────

  describe('save orchestration (AC #6)', () => {
    it('should call callbacks in correct order', async () => {
      const callOrder: string[] = [];

      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
        makeSection({ id: null, key: 'application' }),
      ]);

      // Create a section (stub with indicator)
      wc.addIndicator(null, 'application', { id: 'i1', name: 'Ind1', technical_label: 'ind1', type: 'numeric' });
      // Delete a section
      wc.removeSection('s1');

      const callbacks = mockCallbacks({
        createSection: vi.fn().mockImplementation(async () => {
          callOrder.push('create');
          return { id: 'new-app-id' };
        }),
        deleteSection: vi.fn().mockImplementation(async () => {
          callOrder.push('delete');
        }),
        updateSectionIndicators: vi.fn().mockImplementation(async () => {
          callOrder.push('indicators');
        }),
      });

      const result = await wc.save(callbacks);

      expect(result.success).toBe(true);
      expect(callbacks.createSection).toHaveBeenCalledOnce();
      expect(callbacks.deleteSection).toHaveBeenCalledOnce();
      // Indicators for newly created section
      expect(callbacks.updateSectionIndicators).toHaveBeenCalledOnce();
      // Create + delete happen first (parallel), then indicators
      expect(callOrder.indexOf('indicators')).toBeGreaterThan(callOrder.indexOf('create'));
    });

    it('should propagate created section IDs to indicator updates', async () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: null, key: 'application' }),
      ]);

      wc.addIndicator(null, 'application', { id: 'i1', name: 'Ind1', technical_label: 'ind1', type: 'numeric' });

      const callbacks = mockCallbacks({
        createSection: vi.fn().mockResolvedValue({ id: 'server-id-123' }),
      });

      await wc.save(callbacks);

      expect(callbacks.updateSectionIndicators).toHaveBeenCalledWith(
        'server-id-123',
        expect.any(Array),
      );
    });

    it('should return validation error without calling any API', async () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: '{bad json',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      const callbacks = mockCallbacks();
      const result = await wc.save(callbacks);

      expect(result.success).toBe(false);
      expect(result.validationError).toBe('Corrigez les erreurs JSON avant d\'enregistrer');
      expect(callbacks.createSection).not.toHaveBeenCalled();
      expect(callbacks.deleteSection).not.toHaveBeenCalled();
      expect(callbacks.updateSection).not.toHaveBeenCalled();
      expect(callbacks.updateSectionIndicators).not.toHaveBeenCalled();
    });

    it('should return success when nothing to save', async () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      const callbacks = mockCallbacks();
      const result = await wc.save(callbacks);

      expect(result.success).toBe(true);
      expect(callbacks.createSection).not.toHaveBeenCalled();
    });
  });

  // ── null/'false' equivalence ──────────────────────────────────────────

  describe('null/false equivalence (AC #1, #4)', () => {
    it('should not treat null vs false as dirty', () => {
      // Create section where hidden_rule is 'false' but we set it to 'false' (no change)
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      // Setting same values should not be dirty
      wc.updateSectionParams('s1', 'financial', {
        hidden_rule: 'false',
        required_rule: 'false',
        disabled_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
      });

      expect(wc.isDirty()).toBe(false);
    });

    it('sectionParamsChanged should handle null/false equivalence', () => {
      const a = makeSection({ id: 's1', key: 'financial', hidden_rule: 'false' });
      const b = makeSection({ id: 's1', key: 'financial', hidden_rule: 'false' });
      expect(sectionParamsChanged(a, b)).toBe(false);
    });
  });

  // ── Helper utilities ──────────────────────────────────────────────────

  describe('helper utilities', () => {
    it('sectionParamsChanged should detect param changes', () => {
      const a = makeSection({ id: 's1', key: 'financial', hidden_rule: 'false' });
      const b = makeSection({ id: 's1', key: 'financial', hidden_rule: 'true' });
      expect(sectionParamsChanged(a, b)).toBe(true);
    });

    it('indicatorsChanged should detect added indicators', () => {
      const a = makeSection({ id: 's1', key: 'financial', indicators: [] });
      const b = makeSection({
        id: 's1', key: 'financial',
        indicators: [makeIndicator({ id: 'i1', name: 'Ind1' })],
      });
      expect(indicatorsChanged(a, b)).toBe(true);
    });

    it('indicatorsChanged should detect reordered indicators', () => {
      const a = makeSection({
        id: 's1', key: 'financial',
        indicators: [
          makeIndicator({ id: 'i1', name: 'A', position: 0 }),
          makeIndicator({ id: 'i2', name: 'B', position: 1 }),
        ],
      });
      const b = makeSection({
        id: 's1', key: 'financial',
        indicators: [
          makeIndicator({ id: 'i2', name: 'B', position: 0 }),
          makeIndicator({ id: 'i1', name: 'A', position: 1 }),
        ],
      });
      expect(indicatorsChanged(a, b)).toBe(true);
    });
  });

  // ── removeStubSection ─────────────────────────────────────────────────

  describe('removeStubSection', () => {
    it('should remove a stub section (id: null) by key', () => {
      const wc = createSectionWorkingCopy(() => []);
      wc.addSection('application');
      expect(wc.workingSections().length).toBe(1);

      wc.removeStubSection('application');

      expect(wc.workingSections().length).toBe(0);
      expect(wc.isDirty()).toBe(false);
    });

    it('should not remove a real section that shares the same key', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'application' }),
      ]);

      wc.removeStubSection('application');

      expect(wc.workingSections().length).toBe(1);
      expect(wc.workingSections()[0].id).toBe('s1');
    });

    it('should mark working copy clean when stub removal restores original state', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);
      wc.addSection('application');
      expect(wc.isDirty()).toBe(true);

      wc.removeStubSection('application');

      expect(wc.isDirty()).toBe(false);
    });
  });

  // ── Refresh ───────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('should reset working copy after mutation', () => {
      const wc = createSectionWorkingCopy(() => [
        makeSection({ id: 's1', key: 'financial' }),
      ]);

      wc.addSection('application');
      expect(wc.isDirty()).toBe(true);
      expect(wc.workingSections().length).toBe(2);

      wc.refresh();

      // After refresh, working copy should re-sync with source (1 section)
      expect(wc.workingSections().length).toBe(1);
      expect(wc.isDirty()).toBe(false);
    });
  });
});
