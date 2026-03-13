import { ActivityResponse, EntityTypeCategory, ENTITY_TYPES, ParentChildGroup, TimeGroup } from './history.models';

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

/** Derived from the single source of truth (ENTITY_TYPES) in history.models.ts. */
const MODEL_ENTITY_TYPES = new Set<string>(ENTITY_TYPES);

const TIME_GROUP_WINDOW_MS = 60_000;
const TIME_GROUP_MAX_VISIBLE = 10;

// ── Shared filter options (used by both feed components) ──────────────────

export interface EntityTypeOption {
  label: string;
  value: string;
}

export const ENTITY_TYPE_OPTIONS: EntityTypeOption[] = [
  { label: 'Tous', value: '' },
  { label: 'Programme de financement', value: 'FundingProgram' },
  { label: 'Modèle de dossier', value: 'FolderModel' },
  { label: "Modèle d'action", value: 'ActionModel' },
  { label: "Thème d'action", value: 'ActionTheme' },
  { label: 'Communauté', value: 'Community' },
  { label: 'Agent', value: 'Agent' },
  { label: "Modèle d'indicateur", value: 'IndicatorModel' },
  { label: 'Utilisateur', value: 'User' },
];

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  FundingProgram: 'Programme',
  FolderModel: 'Dossier',
  ActionModel: 'Action',
  ActionTheme: 'Thème',
  Community: 'Communauté',
  Agent: 'Agent',
  IndicatorModel: 'Indicateur',
  User: 'Utilisateur',
};

export const ACTION_TYPE_OPTIONS = [
  { label: 'Toutes', value: '' },
  { label: 'Création', value: 'create' },
  { label: 'Modification', value: 'update' },
  { label: 'Suppression', value: 'delete' },
];

export const CATEGORY_OPTIONS: { label: string; value: EntityTypeCategory }[] = [
  { label: 'Tout', value: 'all' },
  { label: 'Modèles', value: 'models' },
  { label: 'Instances', value: 'instances' },
];

// ── Route / label helpers ──────────────────────────────────────────────────

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

export function entityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

// ── Category filtering ────────────────────────────────────────────────────

export function isModelEntityType(entityType: string): boolean {
  return MODEL_ENTITY_TYPES.has(entityType);
}

/**
 * Client-side category filter.
 * NOTE: This filters already-fetched paginated data. When few items of the
 * selected category exist on the current page, the list may appear shorter
 * than expected. This is a known build-phase limitation — the API does not
 * currently support a category parameter.
 */
export function filterByCategory(
  activities: ActivityResponse[],
  category: EntityTypeCategory,
): ActivityResponse[] {
  if (category === 'all') return activities;
  if (category === 'models') return activities.filter((a) => isModelEntityType(a.entity_type));
  return activities.filter((a) => !isModelEntityType(a.entity_type));
}

// ── Grouping ──────────────────────────────────────────────────────────────

/**
 * Group activities by parent-child relationship.
 * Activities with parent_entity_id are grouped under their parent.
 * Standalone activities remain ungrouped (empty children array).
 */
export function groupByParent(activities: ActivityResponse[]): ParentChildGroup[] {
  const childrenByParent = new Map<string, ActivityResponse[]>();
  const standalone: ActivityResponse[] = [];

  for (const activity of activities) {
    if (activity.parent_entity_id) {
      const key = activity.parent_entity_id;
      if (!childrenByParent.has(key)) childrenByParent.set(key, []);
      childrenByParent.get(key)!.push(activity);
    } else {
      standalone.push(activity);
    }
  }

  const groups: ParentChildGroup[] = [];

  for (const activity of standalone) {
    const children = childrenByParent.get(activity.entity_id);
    if (children) {
      groups.push({ key: activity.id, primary: activity, children });
      childrenByParent.delete(activity.entity_id);
    } else {
      groups.push({ key: activity.id, primary: activity, children: [] });
    }
  }

  // Orphan children whose parent isn't in the current page
  for (const [parentId, children] of childrenByParent) {
    groups.push({
      key: `orphan-${parentId}`,
      primary: children[0],
      children: children.slice(1),
    });
  }

  return groups;
}

/**
 * Group activities by time proximity: same (entity_id OR parent_entity_id) + user_id within 1min.
 * Activities must already be sorted by created_at (descending from API).
 */
export function groupByTime(activities: ActivityResponse[]): TimeGroup[] {
  if (activities.length === 0) return [];

  const groups: TimeGroup[] = [];
  let currentKey = timeGroupKey(activities[0]);
  let currentActivities: ActivityResponse[] = [activities[0]];
  let currentTime = new Date(activities[0].created_at).getTime();

  for (let i = 1; i < activities.length; i++) {
    const activity = activities[i];
    const key = timeGroupKey(activity);
    const time = new Date(activity.created_at).getTime();

    if (key === currentKey && Math.abs(currentTime - time) <= TIME_GROUP_WINDOW_MS) {
      currentActivities.push(activity);
      currentTime = time;
    } else {
      groups.push(makeTimeGroup(currentActivities));
      currentKey = key;
      currentActivities = [activity];
      currentTime = time;
    }
  }

  groups.push(makeTimeGroup(currentActivities));
  return groups;
}

function timeGroupKey(activity: ActivityResponse): string {
  const entityKey = activity.parent_entity_id || activity.entity_id;
  return `${entityKey}:${activity.user_id}`;
}

function makeTimeGroup(activities: ActivityResponse[]): TimeGroup {
  return {
    key: `tg-${activities[0].id}`,
    activities,
    hiddenCount: Math.max(0, activities.length - TIME_GROUP_MAX_VISIBLE),
  };
}
