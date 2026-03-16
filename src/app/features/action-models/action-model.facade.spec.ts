import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { ActionModelFacade } from './action-model.facade';
import { ActionModel } from '@domains/action-models/action-model.models';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@app/shared/services/toast.service';

const mockActionModel: ActionModel = {
  id: 'am-1',
  name: 'Test Action Model',
  description: 'A test action model',
  status: 'draft',
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
    last_updated_at: '2026-01-01T00:00:00Z',
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
    last_updated_at: '2026-01-01T00:00:00Z',
  },
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<ActionModel> = {
  data: [mockActionModel],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/action-models/', next: null, prev: null, first: '/action-models/' },
  },
};

describe('ActionModelFacade', () => {
  let facade: ActionModelFacade;
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
    facade = TestBed.inject(ActionModelFacade);
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

      const req = httpTesting.expectOne((r) => r.url.includes('action-models') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Action Model');
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
        data: [{ ...mockActionModel, id: 'am-2', name: 'Model 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('am-1');

      const req = httpTesting.expectOne((r) => r.url.includes('action-models/am-1'));
      req.flush(mockActionModel);

      expect(facade.selectedItem()).toEqual(mockActionModel);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({
        name: 'New Model',
        status: 'draft',
        funding_program_id: 'fp-1',
        action_theme_id: 'at-1',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('action-models'));
      createReq.flush({ ...mockActionModel, id: 'am-new', name: 'New Model' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('am-1', { name: 'Updated Model' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1'));
      updateReq.flush({ ...mockActionModel, name: 'Updated Model' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action mis à jour');

      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('am-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('action-models/am-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action supprimé');
    });
  });

  describe('publish', () => {
    it('should trigger publish mutation, show toast, and reload detail on success', async () => {
      const publishPromise = facade.publish('am-1');

      const publishReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1/publish'));
      publishReq.flush({ ...mockActionModel, status: 'published' });

      await publishPromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action publié');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush({ ...mockActionModel, status: 'published' });
    });
  });

  describe('disable', () => {
    it('should trigger disable mutation, show toast, and reload detail on success', async () => {
      const disablePromise = facade.disable('am-1');

      const disableReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1/disable'));
      disableReq.flush({ ...mockActionModel, status: 'disabled' });

      await disablePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action désactivé');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush({ ...mockActionModel, status: 'disabled' });
    });
  });

  describe('activate', () => {
    it('should trigger activate mutation, show toast, and reload detail on success', async () => {
      const activatePromise = facade.activate('am-1');

      const activateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1/activate'));
      activateReq.flush({ ...mockActionModel, status: 'published' });

      await activatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action activé');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush({ ...mockActionModel, status: 'published' });
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({
        name: 'Bad',
        status: 'draft',
        funding_program_id: 'fp-1',
        action_theme_id: 'at-1',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });

    it('should show error toast on publish error', async () => {
      const publishPromise = facade.publish('am-1');

      const req = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1/publish'));
      req.flush({ detail: 'Cannot publish' }, { status: 422, statusText: 'Unprocessable Entity' });

      await publishPromise;

      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });

  describe('cross-domain: loadAssociationData', () => {
    const mockFpResponse: PaginatedResponse<FundingProgram> = {
      data: [{
        id: 'fp-1', name: 'Test FP', description: null, budget: null,
        is_active: true, start_date: null, end_date: null,
        created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z',
      }],
      pagination: {
        total_count: 1, page_size: 20, has_next_page: false, has_previous_page: false,
        cursors: { start_cursor: null, end_cursor: null },
        _links: { self: '/', next: null, prev: null, first: '/' },
      },
    };

    it('should trigger FP and AT domain store loads', () => {
      facade.loadAssociationData();

      const fpReq = httpTesting.expectOne((r) => r.url.includes('funding-programs') && r.method === 'GET');
      const atReq = httpTesting.expectOne((r) => r.url.includes('action-themes') && r.method === 'GET');

      fpReq.flush(mockFpResponse);
      atReq.flush({ ...mockFpResponse, data: [] });

      expect(facade.fpOptions().length).toBe(1);
      expect(facade.fpOptions()[0].name).toBe('Test FP');
    });

    it('should expose fpOptions and atOptions signals', () => {
      expect(facade.fpOptions()).toEqual([]);
      expect(facade.atOptions()).toEqual([]);
    });
  });
});
