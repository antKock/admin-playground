import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HistoryStore } from './history.store';

describe('HistoryStore', () => {
  let store: InstanceType<typeof HistoryStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HistoryStore,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(HistoryStore);
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

  it('should load activities for an entity', () => {
    store.load('ActionModel', 'abc-123');
    expect(store.isLoading()).toBe(true);

    const req = httpTesting.expectOne((r) =>
      r.url.includes('/history/ActionModel/abc-123/activities'),
    );
    req.flush({
      data: [
        {
          id: 'act-1',
          user_id: 'u1',
          user_name: 'Admin',
          action: 'create',
          entity_type: 'ActionModel',
          entity_id: 'abc-123',
          entity_display_name: 'Test',
          description: 'Created',
          created_at: '2026-03-11T10:00:00Z',
        },
      ],
      pagination: {
        total_count: 1,
        page_size: 20,
        has_next_page: false,
        has_previous_page: false,
        cursors: { start_cursor: null, end_cursor: null },
        _links: { self: '', next: null, prev: null, first: '' },
      },
    });

    expect(store.isLoading()).toBe(false);
    expect(store.activities().length).toBe(1);
    expect(store.activities()[0].user_name).toBe('Admin');
    expect(store.hasMore()).toBe(false);
  });

  it('should handle load error', () => {
    store.load('ActionModel', 'abc-123');

    const req = httpTesting.expectOne((r) =>
      r.url.includes('/history/ActionModel/abc-123/activities'),
    );
    req.error(new ProgressEvent('error'));

    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeTruthy();
  });

  it('should reset state', () => {
    store.reset();
    expect(store.activities()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.hasMore()).toBe(false);
  });
});
