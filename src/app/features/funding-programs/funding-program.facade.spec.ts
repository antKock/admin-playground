import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { FundingProgramFacade } from './funding-program.facade';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';

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
    it('should trigger mutation and refresh list on success', async () => {
      const createPromise = facade.create({ name: 'New Program', is_active: true });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('funding-programs'));
      createReq.flush({ ...mockFundingProgram, id: 'fp-new', name: 'New Program' });

      await createPromise;

      // After success, it triggers a list refresh
      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('funding-programs'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('update', () => {
    it('should trigger mutation on update', async () => {
      const updatePromise = facade.update('fp-1', { name: 'Updated Program', is_active: true });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('funding-programs/fp-1'));
      updateReq.flush({ ...mockFundingProgram, name: 'Updated Program' });

      await updatePromise;
    });
  });

  describe('delete', () => {
    it('should trigger mutation and refresh list on success', async () => {
      const deletePromise = facade.delete('fp-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('funding-programs/fp-1'));
      deleteReq.flush(null);

      await deletePromise;

      // After success, it triggers a list refresh
      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('funding-programs'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({ name: 'Bad', is_active: true });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
    });
  });
});
