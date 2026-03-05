/**
 * JSONLogic rule editor powered by CodeMirror 6.
 *
 * Embeds a JSON editor with syntax highlighting, live linting, variable extraction,
 * and a prose translation overlay (via jsonlogic-prose.ts).
 *
 * Inputs:
 *   - value: the raw JSON string (e.g. '{">":[{"var":"score"},50]}')
 *   - placeholder: editor placeholder text
 *
 * Outputs:
 *   - valueChange: emits on every keystroke with the raw editor content
 *   - validChange: emits true/false when JSON validity changes (for parent form validation)
 *
 * Note: `suppressEmit` prevents circular updates when the parent pushes a new value
 * into the editor programmatically via the effect — without it, the editor's updateListener
 * would re-emit the same value back to the parent.
 */
import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { bracketMatching } from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';
import { linter, type Diagnostic, lintGutter } from '@codemirror/lint';
import { translateJsonLogicToProse } from '../../utils/jsonlogic-prose';
import { validateJsonLogic } from '../../utils/jsonlogic-validate';

function extractVariables(jsonLogicStr: string): string[] {
  if (!jsonLogicStr || jsonLogicStr === 'true' || jsonLogicStr === 'false') return [];
  try {
    const parsed = JSON.parse(jsonLogicStr);
    const vars: string[] = [];
    const walk = (obj: unknown): void => {
      if (obj && typeof obj === 'object') {
        if ('var' in (obj as Record<string, unknown>)) {
          const v = (obj as Record<string, unknown>)['var'];
          if (typeof v === 'string' && v !== '') vars.push(v);
          if (typeof v === 'number') vars.push(String(v));
          // Array syntax: {"var": ["name", default]}
          if (Array.isArray(v) && v.length >= 1) {
            if (typeof v[0] === 'string' && v[0] !== '') vars.push(v[0]);
            if (typeof v[0] === 'number') vars.push(String(v[0]));
          }
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

/** Custom JSON + JSONLogic linter for CodeMirror 6 */
function jsonLogicLinter(): (view: EditorView) => Diagnostic[] {
  return (view: EditorView): Diagnostic[] => {
    const doc = view.state.doc.toString();
    const trimmed = doc.trim();
    if (!trimmed) return [];
    try {
      JSON.parse(trimmed);
    } catch (e) {
      const msg = e instanceof SyntaxError ? e.message : 'JSON invalide';
      const posMatch = msg.match(/position\s+(\d+)/i);
      let from = 0;
      let to = doc.length;
      if (posMatch) {
        const leadingWhitespace = doc.length - doc.trimStart().length;
        from = Math.min(parseInt(posMatch[1], 10) + leadingWhitespace, doc.length);
        to = Math.min(from + 1, doc.length);
      }
      return [{ from, to, severity: 'error', message: msg }];
    }

    // JSON is valid — now validate JSONLogic structure (warnings, not blocking)
    const logicErrors = validateJsonLogic(trimmed);
    return logicErrors.map((err) => ({
      from: 0,
      to: doc.length,
      severity: 'warning' as const,
      message: err.message,
    }));
  };
}

/** Custom CM6 theme matching the app's design tokens */
const ruleFieldTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    border: '1px solid var(--color-stroke-standard)',
    borderRadius: '6px',
    background: 'var(--color-surface-base)',
  },
  '&.cm-focused': {
    outline: 'none',
    borderColor: 'var(--color-brand, #1400cc)',
    boxShadow: '0 0 0 3px rgba(20, 0, 204, 0.08)',
  },
  '.cm-content': {
    padding: '8px',
    caretColor: 'var(--color-text-primary)',
    color: 'var(--color-text-primary)',
  },
  '.cm-gutters': {
    background: 'var(--color-surface-muted)',
    borderRight: '1px solid var(--color-stroke-standard)',
    borderRadius: '6px 0 0 6px',
    color: 'var(--color-text-tertiary)',
  },
  '.cm-activeLine': {
    background: 'rgba(20, 0, 204, 0.03)',
  },
  '.cm-selectionBackground, ::selection': {
    background: 'rgba(20, 0, 204, 0.08) !important',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-brand, #1400cc)',
  },
  // JSON string token highlighting — uses CM6 internal generated class.
  // If this breaks after a CM upgrade, replace with syntaxHighlighting(HighlightStyle.define(...))
  '.ͼc': {
    color: 'var(--color-brand, #1400cc)',
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--color-text-error, #dc2626)',
  },
  '.cm-diagnostic-error': {
    borderLeftColor: 'var(--color-text-error, #dc2626)',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--color-status-warning, #d97706)',
  },
  '.cm-diagnostic-warning': {
    borderLeftColor: 'var(--color-status-warning, #d97706)',
  },
});

@Component({
  selector: 'app-rule-field',
  template: `
    <div class="rule-field" [class.valid]="isValidJsonLogic()">
      <div class="rule-field-header">
        <span class="rule-field-label">{{ label() }}</span>
      </div>
      @if (variablesLabel()) {
        <div class="rule-reference">
          <em>{{ variablesLabel() }}</em>
        </div>
      }
      @if (proseTranslation()) {
        <div class="rule-prose">
          <em>Le paramètre est activé si {{ proseTranslation() }}</em>
        </div>
      }
      <div class="cm-host" #editorHost></div>
      @if (errorMessage()) {
        <div class="rule-hint" [class.error-hint]="hasError()" [class.warning-hint]="!hasError()">{{ errorMessage() }}</div>
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
    .rule-field.valid {
      border-color: var(--color-status-success, #16a34a);
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
    .rule-prose {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
      padding: 8px 12px;
      background: var(--color-surface-subtle);
      border-radius: 6px;
      border-left: 3px solid var(--color-brand, #1400cc);
      line-height: 1.6;
    }
    .rule-prose em {
      color: var(--color-text-primary);
      font-style: italic;
    }
    .cm-host {
      width: 100%;
    }
    .rule-hint {
      font-size: 11px;
      color: var(--color-text-tertiary);
      margin-top: 4px;
    }
    .error-hint {
      color: var(--color-text-error, #dc2626);
    }
    .warning-hint {
      color: var(--color-status-warning, #d97706);
    }
  `],
})
export class RuleFieldComponent implements AfterViewInit, OnDestroy {
  readonly value = input('');
  readonly label = input('JSONLogic Rule');
  readonly placeholder = input('');

  readonly valueChange = output<string>();
  readonly validChange = output<boolean>();

  readonly hasError = signal(false);
  readonly errorMessage = signal('');

  private editorHost = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private editorView: EditorView | null = null;
  private suppressEmit = false;

  readonly variablesLabel = computed(() => {
    const vars = extractVariables(this.value());
    return vars.length > 0
      ? `Variables référencées : ${vars.join(', ')}`
      : '';
  });

  readonly proseTranslation = computed(() => translateJsonLogicToProse(this.value()));

  readonly isValidJsonLogic = computed(() => {
    const val = this.value().trim();
    if (!val) return false;
    try {
      JSON.parse(val);
    } catch {
      return false;
    }
    return validateJsonLogic(val).length === 0;
  });

  constructor() {
    // Sync external value changes into the editor and validate
    effect(() => {
      const newVal = this.value();
      if (this.editorView) {
        const currentDoc = this.editorView.state.doc.toString();
        if (newVal !== currentDoc) {
          this.suppressEmit = true;
          this.editorView.dispatch({
            changes: { from: 0, to: currentDoc.length, insert: newVal },
          });
          this.suppressEmit = false;
          this.validateJson(newVal);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    const jsonLint = linter(jsonLogicLinter(), { delay: 300 });

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !this.suppressEmit) {
        const val = update.state.doc.toString();
        this.valueChange.emit(val);
        this.validateJson(val);
      }
    });

    const startState = EditorState.create({
      doc: this.value(),
      extensions: [
        json(),
        bracketMatching(),
        keymap.of([indentWithTab]),
        jsonLint,
        lintGutter(),
        ruleFieldTheme,
        cmPlaceholder(this.placeholder()),
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    this.editorView = new EditorView({
      state: startState,
      parent: this.editorHost().nativeElement,
    });
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
    this.editorView = null;
  }

  private validateJson(val: string): void {
    const trimmed = val.trim();
    if (!trimmed) {
      this.hasError.set(false);
      this.errorMessage.set('');
      this.validChange.emit(true);
      return;
    }
    try {
      JSON.parse(trimmed);
    } catch (e) {
      const msg = e instanceof SyntaxError ? e.message : 'JSON invalide';
      this.hasError.set(true);
      this.errorMessage.set(msg);
      this.validChange.emit(false);
      return;
    }
    // JSON is valid — check JSONLogic structure (non-blocking, informational only)
    const logicErrors = validateJsonLogic(trimmed);
    if (logicErrors.length > 0) {
      this.hasError.set(false);
      this.errorMessage.set(logicErrors[0].message);
      this.validChange.emit(true);
    } else {
      this.hasError.set(false);
      this.errorMessage.set('');
      this.validChange.emit(true);
    }
  }
}
