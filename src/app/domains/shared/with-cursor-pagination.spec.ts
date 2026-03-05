import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { Observable, of, throwError } from 'rxjs';

import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { withCursorPagination } from './with-cursor-pagination';

interface TestItem {
  id: string;
  name: string;
}

type LoaderParams = { cursor: string | null; limit: number; filters?: Record<string, string> };

function createMockResponse(
  data: TestItem[],
  hasNextPage: boolean,
  endCursor: string | null = 'cursor-abc',
): PaginatedResponse<TestItem> {
  return {
    data,
    pagination: {
      total_count: data.length,
      page_size: 20,
      has_next_page: hasNextPage,
      has_previous_page: false,
      cursors: { start_cursor: 'start', end_cursor: endCursor },
      _links: { self: '/test', next: null, prev: null, first: '/test' },
    },
  };
}

describe('withCursorPagination', () => {
  let loaderSpy: ReturnType<typeof vi.fn<(params: LoaderParams) => Observable<PaginatedResponse<TestItem>>>>;

  function createStore(defaultLimit?: number) {
    loaderSpy = vi.fn<(params: LoaderParams) => Observable<PaginatedResponse<TestItem>>>();

    const TestStore = signalStore(
      { providedIn: 'root' },
      withCursorPagination<TestItem>({
        loader: (params) => loaderSpy(params),
        defaultLimit,
      }),
    );

    TestBed.configureTestingModule({});
    return TestBed.inject(TestStore);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const store = createStore();
      expect(store.items()).toEqual([]);
      expect(store.cursor()).toBeNull();
      expect(store.hasMore()).toBe(false);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.isEmpty()).toBe(true);
      expect(store.totalLoaded()).toBe(0);
    });
  });

  describe('load', () => {
    it('should populate items and set cursor on initial load', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const store = createStore();
      loaderSpy.mockReturnValue(of(createMockResponse(items, true, 'cursor-1')));

      store.load(undefined);

      expect(loaderSpy).toHaveBeenCalledWith({
        cursor: null,
        limit: 20,
        filters: undefined,
      });
      expect(store.items()).toEqual(items);
      expect(store.cursor()).toBe('cursor-1');
      expect(store.hasMore()).toBe(true);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.isEmpty()).toBe(false);
      expect(store.totalLoaded()).toBe(2);
    });

    it('should replace items on subsequent load (not append)', () => {
      const store = createStore();
      const firstItems = [{ id: '1', name: 'First' }];
      const secondItems = [{ id: '2', name: 'Second' }];

      loaderSpy.mockReturnValue(of(createMockResponse(firstItems, false)));
      store.load(undefined);
      expect(store.items()).toEqual(firstItems);

      loaderSpy.mockReturnValue(of(createMockResponse(secondItems, false)));
      store.load(undefined);
      expect(store.items()).toEqual(secondItems);
      expect(store.totalLoaded()).toBe(1);
    });

    it('should pass filters to loader', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(of(createMockResponse([], false)));

      store.load({ status: 'active' });

      expect(loaderSpy).toHaveBeenCalledWith({
        cursor: null,
        limit: 20,
        filters: { status: 'active' },
      });
    });

    it('should use custom defaultLimit', () => {
      const store = createStore(10);
      loaderSpy.mockReturnValue(of(createMockResponse([], false)));

      store.load(undefined);

      expect(loaderSpy).toHaveBeenCalledWith({
        cursor: null,
        limit: 10,
        filters: undefined,
      });
    });
  });

  describe('loading state transitions', () => {
    it('should set isLoading false after successful load', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(of(createMockResponse([], false)));

      store.load(undefined);

      expect(store.isLoading()).toBe(false);
    });
  });

  describe('loadMore', () => {
    it('should append items to existing array', () => {
      const store = createStore();
      const firstItems = [{ id: '1', name: 'First' }];
      const moreItems = [{ id: '2', name: 'Second' }];

      loaderSpy.mockReturnValue(of(createMockResponse(firstItems, true, 'cursor-1')));
      store.load(undefined);

      loaderSpy.mockReturnValue(of(createMockResponse(moreItems, false, 'cursor-2')));
      store.loadMore();

      expect(store.items()).toEqual([...firstItems, ...moreItems]);
      expect(store.totalLoaded()).toBe(2);
      expect(store.cursor()).toBe('cursor-2');
      expect(store.hasMore()).toBe(false);
    });

    it('should call loader with current cursor', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(
        of(createMockResponse([{ id: '1', name: 'A' }], true, 'cursor-xyz')),
      );
      store.load(undefined);

      loaderSpy.mockReturnValue(of(createMockResponse([], false)));
      store.loadMore();

      expect(loaderSpy).toHaveBeenLastCalledWith({
        cursor: 'cursor-xyz',
        limit: 20,
        filters: undefined,
      });
    });

    it('should make no API call when hasMore is false', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(of(createMockResponse([{ id: '1', name: 'A' }], false)));
      store.load(undefined);
      loaderSpy.mockClear();

      store.loadMore();

      expect(loaderSpy).not.toHaveBeenCalled();
    });

    it('should keep existing items intact on loadMore error', () => {
      const store = createStore();
      const items = [{ id: '1', name: 'Keep Me' }];
      loaderSpy.mockReturnValue(of(createMockResponse(items, true, 'cursor-1')));
      store.load(undefined);

      loaderSpy.mockReturnValue(throwError(() => new Error('Network error')));
      store.loadMore();

      expect(store.items()).toEqual(items);
      expect(store.error()).toBe('Network error');
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should set error state on load failure', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(throwError(() => new Error('Server error')));

      store.load(undefined);

      expect(store.error()).toBe('Server error');
      expect(store.isLoading()).toBe(false);
      expect(store.items()).toEqual([]);
    });

    it('should use default error message when error has no message', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(throwError(() => ({})));

      store.load(undefined);

      expect(store.error()).toBe('Échec du chargement');
    });
  });

  describe('reset', () => {
    it('should clear all state to initial values', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(
        of(createMockResponse([{ id: '1', name: 'A' }], true, 'cursor-1')),
      );
      store.load(undefined);

      store.reset();

      expect(store.items()).toEqual([]);
      expect(store.cursor()).toBeNull();
      expect(store.hasMore()).toBe(false);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.isEmpty()).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should reload with current filters', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(
        of(createMockResponse([{ id: '1', name: 'A' }], false)),
      );
      store.load({ status: 'active' });

      loaderSpy.mockReturnValue(
        of(createMockResponse([{ id: '2', name: 'B' }], false)),
      );
      store.refresh(undefined);

      expect(loaderSpy).toHaveBeenLastCalledWith({
        cursor: null,
        limit: 20,
        filters: { status: 'active' },
      });
      expect(store.items()).toEqual([{ id: '2', name: 'B' }]);
    });

    it('should reload with new filters when provided', () => {
      const store = createStore();
      loaderSpy.mockReturnValue(of(createMockResponse([], false)));

      store.load({ status: 'active' });

      store.refresh({ status: 'archived' });

      expect(loaderSpy).toHaveBeenLastCalledWith({
        cursor: null,
        limit: 20,
        filters: { status: 'archived' },
      });
    });
  });
});
