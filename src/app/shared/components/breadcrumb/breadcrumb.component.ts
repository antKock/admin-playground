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
      @for (item of items(); track $index; let last = $last) {
        @if (item.route && !last) {
          <a [routerLink]="item.route" class="breadcrumb-link">{{ item.label }}</a>
        } @else {
          <span class="breadcrumb-current">{{ item.label }}</span>
        }
        @if (!last) {
          <span class="breadcrumb-separator" aria-hidden="true">&rsaquo;</span>
        }
      }
    </nav>
  `,
  styles: `
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      margin-bottom: 12px;
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
