import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ActionThemeDomainStore } from './action-theme.store';
import { ActionTheme } from './action-theme.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';

const mockActionTheme: ActionTheme = {
  id: 'at-1',
  unique_id: 'at-unique-1',
  name: 'Test Theme',
  technical_label: 'test_theme',
  description: 'A test theme',
  icon: null,
  color: null,
  status: 'draft',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<ActionTheme> = {
  data: [mockActionTheme],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'end-cursor' },
    _links: { self: '/action-themes/', next: null, prev: null, first: '/action-themes/' },
  },
};

describe('ActionThemeDomainStore', () => {
  let store: InstanceType<typeof ActionThemeDomainStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ActionThemeDomainStore);
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

      const req = httpTesting.expectOne((r) => r.url.includes('action-themes') && r.method === 'GET');
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
      store.selectById('at-1');

      expect(store.isLoadingDetail()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('action-themes/at-1') && r.method === 'GET');
      req.flush(mockActionTheme);

      expect(store.selectedItem()).toEqual(mockActionTheme);
      expect(store.isLoadingDetail()).toBe(false);
    });

    it('should handle error on selectById and set detailError', () => {
      store.selectById('at-bad');

      const req = httpTesting.expectOne((r) => r.url.includes('action-themes/at-bad'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(store.selectedItem()).toBeNull();
      expect(store.isLoadingDetail()).toBe(false);
      expect(store.detailError()).toBeTruthy();
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedItem', () => {
      store.selectById('at-1');
      httpTesting.expectOne((r) => r.url.includes('at-1')).flush(mockActionTheme);

      expect(store.selectedItem()).not.toBeNull();

      store.clearSelection();
      expect(store.selectedItem()).toBeNull();
    });
  });
});
