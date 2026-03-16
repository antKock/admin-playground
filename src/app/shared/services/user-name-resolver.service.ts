import { Injectable, inject, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@app/../environments/environment';

interface UserNameEntry {
  name: Signal<string>;
  _writable: ReturnType<typeof signal<string>>;
}

@Injectable({ providedIn: 'root' })
export class UserNameResolverService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, UserNameEntry>();

  resolve(id: string | null | undefined): string {
    if (!id) return '—';

    const cached = this.cache.get(id);
    if (cached) return cached.name();

    const _writable = signal('…');
    const entry: UserNameEntry = { name: _writable.asReadonly(), _writable };
    this.cache.set(id, entry);

    this.http
      .get<{ first_name: string; last_name: string }>(`${environment.apiBaseUrl}/users/${id}`)
      .subscribe({
        next: (user) => _writable.set(`${user.first_name} ${user.last_name}`),
        error: () => _writable.set('Utilisateur inconnu'),
      });

    return _writable();
  }
}
