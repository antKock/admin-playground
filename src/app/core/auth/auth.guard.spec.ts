import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { authGuard } from './auth.guard';

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
