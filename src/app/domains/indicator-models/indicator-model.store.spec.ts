import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { IndicatorModelDomainStore } from './indicator-model.store';
import { IndicatorModel } from './indicator-model.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';

const mockIndicatorModel: IndicatorModel = {
  id: 'im-1',
  name: 'Test Indicator',
  technical_label: 'test_indicator',
  description: 'A test indicator model',
  type: 'number',
  unit: 'kg',
  status: 'draft',
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<IndicatorModel> = {
  data: [mockIndicatorModel],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'end-cursor' },
    _links: { self: '/indicator-models/', next: null, prev: null, first: '/indicator-models/' },
  },
};

describe('IndicatorModelDomainStore', () => {
  let store: InstanceType<typeof IndicatorModelDomainStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(IndicatorModelDomainStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should have initial state', () => {
    expect(store.items()).toEqual([]);
    expect(store.hasMore()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.selectedItem()).toBeNull();
  });

  describe('withCursorPagination composition', () => {
    it('should load items and set hasMore', () => {
      store.load(undefined);

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(store.items().length).toBe(1);
      expect(store.hasMore()).toBe(false);
      expect(store.isLoading()).toBe(false);
    });

    it('should load with cursor for pagination', () => {
      const responseWithMore = {
        ...mockPaginatedResponse,
        pagination: {
          ...mockPaginatedResponse.pagination,
          has_next_page: true,
          cursors: { start_cursor: 'start', end_cursor: 'next-cursor' },
        },
      };

      store.load(undefined);
      httpTesting.expectOne((r) => r.method === 'GET').flush(responseWithMore);

      expect(store.hasMore()).toBe(true);
      expect(store.cursor()).toBe('next-cursor');
    });
  });

  describe('selectById', () => {
    it('should load item and set selectedItem', () => {
      store.selectById('im-1');

      expect(store.isLoadingDetail()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models/im-1') && r.method === 'GET');
      req.flush(mockIndicatorModel);

      expect(store.selectedItem()).toEqual(mockIndicatorModel);
      expect(store.isLoadingDetail()).toBe(false);
    });

    it('should handle error on selectById and set detailError', () => {
      store.selectById('im-bad');

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models/im-bad'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(store.selectedItem()).toBeNull();
      expect(store.isLoadingDetail()).toBe(false);
      expect(store.detailError()).toBeTruthy();
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedItem', () => {
      store.selectById('im-1');
      httpTesting.expectOne((r) => r.url.includes('im-1')).flush(mockIndicatorModel);

      expect(store.selectedItem()).not.toBeNull();

      store.clearSelection();
      expect(store.selectedItem()).toBeNull();
    });
  });

  describe('mutations', () => {
    it('should send POST for createMutation', async () => {
      const createData = { name: 'New IM', technical_label: 'new_im', type: 'text' as const, status: 'draft' as const };
      const resultPromise = store.createMutation(createData);

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models') && r.method === 'POST');
      expect(req.request.body).toEqual(createData);
      req.flush(mockIndicatorModel);

      const result = await resultPromise;
      expect(result.status).toBe('success');
    });

    it('should send PUT for updateMutation', async () => {
      const updateData = { name: 'Updated IM' };
      const resultPromise = store.updateMutation({ id: 'im-1', data: updateData });

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models/im-1') && r.method === 'PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockIndicatorModel);

      const result = await resultPromise;
      expect(result.status).toBe('success');
    });

    it('should send DELETE for deleteMutation', async () => {
      const resultPromise = store.deleteMutation('im-1');

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models/im-1') && r.method === 'DELETE');
      req.flush(null);

      const result = await resultPromise;
      expect(result.status).toBe('success');
    });

    it('should return error status on mutation failure', async () => {
      const resultPromise = store.createMutation({ name: 'Bad', technical_label: 'bad', type: 'text' as const, status: 'draft' });

      const req = httpTesting.expectOne((r) => r.method === 'POST');
      req.flush({ detail: 'Validation error' }, { status: 422, statusText: 'Unprocessable Entity' });

      const result = await resultPromise;
      expect(result.status).toBe('error');
    });

    it('should send PUT for publishMutation', async () => {
      const resultPromise = store.publishMutation('im-1');

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models/im-1/publish') && r.method === 'PUT');
      expect(req.request.body).toEqual({});
      req.flush({ ...mockIndicatorModel, status: 'published' });

      const result = await resultPromise;
      expect(result.status).toBe('success');
    });

    it('should send PUT for disableMutation', async () => {
      const resultPromise = store.disableMutation('im-1');

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models/im-1/disable') && r.method === 'PUT');
      expect(req.request.body).toEqual({});
      req.flush({ ...mockIndicatorModel, status: 'disabled' });

      const result = await resultPromise;
      expect(result.status).toBe('success');
    });

    it('should send PUT for activateMutation', async () => {
      const resultPromise = store.activateMutation('im-1');

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models/im-1/activate') && r.method === 'PUT');
      expect(req.request.body).toEqual({});
      req.flush({ ...mockIndicatorModel, status: 'published' });

      const result = await resultPromise;
      expect(result.status).toBe('success');
    });
  });

  describe('loadUsage', () => {
    it('should load action models referencing this indicator', () => {
      store.loadUsage('im-1');

      expect(store.isLoadingUsage()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('action-models') && r.method === 'GET');
      expect(req.request.params.get('indicator_model_id')).toBe('im-1');
      req.flush({
        data: [
          {
            id: 'am-1', name: 'Action Model 1', description: null,
            funding_program_id: 'fp-1', action_theme_id: 'at-1',
            funding_program: { id: 'fp-1', name: 'FP', description: null, budget: null, is_active: true, start_date: null, end_date: null, created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z' },
            action_theme: { id: 'at-1', name: 'AT', technical_label: 'at', unique_id: 'at', description: null, status: 'published', icon: null, color: null, created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z' },
            indicator_models: [{ id: 'im-1', name: 'Test', technical_label: 'test', type: 'number', unit: 'kg' }],
            created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        pagination: mockPaginatedResponse.pagination,
      });

      expect(store.isLoadingUsage()).toBe(false);
      expect(store.usedInActionModels().length).toBe(1);
      expect(store.usedInActionModels()[0].name).toBe('Action Model 1');
    });

    it('should return empty array when no action models reference the indicator', () => {
      store.loadUsage('im-unknown');

      const req = httpTesting.expectOne((r) => r.url.includes('action-models'));
      req.flush({
        data: [],
        pagination: { ...mockPaginatedResponse.pagination, total_count: 0 },
      });

      expect(store.usedInActionModels()).toEqual([]);
    });
  });
});
