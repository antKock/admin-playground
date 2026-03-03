import { Component, computed, input } from '@angular/core';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-surface-base', text: 'text-text-secondary', border: 'border-stroke-standard' },
  review: { bg: 'bg-status-review', text: 'text-text-primary', border: 'border-transparent' },
  modify: { bg: 'bg-status-modify', text: 'text-text-primary', border: 'border-transparent' },
  checked: { bg: 'bg-status-checked', text: 'text-text-primary', border: 'border-transparent' },
  invalid: { bg: 'bg-status-invalid', text: 'text-text-primary', border: 'border-transparent' },
  processing: { bg: 'bg-status-processing', text: 'text-white', border: 'border-transparent' },
  done: { bg: 'bg-status-done', text: 'text-white', border: 'border-transparent' },
  published: { bg: 'bg-status-done', text: 'text-white', border: 'border-transparent' },
  closed: { bg: 'bg-status-closed', text: 'text-text-primary', border: 'border-transparent' },
  disabled: { bg: 'bg-status-closed', text: 'text-text-primary', border: 'border-transparent' },
};

const DEFAULT_COLORS = { bg: 'bg-surface-muted', text: 'text-text-secondary', border: 'border-transparent' };

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="status-badge" [class]="badgeClasses()">
      {{ displayLabel() }}
    </span>
  `,
  styles: `
    .status-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.4;
      border-width: 1px;
    }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly label = input<string>();

  readonly displayLabel = computed(() => this.label() || this.status());

  readonly badgeClasses = computed(() => {
    const colors = STATUS_COLORS[this.status().toLowerCase()] || DEFAULT_COLORS;
    return `${colors.bg} ${colors.text} ${colors.border}`;
  });
}
