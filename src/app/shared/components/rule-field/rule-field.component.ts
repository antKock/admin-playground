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
    <div class="mt-1 space-y-1">
      <p class="text-xs text-text-secondary">
        {{ variablesLabel() }}
      </p>
      <textarea
        class="w-full px-3 py-2 border rounded-lg text-sm bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand font-mono"
        [class.border-border]="!hasError()"
        [class.border-red-500]="hasError()"
        [class.text-text-primary]="!hasError()"
        [class.text-red-600]="hasError()"
        [placeholder]="placeholder()"
        [value]="value()"
        [rows]="3"
        (input)="onInput($event)"
        (blur)="onBlur()"
      ></textarea>
      @if (hasError()) {
        <p class="text-xs text-red-500">Invalid JSON syntax</p>
      }
      <p class="text-xs text-text-secondary">Enter a valid JSONLogic expression</p>
    </div>
  `,
})
export class RuleFieldComponent {
  readonly value = input('');
  readonly label = input('JSONLOGIC RULE');
  readonly placeholder = input('{"==": [{"var": "field_name"}, "value"]}');

  readonly valueChange = output<string>();
  readonly validChange = output<boolean>();

  readonly hasError = signal(false);
  // Track local textarea value for blur validation (avoids stale input signal timing)
  private localValue = '';

  readonly variablesLabel = computed(() => {
    const vars = extractVariables(this.value());
    return vars.length > 0
      ? `Rule references: ${vars.join(', ')}`
      : 'No rule variables detected';
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
