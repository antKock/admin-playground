import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { BuildingFacade } from './building.facade';
import { Building } from '@domains/building/building.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@shared/components/toast/toast.service';

const mockBuilding: Building = {
  id: 'bldg-1',
  unique_id: 'bldg-unique-1',
  name: 'Building A',
  usage: 'Logement',
  external_id: null,
  site_id: 'site-1',
  rnb_ids: ['RNB-001'],
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
  last_updated_by_id: null,
};

const mockPaginatedResponse: PaginatedResponse<Building> = {
  data: [mockBuilding],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/buildings/', next: null, prev: null, first: '/buildings/' },
  },
};

describe('BuildingFacade', () => {
  let facade: BuildingFacade;
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
    facade = TestBed.inject(BuildingFacade);
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

      const req = httpTesting.expectOne((r) => r.url.includes('buildings') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Building A');
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
        data: [{ ...mockBuilding, id: 'bldg-2', name: 'Building B' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('bldg-1');

      const req = httpTesting.expectOne((r) => r.url.includes('buildings/bldg-1'));
      req.flush(mockBuilding);

      expect(facade.selectedItem()).toEqual(mockBuilding);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({ name: 'New Building', site_id: 'site-1' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('buildings'));
      createReq.flush({ ...mockBuilding, id: 'bldg-new', name: 'New Building' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Bâtiment créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('bldg-1', { name: 'Updated Building' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('buildings/bldg-1'));
      updateReq.flush({ ...mockBuilding, name: 'Updated Building' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Bâtiment mis à jour');

      // After success, it triggers a list refresh
      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('buildings'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('bldg-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('buildings/bldg-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Bâtiment supprimé');
    });
  });

  describe('addRnb', () => {
    it('should add RNB, show toast, and reload detail', async () => {
      const addPromise = facade.addRnb('bldg-1', 'RNB-002');

      const addReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('buildings/bldg-1/rnbs'));
      addReq.flush({});

      await addPromise;

      expect(successSpy).toHaveBeenCalledWith('RNB ajouté');

      // After success, it reloads the detail
      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('buildings/bldg-1'));
      detailReq.flush({ ...mockBuilding, rnb_ids: ['RNB-001', 'RNB-002'] });
    });
  });

  describe('removeRnb', () => {
    it('should remove RNB, show toast, and reload detail', async () => {
      const removePromise = facade.removeRnb('bldg-1', 'RNB-001');

      const removeReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('buildings/bldg-1/rnbs/RNB-001'));
      removeReq.flush(null);

      await removePromise;

      expect(successSpy).toHaveBeenCalledWith('RNB supprimé');

      // After success, it reloads the detail
      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('buildings/bldg-1'));
      detailReq.flush({ ...mockBuilding, rnb_ids: [] });
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({ name: 'Bad', site_id: 'site-1' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });
});
