/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  actionThemeListLoader,
  loadActionTheme,
  createActionThemeRequest,
  updateActionThemeRequest,
  deleteActionThemeRequest,
  publishActionThemeRequest,
  disableActionThemeRequest,
  activateActionThemeRequest,
  duplicateActionThemeRequest,
} from './action-theme.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/action-themes/`;

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

describe('actionThemeListLoader', () => {
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

  it('should call GET /action-themes/ with limit param', () => {
    actionThemeListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    actionThemeListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 'at-1', name: 'Test Theme' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    actionThemeListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadActionTheme', () => {
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

  it('should call GET /action-themes/{id}', () => {
    loadActionTheme(http, 'at-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}at-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'at-1', name: 'Test Theme' });
  });
});

describe('action theme mutation requests', () => {
  it('createActionThemeRequest should return POST config', () => {
    const data = { name: 'New Theme' } as any;
    const result = createActionThemeRequest(data);
    expect(result).toEqual({ url: BASE, method: 'POST', body: data });
  });

  it('updateActionThemeRequest should return PUT config with id in URL', () => {
    const data = { name: 'Updated' } as any;
    const result = updateActionThemeRequest({ id: 'at-1', data });
    expect(result).toEqual({ url: `${BASE}at-1`, method: 'PUT', body: data });
  });

  it('deleteActionThemeRequest should return DELETE config', () => {
    const result = deleteActionThemeRequest('at-1');
    expect(result).toEqual({ url: `${BASE}at-1`, method: 'DELETE' });
  });

  it('publishActionThemeRequest should return PUT config to /publish', () => {
    const result = publishActionThemeRequest('at-1');
    expect(result).toEqual({ url: `${BASE}at-1/publish`, method: 'PUT', body: {} });
  });

  it('disableActionThemeRequest should return PUT config to /disable', () => {
    const result = disableActionThemeRequest('at-1');
    expect(result).toEqual({ url: `${BASE}at-1/disable`, method: 'PUT', body: {} });
  });

  it('activateActionThemeRequest should return PUT config to /activate', () => {
    const result = activateActionThemeRequest('at-1');
    expect(result).toEqual({ url: `${BASE}at-1/activate`, method: 'PUT', body: {} });
  });

  it('duplicateActionThemeRequest should return POST config to /duplicate', () => {
    const result = duplicateActionThemeRequest('at-1');
    expect(result).toEqual({ url: `${BASE}at-1/duplicate`, method: 'POST', body: {} });
  });
});
