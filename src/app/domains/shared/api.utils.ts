import { HttpParams } from '@angular/common/http';

import { FilterParams } from './with-cursor-pagination';

/** Appends filter entries to HttpParams, expanding array values into repeated keys. */
export function applyFilters(httpParams: HttpParams, filters?: FilterParams): HttpParams {
  if (!filters) return httpParams;
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        httpParams = httpParams.append(key, v);
      }
    } else {
      httpParams = httpParams.set(key, value);
    }
  }
  return httpParams;
}
