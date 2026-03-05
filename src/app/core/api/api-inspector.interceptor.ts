import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';

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
