import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthStore } from './auth.store';

// Helper to create a fake JWT with the given payload
function fakeToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    store = TestBed.inject(AuthStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should start as not authenticated with no stored token', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.token()).toBeNull();
    expect(store.user()).toBeNull();
  });

  it('should initialize from localStorage token', () => {
    const token = fakeToken({ email: 'user@example.com', name: 'Test', sub: 'user-1', role: 'admin' });
    localStorage.setItem('laureat_admin_jwt', token);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const freshStore = TestBed.inject(AuthStore);

    expect(freshStore.isAuthenticated()).toBe(true);
    expect(freshStore.token()).toBe(token);
    expect(freshStore.userEmail()).toBe('user@example.com');
    expect(freshStore.userName()).toBe('Test');
    expect(freshStore.userId()).toBe('user-1');
    expect(freshStore.userRole()).toBe('admin');
  });

  it('should set token and user on login', async () => {
    const token = fakeToken({ email: 'a@b.com', name: 'A', sub: 'u1', role: 'admin' });
    const loginPromise = store.login('a@b.com', 'pass');

    const req = httpTesting.expectOne(r => r.url.includes('/auth/login') && r.method === 'POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'pass' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ access_token: token, token_type: 'bearer' });

    await loginPromise;

    expect(store.isAuthenticated()).toBe(true);
    expect(store.token()).toBe(token);
    expect(store.userEmail()).toBe('a@b.com');
    expect(localStorage.getItem('laureat_admin_jwt')).toBe(token);
  });

  it('should clear state on logout and navigate to /login', () => {
    const token = fakeToken({ email: 'a@b.com' });
    localStorage.setItem('laureat_admin_jwt', token);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const freshStore = TestBed.inject(AuthStore);
    const routerSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const freshHttp = TestBed.inject(HttpTestingController);

    freshStore.logout();

    const logoutReq = freshHttp.expectOne(r => r.url.includes('/auth/logout') && r.method === 'POST');
    logoutReq.flush(null);

    expect(freshStore.isAuthenticated()).toBe(false);
    expect(freshStore.token()).toBeNull();
    expect(freshStore.user()).toBeNull();
    expect(localStorage.getItem('laureat_admin_jwt')).toBeNull();
    expect(routerSpy).toHaveBeenCalledWith(['/login'], {});

    freshHttp.verify();
  });

  it('should update token on refresh', async () => {
    const oldToken = fakeToken({ email: 'old@b.com' });
    const newToken = fakeToken({ email: 'new@b.com', name: 'New' });
    localStorage.setItem('laureat_admin_jwt', oldToken);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const freshStore = TestBed.inject(AuthStore);
    const freshHttp = TestBed.inject(HttpTestingController);

    const refreshPromise = freshStore.refresh();

    const req = freshHttp.expectOne(r => r.url.includes('/auth/refresh') && r.method === 'POST');
    req.flush({ access_token: newToken, token_type: 'bearer' });

    const result = await refreshPromise;

    expect(result).toBe(newToken);
    expect(freshStore.token()).toBe(newToken);
    expect(freshStore.userEmail()).toBe('new@b.com');
    expect(localStorage.getItem('laureat_admin_jwt')).toBe(newToken);

    freshHttp.verify();
  });

  it('should update token and user on setToken', () => {
    const token = fakeToken({ email: 'set@b.com', sub: 'u2', role: 'editor' });
    store.setToken(token);

    expect(store.token()).toBe(token);
    expect(store.userEmail()).toBe('set@b.com');
    expect(store.userId()).toBe('u2');
    expect(store.userRole()).toBe('editor');
    expect(localStorage.getItem('laureat_admin_jwt')).toBe(token);
  });

  it('should compute isAuthenticated correctly', () => {
    expect(store.isAuthenticated()).toBe(false);
    const token = fakeToken({ email: 'a@b.com' });
    store.setToken(token);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('should reject login with invalid credentials', async () => {
    const loginPromise = store.login('bad@b.com', 'wrong');

    const req = httpTesting.expectOne(r => r.url.includes('/auth/login'));
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await expect(loginPromise).rejects.toBeTruthy();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.token()).toBeNull();
  });

  it('should clear expired token from localStorage on init', () => {
    const expiredPayload = { email: 'a@b.com', exp: Math.floor(Date.now() / 1000) - 3600 };
    const expiredToken = fakeToken(expiredPayload);
    localStorage.setItem('laureat_admin_jwt', expiredToken);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const freshStore = TestBed.inject(AuthStore);

    expect(freshStore.isAuthenticated()).toBe(false);
    expect(freshStore.token()).toBeNull();
    expect(localStorage.getItem('laureat_admin_jwt')).toBeNull();
  });
});
