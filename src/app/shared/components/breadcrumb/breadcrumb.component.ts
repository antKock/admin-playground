import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        @for (item of items(); track $index; let last = $last) {
          <li>
            @if (item.route && !last) {
              <a [routerLink]="item.route" class="breadcrumb-link">{{ item.label }}</a>
            } @else {
              <span class="breadcrumb-current" [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            }
            @if (!last) {
              <span class="breadcrumb-separator" aria-hidden="true">&rsaquo;</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    .breadcrumb {
      font-size: 13px;
      margin-bottom: 12px;
    }

    .breadcrumb-list {
      display: flex;
      align-items: center;
      gap: 6px;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .breadcrumb-link {
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: color 0.15s;
    }

    .breadcrumb-link:hover {
      color: var(--color-text-primary);
    }

    .breadcrumb-separator {
      color: var(--color-text-tertiary);
      font-size: 14px;
    }

    .breadcrumb-current {
      color: var(--color-text-primary);
    }
  `,
})
export class BreadcrumbComponent {
  readonly items = input.required<BreadcrumbItem[]>();
}
