import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { FundingProgramFacade } from './funding-program.facade';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@app/shared/services/toast.service';

const mockFundingProgram: FundingProgram = {
  id: 'fp-1',
  name: 'Test Program',
  description: 'A test program',
  budget: 10000,
  is_active: true,
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<FundingProgram> = {
  data: [mockFundingProgram],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/funding-programs/', next: null, prev: null, first: '/funding-programs/' },
  },
};

describe('FundingProgramFacade', () => {
  let facade: FundingProgramFacade;
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
    facade = TestBed.inject(FundingProgramFacade);
    httpTesting = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    successSpy = vi.spyOn(toastService, 'success');
    errorSpy = vi.spyOn(toastService, 'error');
    // Prevent unhandled router navigation rejections in tests
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('load', () => {
    it('should trigger domain store load and populate items', () => {
      facade.load();

      const req = httpTesting.expectOne((r) => r.url.includes('funding-programs') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Program');
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
        data: [{ ...mockFundingProgram, id: 'fp-2', name: 'Program 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('fp-1');

      const req = httpTesting.expectOne((r) => r.url.includes('funding-programs/fp-1'));
      req.flush(mockFundingProgram);

      expect(facade.selectedItem()).toEqual(mockFundingProgram);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({ name: 'New Program', is_active: true });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('funding-programs'));
      createReq.flush({ ...mockFundingProgram, id: 'fp-new', name: 'New Program' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Programme de financement créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('fp-1', { name: 'Updated Program', is_active: true });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('funding-programs/fp-1'));
      updateReq.flush({ ...mockFundingProgram, name: 'Updated Program' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Programme de financement mis à jour');

      // After success, it triggers a list refresh
      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('funding-programs'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('fp-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('funding-programs/fp-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Programme de financement supprimé');
    });
  });

  describe('cross-domain: loadAssociationData', () => {
    const mockFmResponse: PaginatedResponse<{ id: string; name: string }> = {
      data: [{ id: 'fm-1', name: 'Test FM' }],
      pagination: {
        total_count: 1, page_size: 20, has_next_page: false, has_previous_page: false,
        cursors: { start_cursor: null, end_cursor: null },
        _links: { self: '/', next: null, prev: null, first: '/' },
      },
    };

    it('should trigger FM domain store load and populate fmOptions', () => {
      facade.loadAssociationData();

      const fmReq = httpTesting.expectOne((r) => r.url.includes('folder-models') && r.method === 'GET');
      fmReq.flush(mockFmResponse);

      expect(facade.fmOptions().length).toBe(1);
      expect(facade.fmOptions()[0]).toEqual({ id: 'fm-1', label: 'Test FM' });
    });

    it('should expose fmOptions as empty initially', () => {
      expect(facade.fmOptions()).toEqual([]);
      expect(facade.fmLoading()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({ name: 'Bad', is_active: true });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });
});
