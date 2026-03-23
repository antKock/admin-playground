/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  folderModelListLoader,
  loadFolderModel,
  createFolderModelRequest,
  updateFolderModelRequest,
  deleteFolderModelRequest,
} from './folder-model.api';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/folder-models/`;

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

describe('folderModelListLoader', () => {
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

  it('should call GET /folder-models/ with limit param', () => {
    folderModelListLoader(http, { cursor: null, limit: 20 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('should include cursor param when provided', () => {
    folderModelListLoader(http, { cursor: 'abc', limit: 10 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('cursor')).toBe('abc');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('should emit paginated response data', () => {
    const mockPage = {
      ...EMPTY_PAGE,
      data: [{ id: 'fm-1', name: 'Test Folder Model' }],
      pagination: { ...EMPTY_PAGE.pagination, total_count: 1 },
    };

    let result: unknown;
    folderModelListLoader(http, { cursor: null, limit: 20 }).subscribe((r) => (result = r));
    const req = httpTesting.expectOne((r) => r.url === BASE);
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });
});

describe('loadFolderModel', () => {
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

  it('should call GET /folder-models/{id}', () => {
    loadFolderModel(http, 'fm-1').subscribe();
    const req = httpTesting.expectOne(`${BASE}fm-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'fm-1', name: 'Test Folder Model' });
  });
});

describe('folder model mutation requests', () => {
  it('createFolderModelRequest should return POST config', () => {
    const data = { name: 'New Folder Model' } as any;
    const result = createFolderModelRequest(data);
    expect(result).toEqual({ url: BASE, method: 'POST', body: data });
  });

  it('updateFolderModelRequest should return PUT config with id in URL', () => {
    const data = { name: 'Updated' } as any;
    const result = updateFolderModelRequest({ id: 'fm-1', data });
    expect(result).toEqual({ url: `${BASE}fm-1`, method: 'PUT', body: data });
  });

  it('deleteFolderModelRequest should return DELETE config', () => {
    const result = deleteFolderModelRequest('fm-1');
    expect(result).toEqual({ url: `${BASE}fm-1`, method: 'DELETE' });
  });
});
