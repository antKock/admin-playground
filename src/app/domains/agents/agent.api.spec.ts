import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  agentListLoader,
  loadAgent,
  createAgentRequest,
  updateAgentRequest,
  deleteAgentRequest,
  changeAgentStatusRequest,
} from './agent.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/agents/`;

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

describe('agentListLoader', () => {
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

  it('should call GET /agents/ with limit param', () => {
    agentListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    agentListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 'ag-1', first_name: 'John', last_name: 'Doe' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    agentListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadAgent', () => {
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

  it('should call GET /agents/{id}', () => {
    loadAgent(http, 'ag-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}ag-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'ag-1', first_name: 'John', last_name: 'Doe' });
  });
});

describe('agent mutation requests', () => {
  it('createAgentRequest should return POST config', () => {
    const data = { first_name: 'John', last_name: 'Doe' } as any;
    const result = createAgentRequest(data);
    expect(result).toEqual({ url: BASE, method: 'POST', body: data });
  });

  it('updateAgentRequest should return PUT config with id in URL', () => {
    const data = { first_name: 'Jane' } as any;
    const result = updateAgentRequest({ id: 'ag-1', data });
    expect(result).toEqual({ url: `${BASE}ag-1`, method: 'PUT', body: data });
  });

  it('deleteAgentRequest should return DELETE config', () => {
    const result = deleteAgentRequest('ag-1');
    expect(result).toEqual({ url: `${BASE}ag-1`, method: 'DELETE' });
  });

  it('changeAgentStatusRequest should return PUT config with status body', () => {
    const result = changeAgentStatusRequest({ id: 'ag-1', status: 'active' as any });
    expect(result).toEqual({ url: `${BASE}ag-1`, method: 'PUT', body: { status: 'active' } });
  });
});
