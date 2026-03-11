import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { globalActivityLoader } from './history.api';
import { environment } from '@app/../environments/environment';

describe('globalActivityLoader', () => {
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

  it('should call GET /history/activities with default limit', () => {
    globalActivityLoader(http).subscribe();
    const req = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({ data: [], pagination: { total_count: 0, page_size: 20, has_next_page: false, has_previous_page: false, cursors: { start_cursor: null, end_cursor: null }, _links: { self: '', next: null, prev: null, first: '' } } });
  });

  it('should pass entity_type and action filters as query params', () => {
    globalActivityLoader(http, { entity_type: 'FundingProgram', action: 'create' }).subscribe();
    const req = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    expect(req.request.params.get('entity_type')).toBe('FundingProgram');
    expect(req.request.params.get('action')).toBe('create');
    req.flush({ data: [], pagination: { total_count: 0, page_size: 20, has_next_page: false, has_previous_page: false, cursors: { start_cursor: null, end_cursor: null }, _links: { self: '', next: null, prev: null, first: '' } } });
  });

  it('should pass cursor and since when provided', () => {
    globalActivityLoader(http, { cursor: 'abc', since: '2026-01-01T00:00:00Z' }).subscribe();
    const req = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('since')).toBe('2026-01-01T00:00:00Z');
    req.flush({ data: [], pagination: { total_count: 0, page_size: 20, has_next_page: false, has_previous_page: false, cursors: { start_cursor: null, end_cursor: null }, _links: { self: '', next: null, prev: null, first: '' } } });
  });

  it('should not include optional params when not provided', () => {
    globalActivityLoader(http, {}).subscribe();
    const req = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    expect(req.request.params.has('entity_type')).toBe(false);
    expect(req.request.params.has('action')).toBe(false);
    expect(req.request.params.has('cursor')).toBe(false);
    expect(req.request.params.has('since')).toBe(false);
    req.flush({ data: [], pagination: { total_count: 0, page_size: 20, has_next_page: false, has_previous_page: false, cursors: { start_cursor: null, end_cursor: null }, _links: { self: '', next: null, prev: null, first: '' } } });
  });
});
