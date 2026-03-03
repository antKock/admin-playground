import { Component, input, output } from '@angular/core';
import { LucideAngularModule, ArrowUpRight } from 'lucide-angular';

export interface MetadataField {
  label: string;
  value: string;
  type?: 'text' | 'mono' | 'linked';
  linkedRoute?: string;
}

@Component({
  selector: 'app-metadata-grid',
  imports: [LucideAngularModule],
  template: `
    <div class="metadata-grid">
      @for (field of fields(); track field.label) {
        <div class="metadata-field">
          <dt class="text-xs text-text-secondary">{{ field.label }}</dt>
          <dd class="mt-0.5 text-sm text-text-primary" [class.font-mono]="field.type === 'mono'">
            @if (field.type === 'linked' && field.linkedRoute) {
              <button
                class="inline-flex items-center gap-1 text-text-link hover:text-text-link-hover"
                (click)="navigateToLinked.emit(field.linkedRoute)"
              >
                {{ field.value }}
                <lucide-icon [img]="ArrowUpRight" [size]="14"></lucide-icon>
              </button>
            } @else {
              {{ field.value }}
            }
          </dd>
        </div>
      }
    </div>
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
  readonly navigateToLinked = output<string>();

  readonly ArrowUpRight = ArrowUpRight;
}
