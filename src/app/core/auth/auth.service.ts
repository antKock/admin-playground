import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, firstValueFrom } from 'rxjs';

import { environment } from '@app/../environments/environment';

const TOKEN_KEY = 'laureat_admin_jwt';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(this.getStoredToken());

  readonly isAuthenticated = computed(() => this._token() !== null);

  private readonly decodedPayload = computed<Record<string, unknown> | null>(() => {
    const token = this._token();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  });

  readonly userName = computed(() => {
    const payload = this.decodedPayload();
    if (!payload) return null;
    return (payload['name'] as string) ?? (payload['email'] as string) ?? null;
  });

  readonly userEmail = computed(() => {
    const payload = this.decodedPayload();
    if (!payload) return null;
    return (payload['email'] as string) ?? null;
  });

  readonly userId = computed(() => {
    const payload = this.decodedPayload();
    if (!payload) return null;
    return (payload['sub'] as string) ?? (payload['id'] as string) ?? null;
  });

  readonly userRole = computed(() => {
    const payload = this.decodedPayload();
    if (!payload) return null;
    return (payload['role'] as string) ?? null;
  });

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${environment.apiBaseUrl}/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          localStorage.setItem(TOKEN_KEY, response.access_token);
          this._token.set(response.access_token);
        }),
      );
  }

  /**
   * Attempt a silent token refresh using the httpOnly refresh cookie.
   * Returns the new access token on success.
   */
  async refresh(): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(
        `${environment.apiBaseUrl}/auth/refresh`,
        {},
        { withCredentials: true },
      ),
    );
    localStorage.setItem(TOKEN_KEY, response.access_token);
    this._token.set(response.access_token);
    return response.access_token;
  }

  logout(returnUrl?: string): void {
    // Fire-and-forget: invalidate refresh token server-side
    this.http
      .post(`${environment.apiBaseUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => { /* ignore — we're logging out anyway */ } });
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    const extras = returnUrl ? { queryParams: { returnUrl } } : {};
    this.router.navigate(['/login'], extras);
  }

  /**
   * Update the stored access token (used by interceptor after refresh).
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  getToken(): string | null {
    return this._token();
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
