import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  siteListLoader,
  loadSite,
  loadSiteBuildings,
  createSiteRequest,
  updateSiteRequest,
  deleteSiteRequest,
} from './site.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/sites/`;

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

describe('siteListLoader', () => {
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

  it('should call GET /sites/ with limit param', () => {
    siteListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    siteListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 's-1', name: 'Site A' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    siteListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadSite', () => {
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

  it('should call GET /sites/{id}', () => {
    loadSite(http, 's-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}s-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 's-1', name: 'Site A' });
  });
});

describe('loadSiteBuildings', () => {
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

  it('should call GET /sites/{siteId}/buildings with limit param', () => {
    loadSiteBuildings(http, 's-1', { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === `${BASE}s-1/buildings`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    loadSiteBuildings(http, 's-1', { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === `${BASE}s-1/buildings`);
    expect(req.request.params.get('cursor')).toBe('abc');
    req.flush(EMPTY_PAGE);
  });
});

describe('site mutation requests', () => {
  it('createSiteRequest should return POST config', () => {
    const data = { name: 'New Site' } as any;
    const result = createSiteRequest(data);
    expect(result).toEqual({ url: BASE, method: 'POST', body: data });
  });

  it('updateSiteRequest should return PUT config with id in URL', () => {
    const data = { name: 'Updated' } as any;
    const result = updateSiteRequest({ id: 's-1', data });
    expect(result).toEqual({ url: `${BASE}s-1`, method: 'PUT', body: data });
  });

  it('deleteSiteRequest should return DELETE config', () => {
    const result = deleteSiteRequest('s-1');
    expect(result).toEqual({ url: `${BASE}s-1`, method: 'DELETE' });
  });
});
