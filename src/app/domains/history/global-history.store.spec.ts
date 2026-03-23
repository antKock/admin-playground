import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { GlobalHistoryStore } from './global-history.store';

const mockPagination = {
  total_count: 2,
  page_size: 20,
  has_next_page: true,
  has_previous_page: false,
  cursors: { start_cursor: 'c1', end_cursor: 'c2' },
  _links: { self: '', next: null, prev: null, first: '' },
};

const mockActivity = {
  id: '1',
  user_id: 'u1',
  user_name: 'Test User',
  action: 'create' as const,
  entity_type: 'FundingProgram',
  entity_id: 'fp1',
  entity_display_name: 'Programme Test',
  description: 'Created',
  changes_summary: 'Initial creation',
  parent_entity_type: null,
  parent_entity_id: null,
  parent_entity_name: null,
  created_at: '2026-03-11T10:00:00Z',
};

describe('GlobalHistoryStore', () => {
  let store: InstanceType<typeof GlobalHistoryStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), GlobalHistoryStore],
    });
    store = TestBed.inject(GlobalHistoryStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should initialize with empty state', () => {
    expect(store.activities()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.hasMore()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load activities and update signals', () => {
    store.load(undefined);
    expect(store.isLoading()).toBe(true);

    const req = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    req.flush({ data: [mockActivity], pagination: mockPagination });

    expect(store.activities().length).toBe(1);
    expect(store.activities()[0].entity_display_name).toBe('Programme Test');
    expect(store.hasMore()).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('should append activities on loadMore', () => {
    store.load(undefined);
    const req1 = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    req1.flush({ data: [mockActivity], pagination: mockPagination });

    store.loadMore();
    const req2 = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    expect(req2.request.params.get('cursor')).toBe('c2');

    const secondActivity = { ...mockActivity, id: '2', entity_display_name: 'Second' };
    req2.flush({
      data: [secondActivity],
      pagination: { ...mockPagination, has_next_page: false, cursors: { start_cursor: 'c2', end_cursor: 'c3' } },
    });

    expect(store.activities().length).toBe(2);
    expect(store.hasMore()).toBe(false);
  });

  it('should not loadMore when no cursor', () => {
    store.loadMore();
    httpTesting.expectNone((r) => r.url.includes('/history/activities'));
  });

  it('should reset state', () => {
    store.load(undefined);
    const req = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    req.flush({ data: [mockActivity], pagination: mockPagination });

    store.reset();
    expect(store.activities()).toEqual([]);
    expect(store.hasMore()).toBe(false);
  });

  it('should pass filters as query params', () => {
    store.load({ entity_type: 'Community', action: 'update' });
    const req = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    expect(req.request.params.get('entity_type')).toBe('Community');
    expect(req.request.params.get('action')).toBe('update');
    req.flush({ data: [], pagination: { ...mockPagination, has_next_page: false } });
  });

  it('should handle errors', () => {
    store.load(undefined);
    const req = httpTesting.expectOne((r) => r.url.includes('/history/activities'));
    req.error(new ProgressEvent('error'));

    expect(store.error()).toBeTruthy();
    expect(store.isLoading()).toBe(false);
  });
});
