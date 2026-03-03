import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { ToastService } from '@app/shared/services/toast.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should not attach Authorization header when no token', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should redirect to login on 401', () => {
    const spy = vi.spyOn(router, 'navigate');

    httpClient.get('/api/test').subscribe({ error: () => { /* expected */ } });

    const req = httpTesting.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(spy).toHaveBeenCalledWith(['/login'], expect.objectContaining({ queryParams: expect.any(Object) }));
  });

  it('should show "Server error" toast on 500', () => {
    const spy = vi.spyOn(toastService, 'error');

    httpClient.get('/api/test').subscribe({ error: () => { /* expected */ } });

    const req = httpTesting.expectOne('/api/test');
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(spy).toHaveBeenCalledWith('Server error');
  });

  it('should show "Connection lost" toast on network error (status 0)', () => {
    const spy = vi.spyOn(toastService, 'error');

    httpClient.get('/api/test').subscribe({ error: () => { /* expected */ } });

    const req = httpTesting.expectOne('/api/test');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(spy).toHaveBeenCalledWith('Connection lost');
  });
});

describe('authInterceptor (with token)', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    // Set token BEFORE TestBed creates AuthService
    localStorage.setItem('laureat_admin_jwt', 'test-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should attach Authorization header when token exists', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });
});
