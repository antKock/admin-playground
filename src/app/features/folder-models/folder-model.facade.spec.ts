import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { FolderModelFacade } from './folder-model.facade';
import { FolderModel } from '@domains/folder-models/folder-model.models';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@shared/components/toast/toast.service';

const mockFolderModel: FolderModel = {
  id: 'fm-1',
  name: 'Test Folder Model',
  description: 'A test folder model',
  funding_programs: [
    {
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
  ],
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<FolderModel> = {
  data: [mockFolderModel],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/folder-models/', next: null, prev: null, first: '/folder-models/' },
  },
};

describe('FolderModelFacade', () => {
  let facade: FolderModelFacade;
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
    facade = TestBed.inject(FolderModelFacade);
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

      const req = httpTesting.expectOne((r) => r.url.includes('folder-models') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Folder Model');
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
        data: [{ ...mockFolderModel, id: 'fm-2', name: 'Model 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('fm-1');

      const req = httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1'));
      req.flush(mockFolderModel);

      expect(facade.selectedItem()).toEqual(mockFolderModel);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({
        name: 'New Model',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('folder-models'));
      createReq.flush({ ...mockFolderModel, id: 'fm-new', name: 'New Model' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle de dossier créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('fm-1', { name: 'Updated Model' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('folder-models/fm-1'));
      updateReq.flush({ ...mockFolderModel, name: 'Updated Model' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle de dossier mis à jour');

      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('folder-models'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('fm-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('folder-models/fm-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle de dossier supprimé');
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({
        name: 'Bad',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
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

    it('should trigger FP domain store load', () => {
      facade.loadAssociationData();

      const fpReq = httpTesting.expectOne((r) => r.url.includes('funding-programs') && r.method === 'GET');
      fpReq.flush(mockFpResponse);

      expect(facade.fpOptions().length).toBe(1);
      expect(facade.fpOptions()[0].label).toBe('Test FP');
    });

    it('should expose fpOptions signal with id/label shape', () => {
      expect(facade.fpOptions()).toEqual([]);
    });
  });
});
