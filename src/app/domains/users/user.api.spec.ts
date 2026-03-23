import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  userListLoader,
  loadUser,
  createUserRequest,
  updateUserRequest,
  deleteUserRequest,
  loadRoles,
  loadUserRole,
  updateUserRoleRequest,
  loadAllCommunities,
  assignCommunityRequest,
  removeCommunityRequest,
} from './user.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/users/`;
const REGISTER_URL = `${environment.apiBaseUrl}/auth/register`;
const ROLES_URL = `${environment.apiBaseUrl}/admin/roles/`;
const COMMUNITIES_URL = `${environment.apiBaseUrl}/communities/`;

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

describe('userListLoader', () => {
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

  it('should call GET /users/ with limit param', () => {
    userListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    userListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 'u-1', email: 'test@example.com' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    userListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadUser', () => {
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

  it('should call GET /users/{id}', () => {
    loadUser(http, 'u-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}u-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'u-1', email: 'test@example.com' });
  });
});

describe('loadRoles', () => {
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

  it('should call GET /admin/roles/', () => {
    loadRoles(http).subscribe();
    const req = httpTesting.expectOne(ROLES_URL);
    expect(req.request.method).toBe('GET');
    req.flush(['admin', 'user', 'agent']);
  });
});

describe('loadUserRole', () => {
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

  it('should call GET /admin/roles/user/{userId}', () => {
    loadUserRole(http, 'u-1').subscribe();
    const req = httpTesting.expectOne(`${ROLES_URL}user/u-1`);
    expect(req.request.method).toBe('GET');
    req.flush('admin');
  });
});

describe('loadAllCommunities', () => {
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

  it('should call GET /communities/ with limit=100', () => {
    loadAllCommunities(http).subscribe();
    const req = httpTesting.expectOne((r) => r.url === COMMUNITIES_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('100');
    req.flush(EMPTY_PAGE);
  });
});

describe('user mutation requests', () => {
  it('createUserRequest should return POST config to /auth/register', () => {
    const data = { email: 'new@example.com', password: 'pass' } as any;
    const result = createUserRequest(data);
    expect(result).toEqual({ url: REGISTER_URL, method: 'POST', body: data });
  });

  it('updateUserRequest should return PUT config with id in URL', () => {
    const data = { email: 'updated@example.com' } as any;
    const result = updateUserRequest({ id: 'u-1', data });
    expect(result).toEqual({ url: `${BASE}u-1`, method: 'PUT', body: data });
  });

  it('deleteUserRequest should return DELETE config', () => {
    const result = deleteUserRequest('u-1');
    expect(result).toEqual({ url: `${BASE}u-1`, method: 'DELETE' });
  });

  it('updateUserRoleRequest should return PUT config with role query param', () => {
    const result = updateUserRoleRequest({ userId: 'u-1', role: 'admin' });
    expect(result).toEqual({
      url: `${ROLES_URL}user/u-1?role=admin`,
      method: 'PUT',
    });
  });

  it('assignCommunityRequest should return POST config', () => {
    const result = assignCommunityRequest({ communityId: 'c-1', userId: 'u-1' });
    expect(result).toEqual({ url: `${COMMUNITIES_URL}c-1/users/u-1`, method: 'POST' });
  });

  it('removeCommunityRequest should return DELETE config', () => {
    const result = removeCommunityRequest({ communityId: 'c-1', userId: 'u-1' });
    expect(result).toEqual({ url: `${COMMUNITIES_URL}c-1/users/u-1`, method: 'DELETE' });
  });
});
