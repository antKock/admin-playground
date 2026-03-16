import { ActivityResponse, ActivityScope, ActivityWithChildren, DayGroup, ENTITY_TYPES, TimeGroup } from './history.models';

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

// ── Scope-based entity type sets (timeline feed) ─────────────────────────

export const ADMIN_ENTITY_TYPES = new Set([
  'FundingProgram', 'ActionTheme', 'ActionModel', 'FolderModel',
  'IndicatorModel', 'User', 'Community',
]);

export const USER_ENTITY_TYPES = new Set([
  'Action', 'Folder', 'Agent', 'Site', 'Building', 'Indicator',
]);

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

// ── Scope filtering (timeline feed) ──────────────────────────────────────

export function filterByScope(
  activities: ActivityResponse[],
  scope: ActivityScope,
): ActivityResponse[] {
  const set = scope === 'admin' ? ADMIN_ENTITY_TYPES : USER_ENTITY_TYPES;
  return activities.filter((a) => set.has(a.entity_type));
}

// ── Grouping ──────────────────────────────────────────────────────────────

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

// ── Day grouping (timeline feed) ─────────────────────────────────────────

/** Format a date as YYYY-MM-DD in local timezone. */
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayLabel(date: Date, today: Date): string {
  const todayStr = localDateStr(today);
  const dateStr = localDateStr(date);

  if (dateStr === todayStr) return "Aujourd'hui";

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === localDateStr(yesterday)) return 'Hier';

  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Group activities by calendar day in local timezone.
 * Input must be sorted by created_at descending (newest first) — output preserves this order.
 */
export function groupByDay(activities: ActivityWithChildren[], now?: Date): DayGroup[] {
  const today = now ?? new Date();
  const map = new Map<string, { label: string; activities: ActivityWithChildren[] }>();

  for (const activity of activities) {
    const date = new Date(activity.created_at);
    const dateStr = localDateStr(date);

    if (!map.has(dateStr)) {
      map.set(dateStr, { label: dayLabel(date, today), activities: [] });
    }
    map.get(dateStr)!.activities.push(activity);
  }

  // Sort day groups by date descending (newest first)
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, group]) => ({
      label: group.label,
      date,
      activities: group.activities,
    }));
}

// ── Indicator rollup (timeline feed, User scope only) ────────────────────

function indicatorRollupLabel(action: string): string {
  switch (action) {
    case 'update': return 'indicateurs modifiés';
    case 'create': return 'indicateurs créés';
    case 'delete': return 'indicateurs supprimés';
    default: return 'indicateurs modifiés';
  }
}

export function rollupIndicators(activities: ActivityResponse[]): ActivityWithChildren[] {
  const result: ActivityWithChildren[] = [];
  const childMap = new Map<string, { label: string; count: number }[]>();
  const childIds = new Set<string>();

  // First pass: identify indicator instances that have a parent Action
  for (const activity of activities) {
    if (
      activity.parent_entity_type === 'Action' &&
      activity.parent_entity_id &&
      activity.entity_type === 'Indicator'
    ) {
      const key = activity.parent_entity_id;
      if (!childMap.has(key)) childMap.set(key, []);

      const existing = childMap.get(key)!;
      const label = indicatorRollupLabel(activity.action);
      const found = existing.find((c) => c.label === label);
      if (found) {
        found.count++;
      } else {
        existing.push({ label, count: 1 });
      }
      childIds.add(activity.id);
    }
  }

  // Second pass: build result with children attached to parent Actions
  for (const activity of activities) {
    if (childIds.has(activity.id)) continue; // skip rolled-up children

    const withChildren: ActivityWithChildren = { ...activity };
    if (activity.entity_type === 'Action' && childMap.has(activity.entity_id)) {
      withChildren.children = childMap.get(activity.entity_id)!;
      childMap.delete(activity.entity_id);
    }
    result.push(withChildren);
  }

  // Orphan indicator groups (parent Action not in current page)
  for (const [parentId, children] of childMap) {
    const representative = activities.find(
      (a) => a.parent_entity_id === parentId && childIds.has(a.id),
    );
    if (representative) {
      // Show as a parent Action card using parent info from the indicator activity
      result.push({
        ...representative,
        entity_type: representative.parent_entity_type ?? representative.entity_type,
        entity_id: parentId,
        entity_display_name: representative.parent_entity_name ?? parentId,
        children,
      });
    }
  }

  return result;
}
