import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withProps, withFeature, withComputed } from '@ngrx/signals';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { ActivityResponse } from './history.models';
import { entityActivityListLoader } from './history.api';

export const HistoryStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) =>
    withCursorPagination<ActivityResponse>({
      loader: (params) => entityActivityListLoader(store._http, params),
    }),
  ),
  withComputed((store) => ({
    activities: computed(() => store.items() as ActivityResponse[]),
  })),
);
