import { ActivityResponse } from './history.models';
import { entityRoute, actionLabel, actionBadgeClass, isModelEntityType, filterByCategory, groupByParent, groupByTime } from './history.utils';

function makeActivity(overrides: Partial<ActivityResponse> = {}): ActivityResponse {
  return {
    id: 'a1',
    user_id: 'u1',
    user_name: 'Alice',
    action: 'update',
    entity_type: 'ActionModel',
    entity_id: 'e1',
    entity_display_name: 'Test Entity',
    description: '',
    created_at: '2026-03-13T10:00:00Z',
    ...overrides,
  } as ActivityResponse;
}

describe('entityRoute', () => {
  it('should map FundingProgram to /funding-programs/{id}', () => {
    expect(entityRoute('FundingProgram', '123')).toBe('/funding-programs/123');
  });

  it('should map FolderModel to /folder-models/{id}', () => {
    expect(entityRoute('FolderModel', 'abc')).toBe('/folder-models/abc');
  });

  it('should map ActionModel to /action-models/{id}', () => {
    expect(entityRoute('ActionModel', '456')).toBe('/action-models/456');
  });

  it('should map ActionTheme to /action-themes/{id}', () => {
    expect(entityRoute('ActionTheme', '789')).toBe('/action-themes/789');
  });

  it('should map Community to /communities/{id}', () => {
    expect(entityRoute('Community', 'c1')).toBe('/communities/c1');
  });

  it('should map Agent to /agents/{id}', () => {
    expect(entityRoute('Agent', 'a1')).toBe('/agents/a1');
  });

  it('should map IndicatorModel to /indicator-models/{id}', () => {
    expect(entityRoute('IndicatorModel', 'im1')).toBe('/indicator-models/im1');
  });

  it('should map User to /users/{id}', () => {
    expect(entityRoute('User', 'u1')).toBe('/users/u1');
  });

  it('should return null for unknown entity types', () => {
    expect(entityRoute('UnknownType', '123')).toBeNull();
  });

  it('should return null for empty entity type', () => {
    expect(entityRoute('', '123')).toBeNull();
  });
});

describe('actionLabel', () => {
  it('should return French label for create', () => {
    expect(actionLabel('create')).toBe('Création');
  });

  it('should return French label for update', () => {
    expect(actionLabel('update')).toBe('Modification');
  });

  it('should return French label for delete', () => {
    expect(actionLabel('delete')).toBe('Suppression');
  });

  it('should return action string for unknown action', () => {
    expect(actionLabel('archive')).toBe('archive');
  });
});

describe('actionBadgeClass', () => {
  it('should return design-token classes for create', () => {
    expect(actionBadgeClass('create')).toContain('status-done');
  });

  it('should return design-token classes for update', () => {
    expect(actionBadgeClass('update')).toContain('brand');
  });

  it('should return design-token classes for delete', () => {
    expect(actionBadgeClass('delete')).toContain('status-invalid');
  });

  it('should return muted classes for unknown action', () => {
    expect(actionBadgeClass('other')).toContain('surface-muted');
  });
});

describe('isModelEntityType', () => {
  it('should return true for known model types', () => {
    expect(isModelEntityType('ActionModel')).toBe(true);
    expect(isModelEntityType('FundingProgram')).toBe(true);
    expect(isModelEntityType('User')).toBe(true);
  });

  it('should return false for instance types', () => {
    expect(isModelEntityType('Action')).toBe(false);
    expect(isModelEntityType('Folder')).toBe(false);
    expect(isModelEntityType('Indicator')).toBe(false);
  });
});

describe('filterByCategory', () => {
  const activities = [
    makeActivity({ id: '1', entity_type: 'ActionModel' }),
    makeActivity({ id: '2', entity_type: 'Action' }),
    makeActivity({ id: '3', entity_type: 'FundingProgram' }),
    makeActivity({ id: '4', entity_type: 'Folder' }),
  ];

  it('should return all activities for "all"', () => {
    expect(filterByCategory(activities, 'all')).toHaveLength(4);
  });

  it('should return only model types for "models"', () => {
    const result = filterByCategory(activities, 'models');
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.entity_type)).toEqual(['ActionModel', 'FundingProgram']);
  });

  it('should return only instance types for "instances"', () => {
    const result = filterByCategory(activities, 'instances');
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.entity_type)).toEqual(['Action', 'Folder']);
  });
});

describe('groupByParent', () => {
  it('should group children under their parent', () => {
    const parent = makeActivity({ id: 'p1', entity_type: 'ActionModel', entity_id: 'am1' });
    const child1 = makeActivity({ id: 'c1', entity_type: 'IndicatorModel', entity_id: 'im1', parent_entity_id: 'am1', parent_entity_name: 'Parent Action' });
    const child2 = makeActivity({ id: 'c2', entity_type: 'IndicatorModel', entity_id: 'im2', parent_entity_id: 'am1', parent_entity_name: 'Parent Action' });

    const groups = groupByParent([parent, child1, child2]);
    expect(groups).toHaveLength(1);
    expect(groups[0].primary.id).toBe('p1');
    expect(groups[0].children).toHaveLength(2);
  });

  it('should keep standalone activities ungrouped', () => {
    const a1 = makeActivity({ id: '1', entity_id: 'e1' });
    const a2 = makeActivity({ id: '2', entity_id: 'e2' });

    const groups = groupByParent([a1, a2]);
    expect(groups).toHaveLength(2);
    expect(groups[0].children).toHaveLength(0);
    expect(groups[1].children).toHaveLength(0);
  });

  it('should handle orphan children whose parent is not in the list', () => {
    const child1 = makeActivity({ id: 'c1', parent_entity_id: 'missing-parent' });
    const child2 = makeActivity({ id: 'c2', parent_entity_id: 'missing-parent' });

    const groups = groupByParent([child1, child2]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toContain('orphan');
    expect(groups[0].primary.id).toBe('c1');
    expect(groups[0].children).toHaveLength(1);
  });
});

describe('groupByTime', () => {
  it('should group activities within 1-minute window for same entity+user', () => {
    const a1 = makeActivity({ id: '1', entity_id: 'e1', user_id: 'u1', created_at: '2026-03-13T10:00:00Z' });
    const a2 = makeActivity({ id: '2', entity_id: 'e1', user_id: 'u1', created_at: '2026-03-13T09:59:30Z' });
    const a3 = makeActivity({ id: '3', entity_id: 'e1', user_id: 'u1', created_at: '2026-03-13T09:59:00Z' });

    const groups = groupByTime([a1, a2, a3]);
    expect(groups).toHaveLength(1);
    expect(groups[0].activities).toHaveLength(3);
  });

  it('should not group activities for different entities', () => {
    const a1 = makeActivity({ id: '1', entity_id: 'e1', user_id: 'u1', created_at: '2026-03-13T10:00:00Z' });
    const a2 = makeActivity({ id: '2', entity_id: 'e2', user_id: 'u1', created_at: '2026-03-13T09:59:30Z' });

    const groups = groupByTime([a1, a2]);
    expect(groups).toHaveLength(2);
  });

  it('should not group activities for different users', () => {
    const a1 = makeActivity({ id: '1', entity_id: 'e1', user_id: 'u1', created_at: '2026-03-13T10:00:00Z' });
    const a2 = makeActivity({ id: '2', entity_id: 'e1', user_id: 'u2', created_at: '2026-03-13T09:59:30Z' });

    const groups = groupByTime([a1, a2]);
    expect(groups).toHaveLength(2);
  });

  it('should split groups when time gap exceeds 1 minute', () => {
    const a1 = makeActivity({ id: '1', entity_id: 'e1', user_id: 'u1', created_at: '2026-03-13T10:00:00Z' });
    const a2 = makeActivity({ id: '2', entity_id: 'e1', user_id: 'u1', created_at: '2026-03-13T09:58:00Z' });

    const groups = groupByTime([a1, a2]);
    expect(groups).toHaveLength(2);
  });

  it('should set hiddenCount when group exceeds max visible', () => {
    const activities = Array.from({ length: 15 }, (_, i) =>
      makeActivity({
        id: `a${i}`,
        entity_id: 'e1',
        user_id: 'u1',
        created_at: new Date(Date.UTC(2026, 2, 13, 10, 0, i)).toISOString(),
      }),
    );

    const groups = groupByTime(activities);
    expect(groups).toHaveLength(1);
    expect(groups[0].hiddenCount).toBe(5);
  });

  it('should return empty array for empty input', () => {
    expect(groupByTime([])).toEqual([]);
  });
});
