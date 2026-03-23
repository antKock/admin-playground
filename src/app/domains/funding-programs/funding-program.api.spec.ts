import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  fundingProgramListLoader,
  loadFundingProgram,
  createFundingProgramRequest,
  updateFundingProgramRequest,
  deleteFundingProgramRequest,
} from './funding-program.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/funding-programs/`;

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

describe('fundingProgramListLoader', () => {
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

  it('should call GET /funding-programs/ with limit param', () => {
    fundingProgramListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    fundingProgramListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 'fp-1', name: 'Test Program' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    fundingProgramListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadFundingProgram', () => {
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

  it('should call GET /funding-programs/{id}', () => {
    loadFundingProgram(http, 'fp-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}fp-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'fp-1', name: 'Test Program' });
  });
});

describe('funding program mutation requests', () => {
  it('createFundingProgramRequest should return POST config', () => {
    const data = { name: 'New Program' } as any;
    const result = createFundingProgramRequest(data);
    expect(result).toEqual({ url: BASE, method: 'POST', body: data });
  });

  it('updateFundingProgramRequest should return PUT config with id in URL', () => {
    const data = { name: 'Updated' } as any;
    const result = updateFundingProgramRequest({ id: 'fp-1', data });
    expect(result).toEqual({ url: `${BASE}fp-1`, method: 'PUT', body: data });
  });

  it('deleteFundingProgramRequest should return DELETE config', () => {
    const result = deleteFundingProgramRequest('fp-1');
    expect(result).toEqual({ url: `${BASE}fp-1`, method: 'DELETE' });
  });
});
