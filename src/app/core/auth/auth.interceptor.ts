import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from '@app/shared/services/toast.service';

function isSameOrigin(url: string): boolean {
  return url.startsWith(environment.apiBaseUrl) || url.startsWith('/');
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = authService.getToken();

  const authReq = token && isSameOrigin(req.url)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      } else if (error.status === 500) {
        toastService.error('Server error');
      } else if (error.status === 0) {
        toastService.error('Connection lost');
      }
      return throwError(() => error);
    }),
  );
};
