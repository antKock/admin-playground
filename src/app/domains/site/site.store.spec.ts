import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SiteDomainStore } from './site.store';
import { Site, Building } from './site.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';

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

const mockPaginatedResponse: PaginatedResponse<Site> = {
  data: [mockSite],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'end-cursor' },
    _links: { self: '/sites/', next: null, prev: null, first: '/sites/' },
  },
};

const mockBuildingsPaginated: PaginatedResponse<Building> = {
  data: [mockBuilding],
  pagination: {
    total_count: 1,
    page_size: 100,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'end' },
    _links: { self: '/sites/site-1/buildings', next: null, prev: null, first: '/sites/site-1/buildings' },
  },
};

describe('SiteDomainStore', () => {
  let store: InstanceType<typeof SiteDomainStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(SiteDomainStore);
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
    expect(store.buildings()).toEqual([]);
  });

  describe('withCursorPagination composition', () => {
    it('should load items and set hasMore', () => {
      store.load(undefined);

      const req = httpTesting.expectOne((r) => r.url.includes('sites') && r.method === 'GET');
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

    it('should pass community_id filter', () => {
      store.load({ community_id: 'comm-1' });

      const req = httpTesting.expectOne((r) => r.method === 'GET' && r.params.get('community_id') === 'comm-1');
      req.flush(mockPaginatedResponse);

      expect(store.items().length).toBe(1);
    });
  });

  describe('selectById', () => {
    it('should load item and set selectedItem', () => {
      store.selectById('site-1');

      expect(store.isLoadingDetail()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('sites/site-1') && r.method === 'GET');
      req.flush(mockSite);

      expect(store.selectedItem()).toEqual(mockSite);
      expect(store.isLoadingDetail()).toBe(false);
    });

    it('should handle error on selectById and set detailError', () => {
      store.selectById('site-bad');

      const req = httpTesting.expectOne((r) => r.url.includes('sites/site-bad'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(store.selectedItem()).toBeNull();
      expect(store.isLoadingDetail()).toBe(false);
      expect(store.detailError()).toBeTruthy();
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedItem and buildings', () => {
      store.selectById('site-1');
      httpTesting.expectOne((r) => r.url.includes('site-1')).flush(mockSite);

      expect(store.selectedItem()).not.toBeNull();

      store.clearSelection();
      expect(store.selectedItem()).toBeNull();
      expect(store.buildings()).toEqual([]);
    });
  });

  describe('loadBuildings', () => {
    it('should load buildings for a site', () => {
      store.loadBuildings('site-1');

      expect(store.isLoadingBuildings()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('sites/site-1/buildings') && r.method === 'GET');
      req.flush(mockBuildingsPaginated);

      expect(store.buildings().length).toBe(1);
      expect(store.buildings()[0].name).toBe('Building A');
      expect(store.isLoadingBuildings()).toBe(false);
    });

    it('should handle error on loadBuildings', () => {
      store.loadBuildings('site-bad');

      const req = httpTesting.expectOne((r) => r.url.includes('sites/site-bad/buildings'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(store.buildings()).toEqual([]);
      expect(store.isLoadingBuildings()).toBe(false);
      expect(store.buildingsError()).toBeTruthy();
    });
  });
});
