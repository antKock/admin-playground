import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BuildingDomainStore } from './building.store';
import { Building } from './building.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';

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
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'end-cursor' },
    _links: { self: '/buildings/', next: null, prev: null, first: '/buildings/' },
  },
};

describe('BuildingDomainStore', () => {
  let store: InstanceType<typeof BuildingDomainStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(BuildingDomainStore);
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

      const req = httpTesting.expectOne((r) => r.url.includes('buildings') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(store.items().length).toBe(1);
      expect(store.hasMore()).toBe(false);
      expect(store.isLoading()).toBe(false);
    });

    it('should pass site_id filter', () => {
      store.load({ site_id: 'site-1' });

      const req = httpTesting.expectOne((r) => r.method === 'GET' && r.params.get('site_id') === 'site-1');
      req.flush(mockPaginatedResponse);

      expect(store.items().length).toBe(1);
    });
  });

  describe('selectById', () => {
    it('should load item and set selectedItem', () => {
      store.selectById('bldg-1');

      expect(store.isLoadingDetail()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('buildings/bldg-1') && r.method === 'GET');
      req.flush(mockBuilding);

      expect(store.selectedItem()).toEqual(mockBuilding);
      expect(store.isLoadingDetail()).toBe(false);
    });

    it('should handle error on selectById and set detailError', () => {
      store.selectById('bldg-bad');

      const req = httpTesting.expectOne((r) => r.url.includes('buildings/bldg-bad'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(store.selectedItem()).toBeNull();
      expect(store.isLoadingDetail()).toBe(false);
      expect(store.detailError()).toBeTruthy();
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedItem', () => {
      store.selectById('bldg-1');
      httpTesting.expectOne((r) => r.url.includes('bldg-1')).flush(mockBuilding);

      expect(store.selectedItem()).not.toBeNull();

      store.clearSelection();
      expect(store.selectedItem()).toBeNull();
    });
  });

  describe('addRnbMutation', () => {
    it('should send POST to /buildings/{id}/rnbs with rnb_id query param', async () => {
      const promise = store.addRnbMutation({ buildingId: 'bldg-1', rnbId: 'RNB-002' });

      const req = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('buildings/bldg-1/rnbs'));
      expect(req.request.url).toContain('rnb_id=RNB-002');
      req.flush({});

      const result = await promise;
      expect(result.status).toBe('success');
    });
  });

  describe('removeRnbMutation', () => {
    it('should send DELETE to /buildings/{id}/rnbs/{rnb_id}', async () => {
      const promise = store.removeRnbMutation({ buildingId: 'bldg-1', rnbId: 'RNB-001' });

      const req = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('buildings/bldg-1/rnbs/RNB-001'));
      req.flush(null);

      const result = await promise;
      expect(result.status).toBe('success');
    });
  });
});
