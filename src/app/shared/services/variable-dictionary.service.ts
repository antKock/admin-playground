/**
 * Variable dictionary for the prose rule editor.
 * Fetches indicator models + entity properties from the API and builds ProseVariable[] for autocomplete and linting.
 *
 * @see docs/jsonlogic-prose-architecture.md
 */
import { Injectable, inject, Injector, Signal, runInInjectionContext } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of, forkJoin, EMPTY } from 'rxjs';
import { map, catchError, expand, reduce } from 'rxjs/operators';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { IndicatorModel, IndicatorModelType } from '@domains/indicator-models/indicator-model.models';
import { ActionModel } from '@domains/action-models/action-model.models';
import { FolderModel } from '@domains/folder-models/folder-model.models';

export interface ProseVariable {
  path: string;
  type: 'nombre' | 'texte' | 'liste' | 'booleen' | 'date';
  group: string;
  source: 'indicator' | 'property';
}

/**
 * Maps an IndicatorModelType enum value to a ProseVariable type.
 * Exported for testing.
 */
export function mapIndicatorType(type: IndicatorModelType): ProseVariable['type'] {
  switch (type) {
    case 'text':
      return 'texte';
    case 'number':
      return 'nombre';
    default:
      return 'texte';
  }
}

/**
 * Infers a ProseVariable type from a runtime value.
 * Exported for testing.
 */
export function inferPropertyType(value: unknown): ProseVariable['type'] {
  if (typeof value === 'number') return 'nombre';
  if (typeof value === 'boolean') return 'booleen';
  if (typeof value === 'string') {
    // ISO date pattern: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    return 'texte';
  }
  if (Array.isArray(value)) return 'liste';
  return 'texte';
}

const INDICATOR_MODELS_URL = `${environment.apiBaseUrl}/indicator-models/`;
const ACTION_MODELS_URL = `${environment.apiBaseUrl}/action-models/`;
const FOLDER_MODELS_URL = `${environment.apiBaseUrl}/folder-models/`;

/** Page size for paginated indicator fetching. */
const INDICATOR_PAGE_SIZE = 100;

/** Maximum pages to fetch before stopping (safety cap against infinite loops). */
const MAX_INDICATOR_PAGES = 20;

/** Properties to skip when building entity property variables. */
const SKIP_PROPERTIES = new Set([
  'id', 'created_at', 'updated_at',
  'funding_program_id', 'action_theme_id',
  'indicator_model_ids', 'indicator_model_associations',
  'indicator_models', 'funding_program', 'action_theme',
  'funding_programs', 'funding_program_ids',
  'community', 'community_id', 'beneficiaries',
  'folder', 'folder_id', 'folder_model', 'folder_model_id',
  'community_creator', 'community_creator_id',
  'community_holder', 'community_holder_id',
  'action_model', 'action_model_id',
  'actions', 'next_possible_statuses',
]);

/** Static schemas for linked entity types (derived from API types, no extra API calls needed). */
const LINKED_ENTITIES: Record<'action' | 'folder', { group: string; properties: [string, ProseVariable['type']][] }[]> = {
  action: [
    {
      group: 'community',
      properties: [
        ['siret', 'texte'],
        ['name', 'texte'],
        ['unique_id', 'texte'],
      ],
    },
    {
      group: 'beneficiaries',
      properties: [
        ['siret', 'texte'],
        ['name', 'texte'],
        ['unique_id', 'texte'],
      ],
    },
    {
      group: 'folder',
      properties: [
        ['name', 'texte'],
        ['label', 'texte'],
        ['status', 'texte'],
        ['start_date', 'date'],
        ['end_date', 'date'],
        ['unique_id', 'texte'],
      ],
    },
  ],
  folder: [
    {
      group: 'community_creator',
      properties: [
        ['siret', 'texte'],
        ['name', 'texte'],
        ['unique_id', 'texte'],
      ],
    },
    {
      group: 'community_holder',
      properties: [
        ['siret', 'texte'],
        ['name', 'texte'],
        ['unique_id', 'texte'],
      ],
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class VariableDictionaryService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly cache = new Map<string, Signal<ProseVariable[]>>();

  /**
   * Returns a Signal containing the list of available ProseVariables for a given model.
   * Results are cached per modelType:modelId key.
   */
  getVariables(modelType: 'action' | 'folder', modelId: string): Signal<ProseVariable[]> {
    const key = `${modelType}:${modelId}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const variables$ = this.buildVariables$(modelType, modelId);
    const sig = runInInjectionContext(this.injector, () =>
      toSignal(variables$, { initialValue: [] }),
    );
    this.cache.set(key, sig);
    return sig;
  }

  private buildVariables$(modelType: 'action' | 'folder', modelId: string): Observable<ProseVariable[]> {
    // Use server-side filtering for action models; fetch all indicators for folder models
    const indicators$ = modelType === 'action'
      ? this.fetchIndicators$(modelId)
      : this.fetchIndicators$();
    const entity$ = modelType === 'action'
      ? this.fetchActionModel$(modelId)
      : this.fetchFolderModel$(modelId);

    return forkJoin([indicators$, entity$]).pipe(
      map(([indicators, entity]) => {
        const vars: ProseVariable[] = [];

        // Root-level indicator variables (already filtered server-side for action models)
        for (const im of indicators) {
          vars.push({
            path: im.technical_label,
            type: mapIndicatorType(im.type),
            group: '',
            source: 'indicator',
          });
        }

        // Entity property variables + object.indicator variables
        if (entity) {
          const group = modelType;
          const entries = Object.entries(entity as Record<string, unknown>);
          for (const [prop, value] of entries) {
            if (SKIP_PROPERTIES.has(prop)) continue;
            vars.push({
              path: `${group}.${prop}`,
              type: inferPropertyType(value),
              group,
              source: 'property',
            });
          }

          // Object-scoped indicators (e.g. action.montant_ht) — all indicators, not just linked
          const existingPaths = new Set(vars.map((v) => v.path));
          for (const im of indicators) {
            const path = `${group}.${im.technical_label}`;
            if (existingPaths.has(path)) continue;
            vars.push({
              path,
              type: mapIndicatorType(im.type),
              group,
              source: 'indicator',
            });
          }
        }

        // Linked entity variables (community, beneficiaries, folder, etc.)
        if (!entity) return vars;
        for (const linked of LINKED_ENTITIES[modelType]) {
          for (const [prop, type] of linked.properties) {
            vars.push({
              path: `${linked.group}.${prop}`,
              type,
              group: linked.group,
              source: 'property',
            });
          }
          for (const im of indicators) {
            vars.push({
              path: `${linked.group}.${im.technical_label}`,
              type: mapIndicatorType(im.type),
              group: linked.group,
              source: 'indicator',
            });
          }
        }

        return vars;
      }),
      catchError((err) => {
        console.error('VariableDictionaryService: failed to build variables', err);
        return of([]);
      }),
    );
  }

  private fetchIndicators$(actionModelId?: string): Observable<IndicatorModel[]> {
    const fetchPage = (cursor: string | null): Observable<PaginatedResponse<IndicatorModel>> => {
      let params = new HttpParams().set('limit', String(INDICATOR_PAGE_SIZE));
      if (cursor) {
        params = params.set('cursor', cursor);
      }
      if (actionModelId) {
        params = params.set('action_model_id', actionModelId);
      }
      return this.http.get<PaginatedResponse<IndicatorModel>>(INDICATOR_MODELS_URL, { params });
    };

    let pageCount = 0;
    return fetchPage(null).pipe(
      expand((res) => {
        pageCount++;
        return res.pagination.has_next_page && res.pagination.cursors.end_cursor && pageCount < MAX_INDICATOR_PAGES
          ? fetchPage(res.pagination.cursors.end_cursor)
          : EMPTY;
      }),
      reduce((acc, res) => acc.concat(res.data), [] as IndicatorModel[]),
      catchError((err) => {
        console.error('VariableDictionaryService: failed to fetch indicators', err);
        return of([]);
      }),
    );
  }

  private fetchActionModel$(id: string): Observable<ActionModel | null> {
    return this.http.get<ActionModel>(`${ACTION_MODELS_URL}${id}`).pipe(
      catchError((err) => {
        console.error('VariableDictionaryService: failed to fetch action model', err);
        return of(null);
      }),
    );
  }

  private fetchFolderModel$(id: string): Observable<FolderModel | null> {
    return this.http.get<FolderModel>(`${FOLDER_MODELS_URL}${id}`).pipe(
      catchError((err) => {
        console.error('VariableDictionaryService: failed to fetch folder model', err);
        return of(null);
      }),
    );
  }
}
