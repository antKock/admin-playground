// Dev-tools interceptor — captures the latest API response for the API Inspector panel.
// Only captures responses to our own API (same origin); used by ApiInspectorComponent for debugging.
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { ApiInspectorService } from './api-inspector.service';

export const apiInspectorInterceptor: HttpInterceptorFn = (req, next) => {
  const inspectorService = inject(ApiInspectorService);

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && req.url.startsWith(environment.apiBaseUrl)) {
        inspectorService.capture(req.urlWithParams, event.body);
      }
    }),
  );
};
