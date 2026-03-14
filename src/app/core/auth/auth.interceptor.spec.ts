import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { authInterceptor, _resetRefreshState } from './auth.interceptor';
import { ToastService } from '@app/shared/services/toast.service';

/** Flush the microtask queue so Promise-based chains (from → switchMap) resolve. */
async function flushMicrotasks() {
  await new Promise((r) => setTimeout(r, 0));
}

function setup(token?: string) {
  if (token) {
    localStorage.setItem('laureat_admin_jwt', token);
  }

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });

  return {
    httpClient: TestBed.inject(HttpClient),
    httpTesting: TestBed.inject(HttpTestingController),
    toastService: TestBed.inject(ToastService),
    router: TestBed.inject(Router),
  };
}

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetRefreshState();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should not attach Authorization header when no token', () => {
    const { httpClient, httpTesting } = setup();

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    httpTesting.verify();
  });

  it('should attach Authorization header when token exists', () => {
    const { httpClient, httpTesting } = setup('test-token');

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
    httpTesting.verify();
  });

  it('should show "Server error" toast on 500', () => {
    const { httpClient, httpTesting, toastService } = setup();
    const spy = vi.spyOn(toastService, 'error');

    httpClient.get('/api/test').subscribe({ error: () => { /* expected */ } });

    httpTesting.expectOne('/api/test').flush('Error', { status: 500, statusText: 'Internal Server Error' });

    expect(spy).toHaveBeenCalledWith('Server error');
    httpTesting.verify();
  });

  it('should show "Connection lost" toast on network error (status 0)', () => {
    const { httpClient, httpTesting, toastService } = setup();
    const spy = vi.spyOn(toastService, 'error');

    httpClient.get('/api/test').subscribe({ error: () => { /* expected */ } });

    httpTesting.expectOne('/api/test').error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(spy).toHaveBeenCalledWith('Connection lost');
    httpTesting.verify();
  });

  it('should attempt refresh on 401 and retry request on success', async () => {
    const { httpClient, httpTesting } = setup('old-token');
    let result: unknown;

    httpClient.get('/api/data').subscribe((r) => (result = r));

    // First request fails with 401
    httpTesting.expectOne('/api/data').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Interceptor attempts refresh
    const refreshReq = httpTesting.expectOne((r) => r.url.includes('/auth/refresh') && r.method === 'POST');
    expect(refreshReq.request.withCredentials).toBe(true);
    refreshReq.flush({ access_token: 'new-token', token_type: 'bearer' });

    // Flush microtasks so the Promise-based refresh resolves and retry fires
    await flushMicrotasks();

    // Interceptor retries the original request with new token
    const retryReq = httpTesting.expectOne('/api/data');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ data: 'success' });

    expect(result).toEqual({ data: 'success' });
    httpTesting.verify();
  });

  it('should not attempt refresh on 401 from auth endpoints', () => {
    const { httpClient, httpTesting, router } = setup('old-token');
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    httpClient.post('/api/v1/auth/login', {}).subscribe({ error: () => { /* expected */ } });

    httpTesting.expectOne((r) => r.url.includes('/auth/login')).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Should NOT trigger a refresh request — verify no pending requests
    httpTesting.verify();
    expect(nav).not.toHaveBeenCalled();
  });

  it('should logout when refresh fails', async () => {
    const { httpClient, httpTesting, router } = setup('old-token');
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    httpClient.get('/api/data').subscribe({ error: () => { /* expected */ } });

    // First request fails with 401
    httpTesting.expectOne('/api/data').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Refresh fails
    httpTesting.expectOne((r) => r.url.includes('/auth/refresh')).flush('Expired', { status: 401, statusText: 'Unauthorized' });

    // Flush microtasks so the Promise rejection propagates to catchError → logout
    await flushMicrotasks();

    // Logout fires POST /auth/logout (fire-and-forget)
    httpTesting.match((r) => r.url.includes('/auth/logout')).forEach((r) => r.flush(null));

    expect(nav).toHaveBeenCalledWith(['/login'], expect.any(Object));
    httpTesting.verify();
  });

  it('should queue concurrent 401s behind a single refresh and retry all on success', async () => {
    const { httpClient, httpTesting } = setup('old-token');
    let resultA: unknown;
    let resultB: unknown;

    // Fire two requests concurrently
    httpClient.get('/api/data-a').subscribe((r) => (resultA = r));
    httpClient.get('/api/data-b').subscribe((r) => (resultB = r));

    // Both fail with 401
    httpTesting.expectOne('/api/data-a').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    httpTesting.expectOne('/api/data-b').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Only ONE refresh request should be in-flight
    const refreshReqs = httpTesting.match((r) => r.url.includes('/auth/refresh'));
    expect(refreshReqs.length).toBe(1);
    refreshReqs[0].flush({ access_token: 'new-token', token_type: 'bearer' });

    await flushMicrotasks();

    // Both original requests are retried with the new token
    const retryA = httpTesting.expectOne('/api/data-a');
    const retryB = httpTesting.expectOne('/api/data-b');
    expect(retryA.request.headers.get('Authorization')).toBe('Bearer new-token');
    expect(retryB.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryA.flush({ data: 'a' });
    retryB.flush({ data: 'b' });

    expect(resultA).toEqual({ data: 'a' });
    expect(resultB).toEqual({ data: 'b' });
    httpTesting.verify();
  });

  it('should drop queued requests when refresh fails', async () => {
    const { httpClient, httpTesting, router } = setup('old-token');
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let completedA = false;
    let completedB = false;

    // Fire two requests concurrently
    httpClient.get('/api/data-a').subscribe({ next: () => (completedA = true), error: () => (completedA = true) });
    httpClient.get('/api/data-b').subscribe({ next: () => (completedB = true), error: () => (completedB = true) });

    // Both fail with 401
    httpTesting.expectOne('/api/data-a').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    httpTesting.expectOne('/api/data-b').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Only one refresh request
    const refreshReqs = httpTesting.match((r) => r.url.includes('/auth/refresh'));
    expect(refreshReqs.length).toBe(1);
    refreshReqs[0].flush('Expired', { status: 401, statusText: 'Unauthorized' });

    await flushMicrotasks();

    // Logout fires
    httpTesting.match((r) => r.url.includes('/auth/logout')).forEach((r) => r.flush(null));

    expect(nav).toHaveBeenCalledWith(['/login'], expect.any(Object));

    // No retry requests should exist — both requests were dropped
    httpTesting.verify();
  });
});
