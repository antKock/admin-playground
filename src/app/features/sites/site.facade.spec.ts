import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { SiteFacade } from './site.facade';
import { Site } from '@domains/site/site.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@shared/components/toast/toast.service';

const mockSite: Site = {
  id: 'site-1',
  unique_id: 'site-unique-1',
  name: 'Test Site',
  siren: '123456789',
  usage: 'Bureau',
  external_id: null,
  community_id: 'comm-1',
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
  last_updated_by_id: null,
};

const mockPaginatedResponse: PaginatedResponse<Site> = {
  data: [mockSite],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/sites/', next: null, prev: null, first: '/sites/' },
  },
};

describe('SiteFacade', () => {
  let facade: SiteFacade;
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
    facade = TestBed.inject(SiteFacade);
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

      const req = httpTesting.expectOne((r) => r.url.includes('sites') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Site');
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
        data: [{ ...mockSite, id: 'site-2', name: 'Site 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('site-1');

      const req = httpTesting.expectOne((r) => r.url.includes('sites/site-1'));
      req.flush(mockSite);

      expect(facade.selectedItem()).toEqual(mockSite);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({ name: 'New Site', siren: '987654321', community_id: 'comm-1' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('sites'));
      createReq.flush({ ...mockSite, id: 'site-new', name: 'New Site' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Site créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('site-1', { name: 'Updated Site' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('sites/site-1'));
      updateReq.flush({ ...mockSite, name: 'Updated Site' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Site mis à jour');

      // After success, it triggers a list refresh
      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('sites'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('site-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('sites/site-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Site supprimé');
    });
  });

  describe('loadBuildings', () => {
    it('should trigger domain store loadBuildings and expose buildings signal', () => {
      facade.loadBuildings('site-1');

      const req = httpTesting.expectOne((r) => r.url.includes('sites/site-1/buildings') && r.method === 'GET');
      req.flush({
        data: [{ id: 'bldg-1', name: 'Building A', usage: 'Logement', external_id: null, site_id: 'site-1', unique_id: 'u1', rnb_ids: [], created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z', last_updated_by_id: null }],
        pagination: { total_count: 1, page_size: 100, has_next_page: false, has_previous_page: false, cursors: { start_cursor: 's', end_cursor: 'e' }, _links: { self: '', next: null, prev: null, first: '' } },
      });

      expect(facade.buildings().length).toBe(1);
      expect(facade.buildings()[0].name).toBe('Building A');
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({ name: 'Bad', siren: '123456789', community_id: 'comm-1' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });
});
