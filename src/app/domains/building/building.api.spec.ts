import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  buildingListLoader,
  loadBuilding,
  createBuildingRequest,
  updateBuildingRequest,
  deleteBuildingRequest,
  addRnbRequest,
  removeRnbRequest,
} from './building.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/buildings/`;

const EMPTY_PAGE = {
  data: [],
  pagination: {
    total_count: 0,
    page_size: 20,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: null, end_cursor: null },
    _links: { self: '', next: null, prev: null, first: '' },
  },
};

describe('buildingListLoader', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call GET /buildings/ with limit param', () => {
    buildingListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    buildingListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 'b-1', name: 'Building A' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    buildingListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadBuilding', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should call GET /buildings/{id}', () => {
    loadBuilding(http, 'b-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}b-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'b-1', name: 'Building A' });
  });
});

describe('building mutation requests', () => {
  it('createBuildingRequest should return POST config', () => {
    const data = { name: 'New Building' } as any;
    const result = createBuildingRequest(data);
    expect(result).toEqual({ url: BASE, method: 'POST', body: data });
  });

  it('updateBuildingRequest should return PUT config with id in URL', () => {
    const data = { name: 'Updated' } as any;
    const result = updateBuildingRequest({ id: 'b-1', data });
    expect(result).toEqual({ url: `${BASE}b-1`, method: 'PUT', body: data });
  });

  it('deleteBuildingRequest should return DELETE config', () => {
    const result = deleteBuildingRequest('b-1');
    expect(result).toEqual({ url: `${BASE}b-1`, method: 'DELETE' });
  });

  it('addRnbRequest should return POST config with rnb_id query param', () => {
    const result = addRnbRequest({ buildingId: 'b-1', rnbId: 'rnb-123' });
    expect(result).toEqual({
      url: `${BASE}b-1/rnbs?rnb_id=rnb-123`,
      method: 'POST',
      body: {},
    });
  });

  it('removeRnbRequest should return DELETE config with rnbId in URL', () => {
    const result = removeRnbRequest({ buildingId: 'b-1', rnbId: 'rnb-123' });
    expect(result).toEqual({
      url: `${BASE}b-1/rnbs/rnb-123`,
      method: 'DELETE',
    });
  });
});
