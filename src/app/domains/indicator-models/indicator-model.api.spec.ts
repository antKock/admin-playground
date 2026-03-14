import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';

import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ActionModel } from '@domains/action-models/action-model.models';
import { loadUsageByIndicatorModel } from './indicator-model.api';

function makePage(
  data: Partial<ActionModel>[],
): PaginatedResponse<ActionModel> {
  return {
    data: data as ActionModel[],
    pagination: {
      total_count: data.length,
      page_size: 100,
      has_next_page: false,
      has_previous_page: false,
      cursors: { start_cursor: null, end_cursor: null },
      _links: { self: '', next: null, prev: null, first: '' },
    },
  };
}

describe('loadUsageByIndicatorModel', () => {
  it('should send indicator_model_id filter param to action-models endpoint', () => {
    const targetId = 'im-1';
    const page = makePage([
      { id: 'am-1', name: 'AM1' },
      { id: 'am-3', name: 'AM3' },
    ]);

    let receivedParams: HttpParams | undefined;
    const http = {
      get: (_url: string, opts: { params: HttpParams }) => {
        receivedParams = opts.params;
        return of(page);
      },
    } as unknown as HttpClient;

    let result: { id: string; name: string }[] = [];
    loadUsageByIndicatorModel(http, targetId).subscribe((r) => (result = r));

    expect(receivedParams?.get('indicator_model_id')).toBe(targetId);
    expect(receivedParams?.get('limit')).toBe('100');
    expect(result).toEqual([
      { id: 'am-1', name: 'AM1' },
      { id: 'am-3', name: 'AM3' },
    ]);
  });

  it('should return empty array when no matches', () => {
    const page = makePage([]);

    const http = {
      get: () => of(page),
    } as unknown as HttpClient;

    let result: { id: string; name: string }[] = [];
    loadUsageByIndicatorModel(http, 'non-existent').subscribe((r) => (result = r));

    expect(result).toEqual([]);
  });

  it('should map response data to id/name pairs', () => {
    const page = makePage([
      { id: 'am-1', name: 'AM1', description: 'desc' },
    ]);

    const http = {
      get: () => of(page),
    } as unknown as HttpClient;

    let result: { id: string; name: string }[] = [];
    loadUsageByIndicatorModel(http, 'im-1').subscribe((r) => (result = r));

    expect(result).toEqual([{ id: 'am-1', name: 'AM1' }]);
  });

  it('should complete after single API call', () => {
    const page = makePage([]);

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
