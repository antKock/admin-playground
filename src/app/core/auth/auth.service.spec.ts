import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('test-jwt-token');
    expect(localStorage.getItem('laureat_admin_jwt')).toBe('test-jwt-token');
  });

  it('should clear token on logout', () => {
    localStorage.setItem('laureat_admin_jwt', 'some-token');
    // Recreate service to pick up stored token
    service = TestBed.inject(AuthService);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('laureat_admin_jwt')).toBeNull();
  });

  it('should read token from localStorage on init', () => {
    localStorage.setItem('laureat_admin_jwt', 'existing-token');
    // Need fresh instance to read from localStorage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const freshService = TestBed.inject(AuthService);

    expect(freshService.isAuthenticated()).toBe(true);
    expect(freshService.getToken()).toBe('existing-token');
  });
});
