import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ActionModelDomainStore } from './action-model.store';
import { ActionModel } from './action-model.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';

const mockActionModel: ActionModel = {
  id: 'am-1',
  name: 'Test Action Model',
  description: 'A test action model',
  funding_program_id: 'fp-1',
  action_theme_id: 'at-1',
  funding_program: {
    id: 'fp-1',
    name: 'Test FP',
    description: null,
    budget: null,
    is_active: true,
    start_date: null,
    end_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  action_theme: {
    id: 'at-1',
    name: 'Test AT',
    technical_label: 'test-at',
    unique_id: 'test-at',
    description: null,
    status: 'published',
    icon: null,
    color: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<ActionModel> = {
  data: [mockActionModel],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'end-cursor' },
    _links: { self: '/action-models/', next: null, prev: null, first: '/action-models/' },
  },
};

describe('ActionModelDomainStore', () => {
  let store: InstanceType<typeof ActionModelDomainStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ActionModelDomainStore);
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

      const req = httpTesting.expectOne((r) => r.url.includes('action-models') && r.method === 'GET');
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
      store.selectById('am-1');

      expect(store.isLoadingDetail()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('action-models/am-1') && r.method === 'GET');
      req.flush(mockActionModel);

      expect(store.selectedItem()).toEqual(mockActionModel);
      expect(store.isLoadingDetail()).toBe(false);
    });

    it('should handle error on selectById', () => {
      store.selectById('am-bad');

      const req = httpTesting.expectOne((r) => r.url.includes('action-models/am-bad'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(store.selectedItem()).toBeNull();
      expect(store.isLoadingDetail()).toBe(false);
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedItem', () => {
      store.selectById('am-1');
      httpTesting.expectOne((r) => r.url.includes('am-1')).flush(mockActionModel);

      expect(store.selectedItem()).not.toBeNull();

      store.clearSelection();
      expect(store.selectedItem()).toBeNull();
    });
  });
});
