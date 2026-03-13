import { ActivityResponse } from './history.models';
import {
  entityRoute,
  actionLabel,
  actionBadgeClass,
  isModelEntityType,
  filterByScope,
  groupByDay,
  rollupIndicators,
  groupByTime,
} from './history.utils';

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

describe('filterByScope', () => {
  const activities = [
    makeActivity({ id: '1', entity_type: 'ActionModel' }),
    makeActivity({ id: '2', entity_type: 'Action' }),
    makeActivity({ id: '3', entity_type: 'FundingProgram' }),
    makeActivity({ id: '4', entity_type: 'Folder' }),
    makeActivity({ id: '5', entity_type: 'Indicator' }),
  ];

  it('should return only admin entity types for "admin" scope', () => {
    const result = filterByScope(activities, 'admin');
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.entity_type)).toEqual(['ActionModel', 'FundingProgram']);
  });

  it('should return only user entity types for "user" scope', () => {
    const result = filterByScope(activities, 'user');
    expect(result).toHaveLength(3);
    expect(result.map((a) => a.entity_type)).toEqual(['Action', 'Folder', 'Indicator']);
  });

  it('should return empty array when no matching types exist', () => {
    const onlyAdmin = [makeActivity({ entity_type: 'User' })];
    expect(filterByScope(onlyAdmin, 'user')).toHaveLength(0);
  });
});

describe('groupByDay', () => {
  const today = new Date('2026-03-13T15:00:00Z');

  it('should group activities by calendar day', () => {
    const activities = [
      makeActivity({ id: '1', created_at: '2026-03-13T14:00:00Z' }),
      makeActivity({ id: '2', created_at: '2026-03-13T10:00:00Z' }),
      makeActivity({ id: '3', created_at: '2026-03-12T16:00:00Z' }),
    ];

    const groups = groupByDay(activities, today);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe("Aujourd'hui");
    expect(groups[0].activities).toHaveLength(2);
    expect(groups[1].label).toBe('Hier');
    expect(groups[1].activities).toHaveLength(1);
  });

  it('should use French-formatted date for older days', () => {
    const activities = [
      makeActivity({ id: '1', created_at: '2026-03-10T10:00:00Z' }),
    ];

    const groups = groupByDay(activities, today);
    expect(groups).toHaveLength(1);
    // Should be a French date like "Mardi 10 mars"
    expect(groups[0].label).toMatch(/^\w.+\d+\s+\w+$/);
  });

  it('should return empty array for empty input', () => {
    expect(groupByDay([], today)).toEqual([]);
  });

  it('should sort day groups by date descending even with unordered input', () => {
    const activities = [
      makeActivity({ id: '1', created_at: '2026-03-10T10:00:00Z' }),
      makeActivity({ id: '2', created_at: '2026-03-13T14:00:00Z' }),
      makeActivity({ id: '3', created_at: '2026-03-12T16:00:00Z' }),
    ];

    const groups = groupByDay(activities, today);
    expect(groups).toHaveLength(3);
    expect(groups[0].label).toBe("Aujourd'hui");
    expect(groups[1].label).toBe('Hier');
    // Third group is the oldest day
    expect(groups[2].date).toBe('2026-03-10');
  });
});

describe('rollupIndicators', () => {
  it('should roll up indicator activities under parent Action', () => {
    const parentAction = makeActivity({
      id: 'p1',
      entity_type: 'Action',
      entity_id: 'action-1',
    });
    const indicator1 = makeActivity({
      id: 'i1',
      entity_type: 'Indicator',
      entity_id: 'ind-1',
      parent_entity_type: 'Action',
      parent_entity_id: 'action-1',
      action: 'update',
    });
    const indicator2 = makeActivity({
      id: 'i2',
      entity_type: 'Indicator',
      entity_id: 'ind-2',
      parent_entity_type: 'Action',
      parent_entity_id: 'action-1',
      action: 'update',
    });

    const result = rollupIndicators([parentAction, indicator1, indicator2]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
    expect(result[0].children).toBeDefined();
    expect(result[0].children![0].count).toBe(2);
  });

  it('should pass through standalone activities unchanged', () => {
    const standalone = makeActivity({ id: 's1', entity_type: 'Folder' });
    const result = rollupIndicators([standalone]);
    expect(result).toHaveLength(1);
    expect(result[0].children).toBeUndefined();
  });

  it('should not roll up indicators without parent_entity_type Action', () => {
    const indicator = makeActivity({
      id: 'i1',
      entity_type: 'Indicator',
      parent_entity_type: 'Folder',
      parent_entity_id: 'folder-1',
    });
    const result = rollupIndicators([indicator]);
    expect(result).toHaveLength(1);
    expect(result[0].children).toBeUndefined();
  });

  it('should handle orphan indicators whose parent Action is not in the list', () => {
    const indicator = makeActivity({
      id: 'i1',
      entity_type: 'Indicator',
      parent_entity_type: 'Action',
      parent_entity_id: 'missing-action',
      parent_entity_name: 'Action Orpheline',
      action: 'update',
    });

    const result = rollupIndicators([indicator]);
    expect(result).toHaveLength(1);
    expect(result[0].children).toBeDefined();
    // Orphan should display as parent Action, not as Indicator
    expect(result[0].entity_type).toBe('Action');
    expect(result[0].entity_display_name).toBe('Action Orpheline');
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
