import { entityRoute, actionLabel, actionBadgeClass } from './history.utils';

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
