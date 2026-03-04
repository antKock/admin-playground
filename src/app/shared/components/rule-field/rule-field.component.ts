import { Component, input, output, signal, computed } from '@angular/core';

function extractVariables(jsonLogicStr: string): string[] {
  if (!jsonLogicStr || jsonLogicStr === 'true' || jsonLogicStr === 'false') return [];
  try {
    const parsed = JSON.parse(jsonLogicStr);
    const vars: string[] = [];
    const walk = (obj: unknown): void => {
      if (obj && typeof obj === 'object') {
        if ('var' in (obj as Record<string, unknown>)) {
          const v = (obj as Record<string, unknown>)['var'];
          if (typeof v === 'string') vars.push(v);
        }
        for (const val of Object.values(obj as Record<string, unknown>)) {
          walk(val);
        }
      }
    };
    walk(parsed);
    return [...new Set(vars)];
  } catch {
    return [];
  }
}

@Component({
  selector: 'app-rule-field',
  template: `
    <div class="rule-field">
      <div class="rule-field-header">
        <span class="rule-field-label">{{ label() }}</span>
      </div>
      @if (variablesLabel()) {
        <div class="rule-reference">
          <em>{{ variablesLabel() }}</em>
        </div>
      }
      <textarea
        [class.error]="hasError()"
        [placeholder]="placeholder()"
        [value]="value()"
        [rows]="3"
        (input)="onInput($event)"
        (blur)="onBlur()"
      ></textarea>
      @if (hasError()) {
        <div class="rule-hint" style="color: var(--color-text-error, #dc2626);">Invalid JSON syntax</div>
      } @else {
        <div class="rule-hint">Leave empty for simple ON (no conditional logic)</div>
      }
    </div>
  `,
  styles: [`
    .rule-field {
      width: 100%;
      margin-top: 12px;
      padding: 12px;
      background: var(--color-surface-base);
      border: 1px solid var(--color-stroke-brand, #1400cc33);
      border-radius: 8px;
    }
    .rule-field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .rule-field-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-brand, #1400cc);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .rule-reference {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
      padding: 8px 12px;
      background: var(--color-surface-subtle);
      border-radius: 6px;
      border-left: 3px solid var(--color-brand-light, #f0edff);
      line-height: 1.6;
    }
    .rule-reference em {
      color: var(--color-text-primary);
      font-style: italic;
    }
    textarea {
      width: 100%;
      min-height: 60px;
      padding: 8px;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      border: 1px solid var(--color-stroke-standard);
      border-radius: 6px;
      resize: vertical;
      color: var(--color-text-primary);
      background: var(--color-surface-base);
      box-sizing: border-box;
    }
    textarea:focus {
      outline: none;
      border-color: var(--color-brand, #1400cc);
      box-shadow: 0 0 0 3px rgba(20, 0, 204, 0.08);
    }
    textarea.error {
      border-color: var(--color-text-error, #dc2626);
      color: var(--color-text-error, #dc2626);
    }
    .rule-hint {
      font-size: 11px;
      color: var(--color-text-tertiary);
      margin-top: 4px;
    }
  `],
})
export class RuleFieldComponent {
  readonly value = input('');
  readonly label = input('JSONLogic Rule');
  readonly placeholder = input('{"==": [{"var": "field_name"}, "value"]}');

  readonly valueChange = output<string>();
  readonly validChange = output<boolean>();

  readonly hasError = signal(false);
  private localValue = '';

  readonly variablesLabel = computed(() => {
    const vars = extractVariables(this.value());
    return vars.length > 0
      ? `Rule references: ${vars.join(', ')}`
      : '';
  });

  onInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.localValue = val;
    this.valueChange.emit(val);
    if (this.hasError()) {
      this.validate(val);
    }
  }

  onBlur(): void {
    this.validate(this.localValue || this.value());
  }

  private validate(val: string): void {
    const trimmed = val.trim();
    if (!trimmed) {
      this.hasError.set(false);
      this.validChange.emit(true);
      return;
    }
    try {
      JSON.parse(trimmed);
      this.hasError.set(false);
      this.validChange.emit(true);
    } catch {
      this.hasError.set(true);
      this.validChange.emit(false);
    }
  }
}
