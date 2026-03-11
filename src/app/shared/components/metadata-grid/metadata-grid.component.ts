import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowUpRight } from 'lucide-angular';
import { formatDateFr } from '@app/shared/utils/format-date';

export interface MetadataField {
  label: string;
  value: string;
  type?: 'text' | 'mono' | 'linked' | 'date' | 'status';
  linkedRoute?: string;
}

@Component({
  selector: 'app-metadata-grid',
  imports: [LucideAngularModule, RouterLink],
  template: `
    <dl class="metadata-grid">
      @for (field of fields(); track field.label) {
        <div class="metadata-field">
          <dt class="text-xs text-text-secondary">{{ field.label }}</dt>
          <dd class="mt-0.5 text-sm text-text-primary" [class.font-mono]="field.type === 'mono'">
            @if (field.type === 'linked' && field.linkedRoute) {
              <a
                class="inline-flex items-center gap-1 text-text-link hover:text-text-link-hover no-underline"
                [routerLink]="field.linkedRoute"
              >
                {{ field.value }}
                <lucide-icon [img]="ArrowUpRight" [size]="14"></lucide-icon>
              </a>
            } @else if (field.type === 'status') {
              <span
                class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
                [class.bg-green-100]="field.value === 'Actif'"
                [class.text-green-800]="field.value === 'Actif'"
                [class.bg-red-100]="field.value !== 'Actif'"
                [class.text-red-800]="field.value !== 'Actif'"
              >
                {{ field.value }}
              </span>
            } @else if (field.type === 'date') {
              {{ formatDate(field.value) }}
            } @else {
              {{ field.value }}
            }
          </dd>
        </div>
      }
    </dl>
  `,
  styles: `
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      padding: 16px;
      background-color: var(--color-surface-subtle);
      border-radius: 8px;
    }

    .metadata-field {
      min-width: 0;
    }
  `,
})
export class MetadataGridComponent {
  readonly fields = input.required<MetadataField[]>();
  readonly ArrowUpRight = ArrowUpRight;

  formatDate(value: string): string {
    return formatDateFr(value);
  }
}
