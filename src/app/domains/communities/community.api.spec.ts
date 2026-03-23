import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  communityListLoader,
  loadCommunity,
  createCommunityRequest,
  updateCommunityRequest,
  deleteCommunityRequest,
  loadAllUsers,
  assignUserRequest,
  removeUserRequest,
  loadCommunityParents,
  loadCommunityChildren,
} from './community.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/communities/`;
const USERS_BASE = `${environment.apiBaseUrl}/users/`;

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

describe('communityListLoader', () => {
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

  it('should call GET /communities/ with limit param', () => {
    communityListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    communityListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 'c-1', name: 'Community A' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    communityListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadCommunity', () => {
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

  it('should call GET /communities/{id}', () => {
    loadCommunity(http, 'c-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}c-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'c-1', name: 'Community A' });
  });
});

describe('loadAllUsers', () => {
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

  it('should call GET /users/ with limit=20 and paginate through all pages', () => {
    let result: unknown[] = [];
    loadAllUsers(http).subscribe((r) => (result = r));

    // First page
    const req1 = httpTesting.expectOne((r) => r.url === USERS_BASE);
    expect(req1.request.method).toBe('GET');
    expect(req1.request.params.get('limit')).toBe('20');
    req1.flush({
      data: [{ id: 'u-1', email: 'a@b.com' }],
      pagination: {
        ...EMPTY_PAGE.pagination,
        has_next_page: true,
        cursors: { start_cursor: 'u-1', end_cursor: 'u-1' },
      },
    });

    // Second page
    const req2 = httpTesting.expectOne((r) => r.url === USERS_BASE && r.params.get('cursor') === 'u-1');
    expect(req2.request.method).toBe('GET');
    req2.flush({
      data: [{ id: 'u-2', email: 'c@d.com' }],
      pagination: {
        ...EMPTY_PAGE.pagination,
        has_next_page: false,
        cursors: { start_cursor: 'u-2', end_cursor: 'u-2' },
      },
    });

    expect(result).toEqual([
      { id: 'u-1', email: 'a@b.com' },
      { id: 'u-2', email: 'c@d.com' },
    ]);
  });
});

describe('loadCommunityParents', () => {
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

  it('should call GET /communities/{id}/parents', () => {
    loadCommunityParents(http, 'c-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}c-1/parents`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'c-parent', name: 'Parent' }]);
  });
});

describe('loadCommunityChildren', () => {
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

  it('should call GET /communities/{id}/children', () => {
    loadCommunityChildren(http, 'c-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}c-1/children`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'c-child', name: 'Child' }]);
  });
});

describe('community mutation requests', () => {
  it('createCommunityRequest should return POST config', () => {
    const data = { name: 'New Community' } as any;
    const result = createCommunityRequest(data);
    expect(result).toEqual({ url: BASE, method: 'POST', body: data });
  });

  it('updateCommunityRequest should return PUT config with id in URL', () => {
    const data = { name: 'Updated' } as any;
    const result = updateCommunityRequest({ id: 'c-1', data });
    expect(result).toEqual({ url: `${BASE}c-1`, method: 'PUT', body: data });
  });

  it('deleteCommunityRequest should return DELETE config', () => {
    const result = deleteCommunityRequest('c-1');
    expect(result).toEqual({ url: `${BASE}c-1`, method: 'DELETE' });
  });

  it('assignUserRequest should return POST config with community and user in URL', () => {
    const result = assignUserRequest({ communityId: 'c-1', userId: 'u-1' });
    expect(result).toEqual({ url: `${BASE}c-1/users/u-1`, method: 'POST' });
  });

  it('removeUserRequest should return DELETE config with community and user in URL', () => {
    const result = removeUserRequest({ communityId: 'c-1', userId: 'u-1' });
    expect(result).toEqual({ url: `${BASE}c-1/users/u-1`, method: 'DELETE' });
  });
});
