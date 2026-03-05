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
import { translateJsonLogicToProse, type ProseMode } from '../../utils/jsonlogic-prose';
import { validateJsonLogic } from '../../utils/jsonlogic-validate';

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
    <div class="rule-field">
      <div class="rule-field-header">
        <span class="rule-field-label">{{ label() }}</span>
      </div>
      @let parts = proseParts();
      @if (parts) {
        <div class="rule-prose">
          <em [innerHTML]="parts.prefix"></em>
          @if (parts.branches) {
            <ul class="rule-or-list">
              @for (branch of parts.branches; track branch) {
                <li [innerHTML]="branch"></li>
              }
            </ul>
          }
        </div>
      }
      @if (errorMessage()) {
        <div class="rule-prose" [class.rule-error]="hasError()" [class.rule-warning]="!hasError()">
          <em>{{ errorMessage() }}</em>
        </div>
      }
      <div class="cm-host" #editorHost></div>
    </div>
  `,
  styles: [`
    .rule-field {
      width: 100%;
      margin-top: 6px;
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
      font-style: italic;
    }
    .rule-prose :is(em, li) strong {
      color: var(--color-text-primary);
      font-weight: 600;
    }
    .rule-or-list {
      margin: 6px 0 0;
      padding-left: 20px;
      list-style: disc;
    }
    .rule-or-list li {
      color: var(--color-text-primary);
      padding: 3px 0;
    }
    .rule-or-list li + li {
      border-top: 1px solid var(--color-stroke-standard);
      margin-top: 3px;
      padding-top: 6px;
    }
    .cm-host {
      width: 100%;
    }
    .rule-error {
      border-left-color: var(--color-text-error, #dc2626);
      color: var(--color-text-error, #dc2626);
    }
    .rule-warning {
      border-left-color: var(--color-status-warning, #d97706);
      color: var(--color-status-warning, #d97706);
    }
  `],
})
export class RuleFieldComponent implements AfterViewInit, OnDestroy {
  readonly value = input('');
  readonly label = input('JSONLogic Rule');
  readonly placeholder = input('');
  readonly mode = input<ProseMode>('condition');

  readonly valueChange = output<string>();
  readonly validChange = output<boolean>();

  readonly hasError = signal(false);
  readonly errorMessage = signal('');

  private editorHost = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private editorView: EditorView | null = null;
  private suppressEmit = false;

  readonly proseTranslation = computed(() => translateJsonLogicToProse(this.value(), this.mode()));

  readonly proseParts = computed(() => {
    const prose = this.proseTranslation();
    if (!prose) return null;
    const isValue = this.mode() === 'value';
    const lines = prose.split('\n');
    if (lines.length > 1) {
      return {
        prefix: isValue
          ? "La valeur par défaut est celle correspondant à la première condition vérifiée :"
          : "Le paramètre est activé si au moins une de ces conditions est vraie :",
        branches: lines.map((l) => l.replace(/^• /, '')),
      };
    }
    const singlePrefix = isValue
      ? `La valeur par défaut est : ${prose}`
      : `Le paramètre est activé si ${prose}`;
    return { prefix: singlePrefix, branches: null };
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
    } catch {
      this.hasError.set(true);
      this.errorMessage.set('JSON invalide — vérifiez la syntaxe (accolades, guillemets, virgules)');
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
