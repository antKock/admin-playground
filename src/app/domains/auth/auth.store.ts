import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { AuthState, AuthUser, LoginResponse } from './auth.models';

const TOKEN_KEY = 'laureat_admin_jwt';

function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* quota exceeded or access denied */ }
}

function safeRemoveItem(key: string): void {
  try { localStorage.removeItem(key); } catch { /* access denied */ }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload['exp'];
  if (typeof exp !== 'number') return false; // no exp claim → don't reject
  return Date.now() / 1000 > exp;
}

function decodeUser(token: string): { user: AuthUser; expired: boolean } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
    return {
      user: {
        name: (payload['name'] as string) ?? (payload['email'] as string) ?? null,
        email: (payload['email'] as string) ?? null,
        id: (payload['sub'] as string) ?? (payload['id'] as string) ?? null,
        role: (payload['role'] as string) ?? null,
      },
      expired: isTokenExpired(payload),
    };
  } catch {
    return null;
  }
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>({ token: null, user: null }),
  withComputed(store => ({
    isAuthenticated: computed(() => store.token() !== null),
    userName: computed(() => store.user()?.name ?? null),
    userEmail: computed(() => store.user()?.email ?? null),
    userId: computed(() => store.user()?.id ?? null),
    userRole: computed(() => store.user()?.role ?? null),
  })),
  withMethods(store => {
    const http = inject(HttpClient);
    const router = inject(Router);

    return {
      _initFromStorage(): void {
        const token = getStoredToken();
        if (token) {
          const decoded = decodeUser(token);
          if (decoded?.expired) {
            safeRemoveItem(TOKEN_KEY);
            return;
          }
          patchState(store, { token, user: decoded?.user ?? null });
        }
      },

      async login(email: string, password: string): Promise<void> {
        const response = await firstValueFrom(
          http.post<LoginResponse>(
            `${environment.apiBaseUrl}/auth/login`,
            { email, password },
            { withCredentials: true },
          ),
        );
        safeSetItem(TOKEN_KEY, response.access_token);
        patchState(store, {
          token: response.access_token,
          user: decodeUser(response.access_token)?.user ?? null,
        });
      },

      async refresh(): Promise<string> {
        const response = await firstValueFrom(
          http.post<LoginResponse>(
            `${environment.apiBaseUrl}/auth/refresh`,
            {},
            { withCredentials: true },
          ),
        );
        safeSetItem(TOKEN_KEY, response.access_token);
        patchState(store, {
          token: response.access_token,
          user: decodeUser(response.access_token)?.user ?? null,
        });
        return response.access_token;
      },

      logout(returnUrl?: string): void {
        // Fire-and-forget: invalidate refresh token server-side
        http.post(`${environment.apiBaseUrl}/auth/logout`, {}, { withCredentials: true })
          .subscribe({ error: () => { /* ignore — we're logging out anyway */ } });
        safeRemoveItem(TOKEN_KEY);
        patchState(store, { token: null, user: null });
        const extras = returnUrl ? { queryParams: { returnUrl } } : {};
        router.navigate(['/login'], extras);
      },

      setToken(newToken: string): void {
        safeSetItem(TOKEN_KEY, newToken);
        patchState(store, {
          token: newToken,
          user: decodeUser(newToken)?.user ?? null,
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      store._initFromStorage();
    },
  }),
);
