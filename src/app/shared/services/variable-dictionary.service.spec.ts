import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  VariableDictionaryService,
  mapIndicatorType,
  inferPropertyType,
  ProseVariable,
} from './variable-dictionary.service';
import { IndicatorModel } from '@domains/indicator-models/indicator-model.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { environment } from '@app/../environments/environment';

const INDICATOR_MODELS_URL = `${environment.apiBaseUrl}/indicator-models/`;
const ACTION_MODELS_URL = `${environment.apiBaseUrl}/action-models/`;
const FOLDER_MODELS_URL = `${environment.apiBaseUrl}/folder-models/`;

const mockPagination = {
  total_count: 0,
  page_size: 100,
  has_next_page: false,
  has_previous_page: false,
  cursors: { start_cursor: null, end_cursor: null },
  _links: { self: '/', next: null, prev: null, first: '/' },
};

function makeIndicator(overrides: Partial<IndicatorModel> = {}): IndicatorModel {
  return {
    id: 'im-1',
    name: 'Montant HT',
    technical_label: 'montant_ht',
    description: null,
    type: 'number',
    unit: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Flush a single-page indicator response (no next page). */
function flushIndicators(httpTesting: HttpTestingController, indicators: IndicatorModel[]) {
  const req = httpTesting.expectOne(
    (r) => r.url === INDICATOR_MODELS_URL && r.params.get('limit') === '100',
  );
  req.flush({
    data: indicators,
    pagination: { ...mockPagination, total_count: indicators.length },
  } as PaginatedResponse<IndicatorModel>);
}

describe('mapIndicatorType', () => {
  it('should map "text" to "texte"', () => {
    expect(mapIndicatorType('text')).toBe('texte');
  });

  it('should map "number" to "nombre"', () => {
    expect(mapIndicatorType('number')).toBe('nombre');
  });

  it('should default to "texte" for unknown values', () => {
    expect(mapIndicatorType('unknown' as any)).toBe('texte');
  });
});

describe('inferPropertyType', () => {
  it('should return "nombre" for numbers', () => {
    expect(inferPropertyType(42)).toBe('nombre');
    expect(inferPropertyType(0)).toBe('nombre');
    expect(inferPropertyType(-3.14)).toBe('nombre');
  });

  it('should return "booleen" for booleans', () => {
    expect(inferPropertyType(true)).toBe('booleen');
    expect(inferPropertyType(false)).toBe('booleen');
  });

  it('should return "date" for ISO date strings', () => {
    expect(inferPropertyType('2026-01-15')).toBe('date');
    expect(inferPropertyType('2026-01-15T10:30:00Z')).toBe('date');
  });

  it('should return "texte" for non-date strings', () => {
    expect(inferPropertyType('hello')).toBe('texte');
    expect(inferPropertyType('')).toBe('texte');
  });

  it('should return "liste" for arrays', () => {
    expect(inferPropertyType([1, 2, 3])).toBe('liste');
    expect(inferPropertyType([])).toBe('liste');
  });

  it('should return "texte" for null/undefined/objects', () => {
    expect(inferPropertyType(null)).toBe('texte');
    expect(inferPropertyType(undefined)).toBe('texte');
    expect(inferPropertyType({ a: 1 })).toBe('texte');
  });
});

describe('VariableDictionaryService', () => {
  let service: VariableDictionaryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VariableDictionaryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should only include model-linked indicators as root-level (Indicateurs directs)', () => {
    const indicators: IndicatorModel[] = [
      makeIndicator({ id: 'im-1', technical_label: 'montant_ht', type: 'number' }),
      makeIndicator({ id: 'im-2', technical_label: 'commentaire', type: 'text' }),
      makeIndicator({ id: 'im-3', technical_label: 'score', type: 'number' }),
    ];

    const sig = service.getVariables('action', 'am-1');
    expect(sig()).toEqual([]);

    flushIndicators(httpTesting, indicators);

    // Only im-1 and im-3 are linked to this model
    httpTesting.expectOne(`${ACTION_MODELS_URL}am-1`).flush({
      id: 'am-1',
      name: 'Test Action Model',
      description: 'A test',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      funding_program_id: 'fp-1',
      action_theme_id: 'at-1',
      funding_program: { id: 'fp-1', name: 'FP' },
      action_theme: { id: 'at-1', name: 'AT' },
      indicator_models: [
        { id: 'im-1', name: 'Montant HT', type: 'number', visibility_rule: 'true', required_rule: 'false', editable_rule: 'true', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
        { id: 'im-3', name: 'Score', type: 'number', visibility_rule: 'true', required_rule: 'false', editable_rule: 'true', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      ],
    });

    const vars = sig();
    // Root-level indicators: only linked ones (im-1, im-3)
    const rootIndicators = vars.filter((v) => v.source === 'indicator' && v.group === '');
    expect(rootIndicators.length).toBe(2);
    expect(rootIndicators.map((v) => v.path)).toEqual(['montant_ht', 'score']);

    // Object-scoped indicators: ALL indicators (action.xxx)
    const objectIndicators = vars.filter((v) => v.source === 'indicator' && v.group === 'action');
    expect(objectIndicators.length).toBe(3);
    expect(objectIndicators.map((v) => v.path)).toEqual([
      'action.montant_ht', 'action.commentaire', 'action.score',
    ]);
  });

  it('should paginate indicator fetching across multiple pages', () => {
    const page1Indicators = [
      makeIndicator({ id: 'im-1', technical_label: 'score', type: 'number' }),
    ];
    const page2Indicators = [
      makeIndicator({ id: 'im-2', technical_label: 'label', type: 'text' }),
    ];

    const sig = service.getVariables('action', 'am-pag');

    // First page — has_next_page: true
    const req1 = httpTesting.expectOne(
      (r) => r.url === INDICATOR_MODELS_URL && r.params.get('limit') === '100' && !r.params.has('cursor'),
    );
    req1.flush({
      data: page1Indicators,
      pagination: {
        ...mockPagination,
        total_count: 2,
        has_next_page: true,
        cursors: { start_cursor: 'c0', end_cursor: 'c1' },
      },
    });

    // Second page — has_next_page: false
    const req2 = httpTesting.expectOne(
      (r) => r.url === INDICATOR_MODELS_URL && r.params.get('cursor') === 'c1',
    );
    req2.flush({
      data: page2Indicators,
      pagination: { ...mockPagination, total_count: 2 },
    });

    // Flush entity
    httpTesting.expectOne(`${ACTION_MODELS_URL}am-pag`).flush({
      id: 'am-pag', name: 'AM', description: null,
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      funding_program_id: 'fp-1', action_theme_id: 'at-1',
      funding_program: { id: 'fp-1', name: 'FP' }, action_theme: { id: 'at-1', name: 'AT' },
    });

    const vars = sig();
    // No indicator_models on entity → all indicators appear as root-level
    const rootIndicators = vars.filter((v) => v.source === 'indicator' && v.group === '');
    expect(rootIndicators.length).toBe(2);
    expect(rootIndicators.map((v) => v.path)).toEqual(['score', 'label']);

    // Object-scoped indicators also added
    const objectIndicators = vars.filter((v) => v.source === 'indicator' && v.group === 'action');
    expect(objectIndicators.length).toBe(2);
    expect(objectIndicators.map((v) => v.path)).toEqual(['action.score', 'action.label']);
  });

  it('should prefix entity properties with model type group', () => {
    const sig = service.getVariables('action', 'am-2');

    // Respond to indicator models
    flushIndicators(httpTesting, []);

    // Respond to action model with simple properties
    httpTesting.expectOne(`${ACTION_MODELS_URL}am-2`).flush({
      id: 'am-2',
      name: 'Model Name',
      description: 'Some description',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      funding_program_id: 'fp-1',
      action_theme_id: 'at-1',
      funding_program: { id: 'fp-1', name: 'FP' },
      action_theme: { id: 'at-1', name: 'AT' },
    });

    const vars = sig();
    const propVars = vars.filter((v) => v.source === 'property');

    // Should have 'action.name' and 'action.description' (others are skipped)
    const nameVar = propVars.find((v) => v.path === 'action.name');
    expect(nameVar).toBeDefined();
    expect(nameVar!.group).toBe('action');
    expect(nameVar!.type).toBe('texte');

    const descVar = propVars.find((v) => v.path === 'action.description');
    expect(descVar).toBeDefined();
    expect(descVar!.type).toBe('texte');
  });

  it('should prefix folder model properties with "folder" group', () => {
    const sig = service.getVariables('folder', 'fm-1');

    flushIndicators(httpTesting, []);

    httpTesting.expectOne(`${FOLDER_MODELS_URL}fm-1`).flush({
      id: 'fm-1',
      name: 'Folder Model',
      description: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      funding_programs: [],
    });

    const vars = sig();
    const propVars = vars.filter((v) => v.source === 'property');
    const nameVar = propVars.find((v) => v.path === 'folder.name');
    expect(nameVar).toBeDefined();
    expect(nameVar!.group).toBe('folder');
  });

  it('should add folder-scoped indicator variables for folder models', () => {
    const indicators: IndicatorModel[] = [
      makeIndicator({ id: 'im-1', technical_label: 'score', type: 'number' }),
      makeIndicator({ id: 'im-2', technical_label: 'label', type: 'text' }),
    ];

    const sig = service.getVariables('folder', 'fm-ind');

    flushIndicators(httpTesting, indicators);

    httpTesting.expectOne(`${FOLDER_MODELS_URL}fm-ind`).flush({
      id: 'fm-ind',
      name: 'Folder With Indicators',
      description: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      funding_programs: [],
    });

    const vars = sig();
    // Folder has no indicator_models field → all indicators appear as root-level
    const rootIndicators = vars.filter((v) => v.source === 'indicator' && v.group === '');
    expect(rootIndicators.length).toBe(2);

    // Object-scoped indicators (folder.xxx) also added
    const folderIndicators = vars.filter((v) => v.source === 'indicator' && v.group === 'folder');
    expect(folderIndicators.length).toBe(2);
    expect(folderIndicators.map((v) => v.path)).toEqual(['folder.score', 'folder.label']);
  });

  it('should return the same signal for the same modelType:modelId (caching)', () => {
    const sig1 = service.getVariables('action', 'am-cache');
    const sig2 = service.getVariables('action', 'am-cache');
    expect(sig1).toBe(sig2);

    // Only one set of HTTP requests should be made
    flushIndicators(httpTesting, []);
    httpTesting.expectOne(`${ACTION_MODELS_URL}am-cache`).flush({
      id: 'am-cache',
      name: 'Cached',
      description: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      funding_program_id: 'fp-1',
      action_theme_id: 'at-1',
      funding_program: { id: 'fp-1', name: 'FP' },
      action_theme: { id: 'at-1', name: 'AT' },
    });
  });

  it('should return different signals for different keys', () => {
    const sig1 = service.getVariables('action', 'am-1');
    const sig2 = service.getVariables('folder', 'fm-1');
    expect(sig1).not.toBe(sig2);

    // Flush both sets of requests
    const indicatorReqs = httpTesting.match(
      (req) => req.url === INDICATOR_MODELS_URL && req.params.get('limit') === '100',
    );
    expect(indicatorReqs.length).toBe(2);
    indicatorReqs.forEach((req) => req.flush({ data: [], pagination: mockPagination }));

    httpTesting.expectOne(`${ACTION_MODELS_URL}am-1`).flush({
      id: 'am-1', name: 'AM', description: null,
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      funding_program_id: 'fp-1', action_theme_id: 'at-1',
      funding_program: { id: 'fp-1', name: 'FP' }, action_theme: { id: 'at-1', name: 'AT' },
    });
    httpTesting.expectOne(`${FOLDER_MODELS_URL}fm-1`).flush({
      id: 'fm-1', name: 'FM', description: null,
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      funding_programs: [],
    });
  });

  it('should return empty array signal on API error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const sig = service.getVariables('action', 'am-err');

    // Fail the indicator request
    httpTesting.expectOne(
      (r) => r.url === INDICATOR_MODELS_URL && r.params.get('limit') === '100',
    ).flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    // Fail the action model request
    httpTesting.expectOne(`${ACTION_MODELS_URL}am-err`).flush(
      'Not Found',
      { status: 404, statusText: 'Not Found' },
    );

    // Should gracefully degrade to empty array
    expect(sig()).toEqual([]);

    consoleSpy.mockRestore();
  });
});
