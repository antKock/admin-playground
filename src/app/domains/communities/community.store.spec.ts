import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CommunityDomainStore } from './community.store';
import { CommunityRead } from './community.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';

const mockCommunity: CommunityRead = {
  id: 'comm-1',
  siret: '12345678901234',
  name: 'Test Community',
  public_comment: 'A test community',
  internal_comment: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<CommunityRead> = {
  data: [mockCommunity],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'end-cursor' },
    _links: { self: '/communities/', next: null, prev: null, first: '/communities/' },
  },
};

describe('CommunityDomainStore', () => {
  let store: InstanceType<typeof CommunityDomainStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(CommunityDomainStore);
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

      const req = httpTesting.expectOne((r) => r.url.includes('communities') && r.method === 'GET');
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
      store.selectById('comm-1');

      expect(store.isLoadingDetail()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('communities/comm-1') && r.method === 'GET');
      req.flush(mockCommunity);

      expect(store.selectedItem()).toEqual(mockCommunity);
      expect(store.isLoadingDetail()).toBe(false);
    });

    it('should handle error on selectById and set detailError', () => {
      store.selectById('comm-bad');

      const req = httpTesting.expectOne((r) => r.url.includes('communities/comm-bad'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(store.selectedItem()).toBeNull();
      expect(store.isLoadingDetail()).toBe(false);
      expect(store.detailError()).toBeTruthy();
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedItem', () => {
      store.selectById('comm-1');
      httpTesting.expectOne((r) => r.url.includes('comm-1')).flush(mockCommunity);

      expect(store.selectedItem()).not.toBeNull();

      store.clearSelection();
      expect(store.selectedItem()).toBeNull();
    });
  });
});
