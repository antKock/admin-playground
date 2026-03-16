import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { authGuard, adminGuard } from './auth.guard';

/** Build a fake JWT with the given payload (no signature verification in tests). */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-sig`;
}

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should redirect to login when not authenticated', () => {
    const mockRoute = {} as Parameters<typeof authGuard>[0];
    const mockState = { url: '/funding-programs' } as Parameters<typeof authGuard>[1];

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBeTruthy();
    // Should return a UrlTree for redirect
    expect(result).not.toBe(true);
  });

  it('should include returnUrl query param when redirecting to login', () => {
    const mockRoute = {} as Parameters<typeof authGuard>[0];
    const mockState = { url: '/action-models/abc123' } as Parameters<typeof authGuard>[1];

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    // UrlTree should contain returnUrl query param
    expect(result).not.toBe(true);
    expect(String(result)).toContain('returnUrl');
    expect(String(result)).toContain('action-models');
  });

  it('should allow navigation when authenticated', () => {
    localStorage.setItem('laureat_admin_jwt', 'test-token');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const mockRoute = {} as Parameters<typeof authGuard>[0];
    const mockState = { url: '/funding-programs' } as Parameters<typeof authGuard>[1];

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBe(true);
  });
});

describe('adminGuard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow admin users', () => {
    localStorage.setItem('laureat_admin_jwt', fakeJwt({ role: 'admin', email: 'a@b.com' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const mockRoute = {} as Parameters<typeof adminGuard>[0];
    const mockState = { url: '/' } as Parameters<typeof adminGuard>[1];

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should allow cdm users', () => {
    localStorage.setItem('laureat_admin_jwt', fakeJwt({ role: 'cdm', email: 'c@b.com' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const mockRoute = {} as Parameters<typeof adminGuard>[0];
    const mockState = { url: '/' } as Parameters<typeof adminGuard>[1];

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should block collectivite users', () => {
    localStorage.setItem('laureat_admin_jwt', fakeJwt({ role: 'collectivite', email: 'u@b.com' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const mockRoute = {} as Parameters<typeof adminGuard>[0];
    const mockState = { url: '/' } as Parameters<typeof adminGuard>[1];

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(false);
  });

  it('should redirect to login when not authenticated', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const mockRoute = {} as Parameters<typeof adminGuard>[0];
    const mockState = { url: '/sites' } as Parameters<typeof adminGuard>[1];

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result).not.toBe(false);
  });
});
