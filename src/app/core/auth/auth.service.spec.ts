import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService, LoginResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should start as not authenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('should store token on successful login', () => {
    const mockResponse: LoginResponse = {
      access_token: 'test-jwt-token',
      token_type: 'bearer',
    };

    service.login('test@example.com', 'password').subscribe();

    const req = httpTesting.expectOne((r) => r.url.includes('/auth/login') && r.method === 'POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password' });
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('test-jwt-token');
    expect(localStorage.getItem('laureat_admin_jwt')).toBe('test-jwt-token');
  });

  it('should clear token on logout and call POST /auth/logout', () => {
    localStorage.setItem('laureat_admin_jwt', 'some-token');
    service = TestBed.inject(AuthService);

    const routerSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    service.logout();

    // Should call POST /auth/logout to invalidate refresh token
    const logoutReq = httpTesting.expectOne((r) => r.url.includes('/auth/logout') && r.method === 'POST');
    expect(logoutReq.request.withCredentials).toBe(true);
    logoutReq.flush(null);

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('laureat_admin_jwt')).toBeNull();
    expect(routerSpy).toHaveBeenCalledWith(['/login'], {});
  });

  it('should pass returnUrl as query param when logout called with returnUrl', () => {
    localStorage.setItem('laureat_admin_jwt', 'some-token');
    service = TestBed.inject(AuthService);

    const routerSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    service.logout('/dashboard');

    httpTesting.expectOne((r) => r.url.includes('/auth/logout')).flush(null);

    expect(routerSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/dashboard' } });
  });

  it('should refresh token successfully', async () => {
    localStorage.setItem('laureat_admin_jwt', 'old-token');
    service = TestBed.inject(AuthService);

    const refreshPromise = service.refresh();

    const req = httpTesting.expectOne((r) => r.url.includes('/auth/refresh') && r.method === 'POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ access_token: 'new-token', token_type: 'bearer' });

    const newToken = await refreshPromise;
    expect(newToken).toBe('new-token');
    expect(service.getToken()).toBe('new-token');
    expect(localStorage.getItem('laureat_admin_jwt')).toBe('new-token');
  });

  it('should extract userEmail from JWT payload', () => {
    const payload = btoa(JSON.stringify({ email: 'user@example.com', name: 'Test User' }));
    const fakeToken = `header.${payload}.signature`;
    localStorage.setItem('laureat_admin_jwt', fakeToken);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const freshService = TestBed.inject(AuthService);
    expect(freshService.userEmail()).toBe('user@example.com');
  });

  it('should return null userEmail when no token', () => {
    expect(service.userEmail()).toBeNull();
  });

  it('should read token from localStorage on init', () => {
    localStorage.setItem('laureat_admin_jwt', 'existing-token');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const freshService = TestBed.inject(AuthService);

    expect(freshService.isAuthenticated()).toBe(true);
    expect(freshService.getToken()).toBe('existing-token');
  });
});
