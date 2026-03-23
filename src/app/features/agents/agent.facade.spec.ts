import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { AgentFacade } from './agent.facade';
import { AgentRead } from '@domains/agents/agent.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@shared/components/toast/toast.service';

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
  last_updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<AgentRead> = {
  data: [mockAgent],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/agents/', next: null, prev: null, first: '/agents/' },
  },
};

describe('AgentFacade', () => {
  let facade: AgentFacade;
  let httpTesting: HttpTestingController;
  let toastService: ToastService;
  let successSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    facade = TestBed.inject(AgentFacade);
    httpTesting = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    successSpy = vi.spyOn(toastService, 'success');
    errorSpy = vi.spyOn(toastService, 'error');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('load', () => {
    it('should trigger domain store load and populate items', () => {
      facade.load();

      const req = httpTesting.expectOne((r) => r.url.includes('agents') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].first_name).toBe('John');
    });
  });

  describe('loadMore', () => {
    it('should trigger domain store loadMore', () => {
      facade.load();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      expect(facade.hasMore()).toBe(true);

      facade.loadMore();

      const moreResponse = {
        ...mockPaginatedResponse,
        data: [{ ...mockAgent, id: 'agent-2', first_name: 'Jane' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('agent-1');

      const req = httpTesting.expectOne((r) => r.url.includes('agents/agent-1'));
      req.flush(mockAgent);

      expect(facade.selectedItem()).toEqual(mockAgent);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({ agent_type: 'energy_performance_advisor' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('agents'));
      createReq.flush({ ...mockAgent, id: 'agent-new' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Agent créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('agent-1', { first_name: 'Updated' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('agents/agent-1'));
      updateReq.flush({ ...mockAgent, first_name: 'Updated' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Agent mis à jour');

      // After success, it triggers a list refresh
      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('agents'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('agent-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('agents/agent-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Agent supprimé');
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({ agent_type: 'other' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });

  describe('loadAssociationData', () => {
    it('should load communities for selector', () => {
      facade.loadAssociationData();

      const req = httpTesting.expectOne((r) => r.url.includes('communities') && r.method === 'GET');
      req.flush({
        data: [{ id: 'comm-1', name: 'Community 1', siret: '12345678901234', created_at: '', last_updated_at: '' }],
        pagination: {
          total_count: 1, page_size: 20, has_next_page: false, has_previous_page: false,
          cursors: { start_cursor: null, end_cursor: null },
          _links: { self: '/', next: null, prev: null, first: '/' },
        },
      });

      expect(facade.communityOptions().length).toBe(1);
      expect(facade.communityOptions()[0].label).toBe('Community 1');
    });
  });

  describe('changeStatus', () => {
    it('should change status, show toast, and reload detail on success', async () => {
      const changePromise = facade.changeStatus('agent-1', 'completed');

      const statusReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('agents/agent-1'));
      expect(statusReq.request.body).toEqual({ status: 'completed' });
      statusReq.flush({ ...mockAgent, status: 'completed' });

      await changePromise;

      expect(successSpy).toHaveBeenCalledWith('Statut de l\'agent changé en completed');

      // After success, it reloads the detail
      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('agents/agent-1'));
      detailReq.flush({ ...mockAgent, status: 'completed' });
    });

    it('should show error toast on status change failure', async () => {
      const changePromise = facade.changeStatus('agent-1', 'completed');

      const statusReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('agents/agent-1'));
      statusReq.flush({ detail: 'Incomplete fields' }, { status: 422, statusText: 'Unprocessable Entity' });

      await changePromise;

      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });
});
