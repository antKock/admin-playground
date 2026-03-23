/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  actionModelListLoader,
  loadActionModel,
  createActionModelRequest,
  updateActionModelRequest,
  deleteActionModelRequest,
  publishActionModelRequest,
  disableActionModelRequest,
  activateActionModelRequest,
} from './action-model.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/action-models/`;

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

describe('actionModelListLoader', () => {
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

  it('should call GET /action-models/ with limit param', () => {
    actionModelListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    actionModelListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 'am-1', name: 'Test Model' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    actionModelListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadActionModel', () => {
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

  it('should call GET /action-models/{id}', () => {
    loadActionModel(http, 'am-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}am-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'am-1', name: 'Test Model' });
  });
});

describe('action model mutation requests', () => {
  it('createActionModelRequest should return POST config', () => {
    const data = { name: 'New Model' } as any;
    const result = createActionModelRequest(data);
    expect(result).toEqual({ url: BASE, method: 'POST', body: data });
  });

  it('updateActionModelRequest should return PUT config with id in URL', () => {
    const data = { name: 'Updated' } as any;
    const result = updateActionModelRequest({ id: 'am-1', data });
    expect(result).toEqual({ url: `${BASE}am-1`, method: 'PUT', body: data });
  });

  it('deleteActionModelRequest should return DELETE config', () => {
    const result = deleteActionModelRequest('am-1');
    expect(result).toEqual({ url: `${BASE}am-1`, method: 'DELETE' });
  });

  it('publishActionModelRequest should return PUT config to /publish', () => {
    const result = publishActionModelRequest('am-1');
    expect(result).toEqual({ url: `${BASE}am-1/publish`, method: 'PUT', body: {} });
  });

  it('disableActionModelRequest should return PUT config to /disable', () => {
    const result = disableActionModelRequest('am-1');
    expect(result).toEqual({ url: `${BASE}am-1/disable`, method: 'PUT', body: {} });
  });

  it('activateActionModelRequest should return PUT config to /activate', () => {
    const result = activateActionModelRequest('am-1');
    expect(result).toEqual({ url: `${BASE}am-1/activate`, method: 'PUT', body: {} });
  });
});
