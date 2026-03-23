import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ActivityFeedFacade } from './activity-feed.facade';
import { ActivityResponse } from '@domains/history/history.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { AuthStore } from '@domains/auth/auth.store';

const mockAdminActivity: ActivityResponse = {
  id: 'act-1',
  user_id: 'user-1',
  user_name: 'Alice Admin',
  action: 'create',
  entity_type: 'FundingProgram',
  entity_id: 'fp-1',
  entity_display_name: 'Programme Test',
  description: 'Création de Programme Test',
  changes_summary: null,
  parent_entity_type: null,
  parent_entity_id: null,
  parent_entity_name: null,
  created_at: '2026-01-15T10:00:00Z',
};

const mockUserActivity: ActivityResponse = {
  id: 'act-2',
  user_id: 'user-2',
  user_name: 'Bob User',
  action: 'update',
  entity_type: 'Action',
  entity_id: 'action-1',
  entity_display_name: 'Action Test',
  description: 'Modification de Action Test',
  changes_summary: null,
  parent_entity_type: null,
  parent_entity_id: null,
  parent_entity_name: null,
  created_at: '2026-01-15T09:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<ActivityResponse> = {
  data: [mockAdminActivity, mockUserActivity],
  pagination: {
    total_count: 2,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/history/activities', next: null, prev: null, first: '/history/activities' },
  },
};

describe('ActivityFeedFacade', () => {
  let facade: ActivityFeedFacade;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    facade = TestBed.inject(ActivityFeedFacade);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('load', () => {
    it('should trigger global history store and populate activities', () => {
      facade.load();

      const req = httpTesting.expectOne((r) => r.url.includes('history/activities') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.activities().length).toBe(2);
      expect(facade.activities()[0].entity_type).toBe('FundingProgram');
    });
  });

  describe('loadMore', () => {
    it('should append activities to existing list', () => {
      facade.load();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      expect(facade.hasMore()).toBe(true);

      facade.loadMore();

      const moreResponse: PaginatedResponse<ActivityResponse> = {
        data: [{ ...mockAdminActivity, id: 'act-3', entity_display_name: 'Programme 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.activities().length).toBe(3);
    });
  });

  describe('scope', () => {
    it('should default to admin', () => {
      expect(facade.scope()).toBe('admin');
    });
  });

  describe('hideOwnActions', () => {
    it('should default to false', () => {
      expect(facade.hideOwnActions()).toBe(false);
    });
  });

  describe('filteredActivities', () => {
    it('should filter activities by admin scope', () => {
      facade.load();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      facade.scope.set('admin');

      // FundingProgram is admin scope, Action is user scope
      const filtered = facade.filteredActivities();
      expect(filtered.length).toBe(1);
      expect(filtered[0].entity_type).toBe('FundingProgram');
    });

    it('should filter activities by user scope', () => {
      facade.load();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      facade.scope.set('user');

      const filtered = facade.filteredActivities();
      expect(filtered.length).toBe(1);
      expect(filtered[0].entity_type).toBe('Action');
    });

    it('should filter own actions when hideOwnActions is true', () => {
      const authStore = TestBed.inject(AuthStore);
      vi.spyOn(authStore, 'userId').mockReturnValue('user-1');

      facade.load();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      facade.scope.set('admin');
      facade.hideOwnActions.set(true);

      const filtered = facade.filteredActivities();
      // mockAdminActivity has user_id 'user-1' which matches => filtered out
      expect(filtered.length).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      facade.load();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      expect(facade.activities().length).toBe(2);

      facade.reset();

      expect(facade.activities().length).toBe(0);
      expect(facade.hasMore()).toBe(false);
      expect(facade.isLoading()).toBe(false);
    });
  });
});
