import { HttpClient, HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ActionModel } from '@domains/action-models/action-model.models';
import { loadUsageByIndicatorModel } from './indicator-model.api';

function makePage(
  data: Partial<ActionModel>[],
  hasNextPage: boolean,
  endCursor: string | null = null,
): PaginatedResponse<ActionModel> {
  return {
    data: data as ActionModel[],
    pagination: {
      total_count: 0,
      page_size: 50,
      has_next_page: hasNextPage,
      has_previous_page: false,
      cursors: { start_cursor: null, end_cursor: endCursor },
      _links: { self: '', next: null, prev: null, first: '' },
    },
  };
}

describe('loadUsageByIndicatorModel', () => {
  it('should iterate multiple pages and return matching action models', () => {
    const targetId = 'im-1';
    const page1 = makePage(
      [
        { id: 'am-1', name: 'AM1', indicator_models: [{ id: targetId } as never] },
        { id: 'am-2', name: 'AM2', indicator_models: [] },
      ],
      true,
      'cursor-1',
    );
    const page2 = makePage(
      [{ id: 'am-3', name: 'AM3', indicator_models: [] }],
      true,
      'cursor-2',
    );
    const page3 = makePage(
      [{ id: 'am-4', name: 'AM4', indicator_models: [{ id: targetId } as never] }],
      false,
    );

    const responses = [page1, page2, page3];
    let callIndex = 0;
    const receivedCursors: (string | null)[] = [];
    const http = {
      get: (_url: string, opts: { params: HttpParams }) => {
        receivedCursors.push(opts.params.get('cursor'));
        return of(responses[callIndex++]);
      },
    } as unknown as HttpClient;

    let result: { id: string; name: string }[] = [];
    loadUsageByIndicatorModel(http, targetId).subscribe((r) => (result = r));

    expect(result).toEqual([
      { id: 'am-1', name: 'AM1' },
      { id: 'am-4', name: 'AM4' },
    ]);
    expect(callIndex).toBe(3);
    expect(receivedCursors).toEqual([null, 'cursor-1', 'cursor-2']);
  });

  it('should return empty array when no matches across pages', () => {
    const page = makePage(
      [{ id: 'am-1', name: 'AM1', indicator_models: [] }],
      false,
    );

    const http = {
      get: () => of(page),
    } as unknown as HttpClient;

    let result: { id: string; name: string }[] = [];
    loadUsageByIndicatorModel(http, 'non-existent').subscribe((r) => (result = r));

    expect(result).toEqual([]);
  });

  it('should return partial results when a mid-pagination request fails', () => {
    const targetId = 'im-1';
    const page1 = makePage(
      [{ id: 'am-1', name: 'AM1', indicator_models: [{ id: targetId } as never] }],
      true,
      'cursor-1',
    );

    let callCount = 0;
    const http = {
      get: () => {
        callCount++;
        if (callCount === 1) return of(page1);
        return throwError(() => new Error('Network error'));
      },
    } as unknown as HttpClient;

    let result: { id: string; name: string }[] = [];
    loadUsageByIndicatorModel(http, targetId).subscribe((r) => (result = r));

    expect(result).toEqual([{ id: 'am-1', name: 'AM1' }]);
    expect(callCount).toBe(2);
  });

  it('should complete when has_next_page is false (no infinite loop)', () => {
    const page = makePage([], false);

    let callCount = 0;
    const http = {
      get: () => {
        callCount++;
        return of(page);
      },
    } as unknown as HttpClient;

    let completed = false;
    loadUsageByIndicatorModel(http, 'any').subscribe({
      complete: () => (completed = true),
    });

    expect(completed).toBe(true);
    expect(callCount).toBe(1);
  });
});
