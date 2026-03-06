/**
 * JSONLogic rule editor powered by CodeMirror 6.
 *
 * Supports 4 states: texte-read, texte-edit, json-read, json-edit
 * controlled by a `RuleEditorState` signal.
 *
 * Inputs:
 *   - value: the raw JSON string (e.g. '{">":[{"var":"score"},50]}')
 *   - placeholder: editor placeholder text
 *
 * Outputs:
 *   - valueChange: emits on every keystroke with the raw editor content
 *   - validChange: emits true/false when JSON validity changes (for parent form validation)
 *
 * @see docs/jsonlogic-prose-architecture.md
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
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { bracketMatching } from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';
import { history } from '@codemirror/commands';
import { linter, type Diagnostic, lintGutter } from '@codemirror/lint';
import { translateJsonLogicToProse, type ProseMode } from '../../utils/jsonlogic-prose';
import { validateJsonLogic } from '../../utils/jsonlogic-validate';
import { parseProse, type ParseResult, type ParseError, stripHtml, decodeHtmlEntities } from '../../utils/prose-parser';
import { proseLanguageExtension } from '../../utils/prose-codemirror-language';
import { tokenize } from '../../utils/prose-tokenizer';
import { autocompletion } from '@codemirror/autocomplete';
import { createProseCompletionSource } from '../../utils/prose-autocomplete';
import { VariableDictionaryService } from '../../services/variable-dictionary.service';

export type RuleEditorState = 'texte-read' | 'texte-edit' | 'json-read' | 'json-edit';

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

/** Prose editor theme — neutralizes focus border/shadow for prose CM instances */
export const proseEditorTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    border: '1px solid var(--color-stroke-standard)',
    borderRadius: '6px',
    background: 'var(--color-surface-base)',
  },
  '&.cm-focused': {
    outline: 'none',
    borderColor: 'var(--color-stroke-standard)',
    boxShadow: 'none',
  },
  '.cm-content': {
    padding: '8px',
    caretColor: 'var(--color-text-primary)',
    color: 'var(--color-text-primary)',
    lineHeight: '1.6',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-brand, #1400cc)',
  },
  '.cm-selectionBackground, ::selection': {
    background: 'rgba(20, 0, 204, 0.08) !important',
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
  '.cm-tooltip-autocomplete': {
    minWidth: '260px',
    border: '1px solid var(--color-stroke-standard)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete ul': {
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  '.cm-tooltip-autocomplete ul li:not(.cm-completionSection)': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 12px',
    fontSize: '13px',
    borderBottom: '1px solid var(--color-surface-subtle, #f0f0f0)',
  },
  '.cm-tooltip-autocomplete ul li:last-child:not(.cm-completionSection)': {
    borderBottom: 'none',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    background: 'var(--color-surface-active, #f0f0ff)',
  },
  '.cm-completionLabel': {
    color: 'var(--color-text-primary)',
    flex: '1',
  },
  '.cm-completionDetail': {
    fontSize: '11px',
    color: 'var(--color-text-tertiary, #888)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontStyle: 'normal',
    background: 'var(--color-surface-muted, #f5f5f5)',
    padding: '1px 6px',
    borderRadius: '3px',
    marginLeft: '8px',
  },
  '.cm-completionSection': {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--color-text-tertiary, #888)',
    padding: '6px 12px 4px',
    background: 'var(--color-surface-subtle, #f8f8f8)',
    borderBottom: '1px solid var(--color-surface-subtle, #f0f0f0)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  },
  '.cm-completionIcon': {
    display: 'none',
  },
});

/**
 * Convert HTML prose output (from translateJsonLogicToProse) to plain text
 * suitable for the prose CodeMirror editor.
 */
function proseToPlainText(html: string): string {
  return decodeHtmlEntities(stripHtml(html));
}

/**
 * Convert bullet-prefixed prose lines to blank-line-separated blocks.
 * Input:  "• condition1 et condition2\n• condition3"
 * Output: "condition1 et condition2\n\ncondition3"
 */
function bulletsToBlankLines(prose: string): string {
  const lines = prose.split('\n');
  return lines
    .map((l) => l.replace(/^• /, ''))
    .join('\n\n');
}

/** Recursively extract all variable paths from a JSONLogic object */
function extractVarPaths(jsonLogic: unknown): string[] {
  const paths: string[] = [];
  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    if ('var' in obj) {
      const v = obj['var'];
      if (typeof v === 'string' && v) paths.push(v);
      else if (Array.isArray(v) && typeof v[0] === 'string' && v[0]) paths.push(v[0]);
      return;
    }
    for (const key of Object.keys(obj)) {
      walk(obj[key]);
    }
  }
  walk(jsonLogic);
  return [...new Set(paths)];
}

@Component({
  selector: 'app-rule-field',
  template: `
    <div class="rule-field" [class.has-error]="hasBlockingErrors()">
      <div class="rule-field-header">
        <span class="rule-field-label">{{ label() }}</span>
        <div class="mode-toggle">
          <button type="button" class="toggle-seg" [class.active]="activeMode() === 'texte'" (click)="switchMode('texte')">Texte</button>
          <button type="button" class="toggle-seg" [class.active]="activeMode() === 'json'" (click)="switchMode('json')">JSON</button>
        </div>
      </div>

      <!-- TEXTE READ MODE -->
      @if (editorState() === 'texte-read') {
        @let parts = proseParts();
        @if (parts) {
          <div class="prose-read-zone" (click)="enterTexteEdit()">
            <button class="prose-edit-btn" type="button">Modifier</button>
            <em class="tk-pfx">{{ parts.prefix }}</em>
            @if (parts.content) {
              <span [innerHTML]="parts.content"></span>
            }
            @if (parts.branches) {
              <ul class="rule-or-list">
                @for (branch of parts.branches; track branch) {
                  <li [innerHTML]="branch"></li>
                }
              </ul>
            }
          </div>
        }
      }

      <!-- TEXTE EDIT MODE -->
      @if (editorState() === 'texte-edit') {
        <div class="prose-cm-host" #proseCmHost></div>
        @if (parseResult(); as result) {
          <div class="validation-row">
            @if (result.success && unknownVarCount() > 0) {
              <span class="validation-badge warning">Avertissement — {{ unknownVarCount() }} variable(s) inconnue(s)</span>
            } @else if (result.success) {
              <span class="validation-badge valid">Valide{{ orBranchCount() > 1 ? ' — ' + orBranchCount() + ' branches OR' : '' }}</span>
            } @else {
              <span class="validation-badge error">{{ result.errors[0]?.message }}</span>
            }
          </div>
        }
      }

      <!-- JSON READ MODE -->
      @if (editorState() === 'json-read') {
        @let parts = proseParts();
        @if (parts) {
          <div class="prose-mirror read-only">
            <em class="tk-pfx">{{ parts.prefix }}</em>
            @if (parts.content) {
              <span [innerHTML]="parts.content"></span>
            }
            @if (parts.branches) {
              <ul class="rule-or-list">
                @for (branch of parts.branches; track branch) {
                  <li [innerHTML]="branch"></li>
                }
              </ul>
            }
          </div>
        }
        <pre class="json-read-zone" (click)="enterJsonEdit()">{{ formattedJson() }}</pre>
      }

      <!-- JSON EDIT MODE -->
      @if (editorState() === 'json-edit') {
        @let parts = jsonEditProseParts();
        @if (parts) {
          <div class="prose-mirror read-only">
            <em class="tk-pfx">{{ parts.prefix }}</em>
            @if (parts.content) {
              <span [innerHTML]="parts.content"></span>
            }
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
      }
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
    .mode-toggle {
      display: flex;
      border: 1px solid var(--color-brand, #1400cc);
      border-radius: 12px;
      overflow: hidden;
    }
    .toggle-seg {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 4px 12px;
      border: none;
      cursor: pointer;
      background: transparent;
      color: var(--color-brand, #1400cc);
      transition: background 0.15s ease, color 0.15s ease;
    }
    .toggle-seg.active {
      background: var(--color-brand, #1400cc);
      color: white;
    }
    .prose-read-zone {
      position: relative;
      font-size: 13px;
      color: var(--color-text-secondary);
      padding: 8px 12px;
      background: var(--color-surface-subtle);
      border-radius: 6px;
      border-left: 3px solid var(--color-brand, #1400cc);
      line-height: 1.6;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .prose-read-zone:hover {
      background: var(--color-surface-muted);
    }
    .prose-edit-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 4px;
      border: 1px solid var(--color-brand, #1400cc);
      background: var(--color-surface-base);
      color: var(--color-brand, #1400cc);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .prose-read-zone:hover .prose-edit-btn {
      opacity: 1;
    }
    .prose-mirror {
      font-size: 13px;
      color: var(--color-text-secondary);
      padding: 8px 12px;
      background: var(--color-surface-subtle);
      border-radius: 6px;
      border-left: 3px solid var(--color-brand, #1400cc);
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .prose-mirror.read-only {
      cursor: default;
    }
    .json-read-zone {
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 13px;
      padding: 8px 12px;
      background: var(--color-surface-base);
      border: 1px solid var(--color-stroke-standard);
      border-radius: 6px;
      white-space: pre-wrap;
      word-break: break-word;
      cursor: pointer;
      color: var(--color-text-primary);
      line-height: 1.5;
      margin: 0;
      transition: background 0.15s ease;
    }
    .json-read-zone:hover {
      background: var(--color-surface-muted);
    }
    .tk-var { color: var(--color-tk-var, #7c3aed); }
    .tk-kw  { color: var(--color-tk-kw, #555555); }
    .tk-val { color: var(--color-tk-val, #059669); }
    .tk-pfx { color: var(--color-tk-pfx, #888888); font-style: italic; margin-right: 4px; }
    .tk-err { color: var(--color-tk-err, #b32020); }
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
    .cm-host, .prose-cm-host {
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
    .validation-row {
      margin-top: 6px;
    }
    .validation-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .validation-badge.valid {
      background: #059669;
      color: white;
    }
    .validation-badge.error {
      background: #b32020;
      color: white;
    }
    .validation-badge.warning {
      background: var(--color-status-warning, #d97706);
      color: white;
    }
    .rule-field.has-error {
      border-color: var(--color-text-error, #dc2626);
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.08);
    }
  `],
})
export class RuleFieldComponent implements AfterViewInit, OnDestroy {
  readonly value = input('');
  readonly label = input('JSONLogic Rule');
  readonly placeholder = input('');
  readonly mode = input<ProseMode>('condition');
  readonly modelType = input<'action' | 'folder' | undefined>(undefined);
  readonly modelId = input<string | undefined>(undefined);

  readonly valueChange = output<string>();
  readonly validChange = output<boolean>();

  readonly hasError = signal(false);
  readonly errorMessage = signal('');

  /** 4-state machine: texte-read, texte-edit, json-read, json-edit */
  readonly editorState = signal<RuleEditorState>('texte-read');

  readonly activeMode = computed(() =>
    this.editorState().startsWith('texte') ? 'texte' : 'json'
  );

  /** Live JSON editor value signal — tracks CM content during json-edit for live prose mirror */
  readonly jsonEditorValue = signal('');

  /** Parse result from prose editor (texte-edit mode) */
  readonly parseResult = signal<ParseResult | null>(null);

  /** Count top-level OR branches in parse result */
  readonly orBranchCount = computed(() => {
    const result = this.parseResult();
    if (!result || !result.success) return 0;
    const jl = result.jsonLogic as Record<string, unknown>;
    if (jl && typeof jl === 'object' && 'or' in jl && Array.isArray(jl['or'])) {
      return jl['or'].length;
    }
    return 1;
  });

  /** Whether the parse result has blocking errors (not warnings) */
  readonly hasBlockingErrors = computed(() => {
    const r = this.parseResult();
    return r !== null && !r.success;
  });

  /** Count of unknown variable warnings */
  readonly unknownVarCount = signal(0);

  /** Known variable paths for linting (populated by variable dictionary when modelType/modelId are provided) */
  readonly variables = signal<import('../../services/variable-dictionary.service').ProseVariable[]>([]);

  /** Whether the variable dictionary has indicator entries (used to suppress false unknown-variable warnings) */
  readonly hasIndicators = computed(() => this.variables().some((v) => v.source === 'indicator'));

  private editorHost = viewChild<ElementRef<HTMLElement>>('editorHost');
  private proseCmHost = viewChild<ElementRef<HTMLElement>>('proseCmHost');
  private editorView: EditorView | null = null;
  private proseEditorView: EditorView | null = null;
  private suppressEmit = false;
  private initialized = false;
  private parseTimeout: ReturnType<typeof setTimeout> | null = null;
  private cdr = inject(ChangeDetectorRef);
  private variableDictionary = inject(VariableDictionaryService);

  readonly proseTranslation = computed(() => translateJsonLogicToProse(this.value(), this.mode()));

  /** Prose parts for json-edit mode — reacts to live editor content */
  readonly jsonEditProseTranslation = computed(() => translateJsonLogicToProse(this.jsonEditorValue(), this.mode()));

  readonly proseParts = computed(() => this.buildProseParts(this.proseTranslation()));

  readonly jsonEditProseParts = computed(() => this.buildProseParts(this.jsonEditProseTranslation()));

  /** Formatted JSON for the json-read display */
  readonly formattedJson = computed(() => {
    const val = this.value();
    if (!val?.trim()) return '';
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  });

  constructor() {
    // Initialize editor state based on whether value is empty
    effect(() => {
      const val = this.value();
      if (!this.initialized) {
        this.initialized = true;
        if (!val?.trim()) {
          this.editorState.set('texte-edit');
        }
      }
    });

    // Populate variables from dictionary when modelType/modelId are provided
    effect(() => {
      const type = this.modelType();
      const id = this.modelId();
      if (type && id) {
        const dictSignal = this.variableDictionary.getVariables(type, id);
        // Track the dictionary signal — when it resolves, update variables
        const vars = dictSignal();
        this.variables.set(vars);
      }
    });

    // Sync external value changes into the JSON editor
    effect(() => {
      const newVal = this.value();
      if (this.editorView && this.editorState() === 'json-edit') {
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

    // Manage JSON editor lifecycle based on state changes
    effect(() => {
      const state = this.editorState();
      if (state === 'json-edit') {
        queueMicrotask(() => {
          if (!this.editorView) {
            this.initJsonEditor();
          }
        });
      } else {
        if (this.editorView) {
          this.editorView.destroy();
          this.editorView = null;
        }
      }
    });

    // Manage prose editor lifecycle based on state changes
    effect(() => {
      const state = this.editorState();
      if (state === 'texte-edit') {
        queueMicrotask(() => {
          if (!this.proseEditorView) {
            this.initProseEditor();
          }
        });
      } else {
        if (this.proseEditorView) {
          this.proseEditorView.destroy();
          this.proseEditorView = null;
        }
        this.parseResult.set(null);
      }
    });
  }

  enterTexteEdit(): void {
    this.editorState.set('texte-edit');
  }

  enterJsonEdit(): void {
    this.editorState.set('json-edit');
  }

  switchMode(mode: 'texte' | 'json'): void {
    const currentState = this.editorState();
    const isRead = currentState.endsWith('-read');
    const hasValue = !!this.value()?.trim();

    if (mode === 'texte') {
      if (isRead) {
        this.editorState.set('texte-read');
      } else {
        this.editorState.set('texte-edit');
      }
    } else {
      // JSON mode
      if (!hasValue) {
        this.editorState.set('json-edit');
      } else if (isRead) {
        this.editorState.set('json-read');
      } else {
        this.editorState.set('json-edit');
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.editorState() === 'json-edit') {
      this.initJsonEditor();
    }
  }

  /** Convert stored JSONLogic to plain-text prose for the prose editor */
  private jsonLogicToProseText(): string {
    const val = this.value();
    if (!val?.trim()) return '';
    const html = translateJsonLogicToProse(val, this.mode());
    if (!html) return '';
    const plain = proseToPlainText(html);
    // In condition mode, convert OR bullets to blank-line-separated blocks.
    // In value mode, keep bullets — the parser needs them for • Si … ⇒ … syntax.
    return this.mode() === 'value' ? plain : bulletsToBlankLines(plain);
  }

  private initProseEditor(): void {
    const host = this.proseCmHost();
    if (!host) return;
    if (this.proseEditorView) return;

    const doc = this.jsonLogicToProseText();

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        if (this.parseTimeout) clearTimeout(this.parseTimeout);
        this.parseTimeout = setTimeout(() => {
          const text = update.state.doc.toString();
          if (!text.trim()) {
            this.parseResult.set(null);
            this.unknownVarCount.set(0);
          } else {
            const result = parseProse(text);
            this.parseResult.set(result);
            // Count unknown variables (only when indicators have loaded)
            if (result.success) {
              const varPaths = extractVarPaths(result.jsonLogic);
              const knownPaths = new Set(this.variables().map((v) => v.path));
              const unknowns = this.hasIndicators()
                ? varPaths.filter((p) => !knownPaths.has(p))
                : [];
              this.unknownVarCount.set(unknowns.length);
            } else {
              this.unknownVarCount.set(0);
            }
          }
        }, 300);
      }
      // Blur handling
      if (update.focusChanged && !update.view.hasFocus) {
        const text = update.view.state.doc.toString().trim();
        if (!text) {
          this.valueChange.emit('');
          this.validChange.emit(true);
          // Stay in texte-edit so the placeholder remains visible and clickable
          return;
        }
        // Run parser immediately on blur (skip debounce)
        const result = parseProse(text);
        this.parseResult.set(result);
        if (result.success) {
          // Valid + any warnings → save and transition (warnings don't block)
          const jsonStr = JSON.stringify(result.jsonLogic);
          this.valueChange.emit(jsonStr);
          this.validChange.emit(true);
          this.editorState.set('texte-read');
        }
        // If errors → stay in texte-edit, errors remain visible
      }
    });

    // Prose linter: inline error marks and unknown variable warnings
    const proseLint = linter((view: EditorView): Diagnostic[] => {
      const text = view.state.doc.toString().trim();
      if (!text) return [];

      const diagnostics: Diagnostic[] = [];
      const result = parseProse(text);

      if (!result.success) {
        for (const error of result.errors) {
          diagnostics.push({
            from: error.start,
            to: Math.max(error.end, error.start + 1),
            severity: 'error',
            message: error.message,
          });
        }
      } else {
        // Unknown variable warnings (only when indicators have loaded successfully)
        const varPaths = extractVarPaths(result.jsonLogic);
        const knownPaths = new Set(this.variables().map((v) => v.path));
        if (this.hasIndicators()) {
          const tokens = tokenize(text);
          for (const varPath of varPaths) {
            if (!knownPaths.has(varPath)) {
              const varToken = tokens.find((t) => t.type === 'variable' && t.value === varPath);
              if (varToken) {
                diagnostics.push({
                  from: varToken.start,
                  to: varToken.end,
                  severity: 'warning',
                  message: `Variable inconnue : '${varPath}'`,
                });
              }
            }
          }
        }
      }

      return diagnostics;
    }, { delay: 300 });

    const startState = EditorState.create({
      doc,
      extensions: [
        proseLanguageExtension,
        bracketMatching(),
        EditorView.lineWrapping,
        history(),
        cmPlaceholder("Saisir une règle… ex : statut fait partie de ['actif']"),
        proseEditorTheme,
        proseLint,
        autocompletion({
          override: [createProseCompletionSource(this.variables)],
          activateOnTyping: true,
          icons: false,
        }),
        updateListener,
      ],
    });

    this.proseEditorView = new EditorView({
      state: startState,
      parent: host.nativeElement,
    });

    // Position cursor at end
    this.proseEditorView.dispatch({
      selection: { anchor: doc.length },
    });
    this.proseEditorView.focus();

    // Run initial parse if there's content
    if (doc.trim()) {
      const result = parseProse(doc);
      this.parseResult.set(result);
      if (result.success) {
        const varPaths = extractVarPaths(result.jsonLogic);
        const knownPaths = new Set(this.variables().map((v) => v.path));
        const unknowns = this.hasIndicators()
          ? varPaths.filter((p) => !knownPaths.has(p))
          : [];
        this.unknownVarCount.set(unknowns.length);
      }
    }
  }

  private initJsonEditor(): void {
    const host = this.editorHost();
    if (!host) return;

    // Avoid double-init
    if (this.editorView) return;

    const jsonLint = linter(jsonLogicLinter(), { delay: 300 });

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !this.suppressEmit) {
        const val = update.state.doc.toString();
        this.valueChange.emit(val);
        this.validateJson(val);
        this.jsonEditorValue.set(val);
      }
      // Blur → json-read
      if (update.focusChanged && !update.view.hasFocus) {
        const val = update.view.state.doc.toString().trim();
        if (val) {
          try {
            JSON.parse(val);
            this.editorState.set('json-read');
          } catch {
            // Invalid JSON — stay in json-edit
          }
        }
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
      parent: host.nativeElement,
    });

    // Initialize live prose mirror value
    this.jsonEditorValue.set(this.value());
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
    this.editorView = null;
    this.proseEditorView?.destroy();
    this.proseEditorView = null;
    if (this.parseTimeout) clearTimeout(this.parseTimeout);
  }

  private buildProseParts(prose: string | null) {
    if (!prose) return null;
    const isValue = this.mode() === 'value';
    const lines = prose.split('\n');
    if (lines.length > 1) {
      return {
        prefix: isValue
          ? "La valeur par défaut correspond à la première condition vérifiée :"
          : "Le paramètre est activé si au moins une de ces conditions est vraie :",
        content: null,
        branches: lines.map((l) => l.replace(/^• /, '')),
      };
    }
    return {
      prefix: isValue
        ? "La valeur par défaut est :"
        : "Le paramètre est activé si :",
      content: prose,
      branches: null,
    };
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
