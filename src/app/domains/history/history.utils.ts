const ENTITY_ROUTE_MAP: Record<string, string> = {
  FundingProgram: '/funding-programs',
  FolderModel: '/folder-models',
  ActionModel: '/action-models',
  ActionTheme: '/action-themes',
  Community: '/communities',
  Agent: '/agents',
  IndicatorModel: '/indicator-models',
  User: '/users',
};

export function entityRoute(entityType: string, entityId: string): string | null {
  const base = ENTITY_ROUTE_MAP[entityType];
  return base ? `${base}/${entityId}` : null;
}

export function actionLabel(action: string): string {
  switch (action) {
    case 'create': return 'Création';
    case 'update': return 'Modification';
    case 'delete': return 'Suppression';
    default: return action;
  }
}

export function actionBadgeClass(action: string): string {
  switch (action) {
    case 'create': return 'bg-status-done/10 text-status-done';
    case 'update': return 'bg-brand/10 text-brand';
    case 'delete': return 'bg-status-invalid/10 text-status-invalid';
    default: return 'bg-surface-muted text-text-secondary';
  }
}
