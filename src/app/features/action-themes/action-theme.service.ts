import { Injectable } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';

import { BaseEntityService } from '@app/core/api/base-entity.service';
import { ActionTheme } from './action-theme.model';

@Injectable({ providedIn: 'root' })
export class ActionThemeService extends BaseEntityService<ActionTheme> {
  constructor() {
    super('action-themes');
  }

  protected getId(item: ActionTheme): string {
    return item.id;
  }

  publish(id: string): Observable<ActionTheme> {
    return this.statusAction(id, 'publish');
  }

  disable(id: string): Observable<ActionTheme> {
    return this.statusAction(id, 'disable');
  }

  activate(id: string): Observable<ActionTheme> {
    return this.statusAction(id, 'activate');
  }

  duplicate(id: string): Observable<ActionTheme> {
    const url = `${this.baseUrl}${id}/duplicate`;
    return this.http.post<ActionTheme>(url, {});
  }

  private statusAction(id: string, action: string): Observable<ActionTheme> {
    const url = `${this.baseUrl}${id}/${action}`;
    return this.http.put<ActionTheme>(url, {}).pipe(
      tap((response) => this.setSelectedItem(response)),
    );
  }
}
