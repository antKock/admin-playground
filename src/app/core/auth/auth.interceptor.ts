// Auth interceptor — attaches Bearer token to same-origin API requests.
// Handles global error responses: 401 → refresh then retry, 500 → toast, 0 → connection lost.
// Concurrent 401s queue behind a single refresh call to avoid race conditions.
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError, from, EMPTY } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { AuthStore } from '@domains/auth/auth.store';
import { ToastService } from '@shared/components/toast/toast.service';

// Only inject the token for requests targeting our own API (not external URLs like CDN assets).
function isSameOrigin(url: string): boolean {
  return url.startsWith(environment.apiBaseUrl) || url.startsWith('/');
}

// Auth endpoints should not trigger refresh (would cause infinite loops).
function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout') || url.includes('/auth/register');
}

// Module-level state for refresh queuing (shared across all interceptor invocations).
let isRefreshing = false;
let refreshFailed = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

/** @internal Reset module-level refresh state — test-only. */
export function _resetRefreshState(): void {
  isRefreshing = false;
  refreshFailed = false;
  refreshSubject.next(null);
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authStore = inject(AuthStore);
  const toastService = inject(ToastService);
  const token = authStore.token();

  const authReq = token && isSameOrigin(req.url)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !isAuthEndpoint(req.url)) {
        return handleUnauthorized(req, next, authStore);
      }
      if (error.status === 500) {
        toastService.error('Server error');
      } else if (error.status === 0) {
        toastService.error('Connection lost');
      }
      return throwError(() => error);
    }),
  );
};

function handleUnauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authStore: InstanceType<typeof AuthStore>,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshFailed = false;
    refreshSubject.next(null);

    return from(authStore.refresh()).pipe(
      switchMap((newToken) => {
        isRefreshing = false;
        refreshSubject.next(newToken);
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
      }),
      catchError(() => {
        isRefreshing = false;
        refreshFailed = true;
        refreshSubject.next(null); // Unblock queued requests so they can check refreshFailed
        authStore.logout(location.pathname);
        return EMPTY;
      }),
    );
  }

  // Another request hit 401 while refresh is in-flight — queue and retry after refresh completes
  return refreshSubject.pipe(
    filter((token) => token !== null || refreshFailed),
    take(1),
    switchMap((token) => {
      if (refreshFailed) {
        return EMPTY; // Refresh failed — drop request, user is being redirected to login
      }
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${token!}` } }));
    }),
  );
}
