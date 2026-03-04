import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AgentDomainStore } from './agent.store';
import { AgentRead } from './agent.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';

const mockAgent: AgentRead = {
  id: 'agent-1',
  unique_id: 'unique-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+33123456789',
  position: 'Advisor',
  agent_type: 'energy_performance_advisor',
  status: 'draft',
  community_id: 'comm-1',
  community: { id: 'comm-1', name: 'Test Community' },
  public_comment: null,
  internal_comment: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<AgentRead> = {
  data: [mockAgent],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'end-cursor' },
    _links: { self: '/agents/', next: null, prev: null, first: '/agents/' },
  },
};

describe('AgentDomainStore', () => {
  let store: InstanceType<typeof AgentDomainStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AgentDomainStore);
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

      const req = httpTesting.expectOne((r) => r.url.includes('agents') && r.method === 'GET');
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
      store.selectById('agent-1');

      expect(store.isLoadingDetail()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('agents/agent-1') && r.method === 'GET');
      req.flush(mockAgent);

      expect(store.selectedItem()).toEqual(mockAgent);
      expect(store.isLoadingDetail()).toBe(false);
    });

    it('should handle error on selectById and set detailError', () => {
      store.selectById('agent-bad');

      const req = httpTesting.expectOne((r) => r.url.includes('agents/agent-bad'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(store.selectedItem()).toBeNull();
      expect(store.isLoadingDetail()).toBe(false);
      expect(store.detailError()).toBeTruthy();
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedItem', () => {
      store.selectById('agent-1');
      httpTesting.expectOne((r) => r.url.includes('agent-1')).flush(mockAgent);

      expect(store.selectedItem()).not.toBeNull();

      store.clearSelection();
      expect(store.selectedItem()).toBeNull();
    });
  });

  describe('changeStatusMutation', () => {
    it('should send PUT with status body', async () => {
      const resultPromise = store.changeStatusMutation({ id: 'agent-1', status: 'completed' });

      const req = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('agents/agent-1'));
      expect(req.request.body).toEqual({ status: 'completed' });
      req.flush({ ...mockAgent, status: 'completed' });

      const result = await resultPromise;
      expect(result.status).toBe('success');
    });

    it('should handle error on status change', async () => {
      const resultPromise = store.changeStatusMutation({ id: 'agent-1', status: 'completed' });

      const req = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('agents/agent-1'));
      req.flush({ detail: 'Incomplete fields' }, { status: 422, statusText: 'Unprocessable Entity' });

      const result = await resultPromise;
      expect(result.status).toBe('error');
    });
  });
});
