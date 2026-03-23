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
  untracked,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { EditorView } from '@codemirror/view';
import { translateJsonLogicToProse, isAllSimpleOr, type ProseMode } from '../../jsonlogic/jsonlogic-prose';
import { validateJsonLogic } from '../../jsonlogic/jsonlogic-validate';
import { type ParseResult, stripHtml, decodeHtmlEntities } from '../../jsonlogic/prose-parser';
import { VariableDictionaryService } from '../../jsonlogic/variable-dictionary.service';
import { createProseEditorState, runInitialParse } from '../../jsonlogic/prose-editor-setup';
import { createJsonEditorState } from '../../jsonlogic/json-editor-setup';

export type RuleEditorState = 'texte-read' | 'texte-edit' | 'json-read' | 'json-edit';

/** Convert HTML prose output to plain text for the prose CodeMirror editor */
function proseToPlainText(html: string): string {
  return decodeHtmlEntities(stripHtml(html));
}

/** Convert bullet-prefixed prose lines to blank-line-separated blocks */
function bulletsToBlankLines(prose: string): string {
  const lines = prose.split('\n');
  return lines
    .map((l) => l.replace(/^• /, ''))
    .join('\n\n');
}

@Component({
  selector: 'app-rule-field',
  imports: [NgTemplateOutlet],
  templateUrl: './rule-field.component.html',
  styleUrl: './rule-field.component.css',
})
export class RuleFieldComponent implements AfterViewInit, OnDestroy {
  readonly value = input('');
  readonly label = input('JSONLogic Rule');
  readonly placeholder = input('');
  readonly mode = input<ProseMode>('condition');
  readonly modelType = input<'action' | 'folder' | undefined>(undefined);
  readonly modelId = input<string | undefined>(undefined);
  readonly excludeIndicator = input<string | undefined>(undefined);

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

  /** Locally committed value — set on blur before parent round-trips the input */
  private readonly committedValue = signal<string | null>(null);

  /** Parse result from prose editor (texte-edit mode) */
  readonly parseResult = signal<ParseResult | null>(null);

  /** Count top-level OR branches in parse result (excludes simple variable truthiness checks) */
  readonly orBranchCount = computed(() => {
    const result = this.parseResult();
    if (!result || !result.success) return 0;
    const jl = result.jsonLogic as Record<string, unknown>;
    if (jl && typeof jl === 'object' && 'or' in jl && Array.isArray(jl['or'])) {
      const branches = jl['or'] as unknown[];
      return isAllSimpleOr(branches) ? 1 : branches.length;
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
  readonly variables = signal<import('../../jsonlogic/variable-dictionary.service').ProseVariable[]>([]);

  /** Whether the variable dictionary has indicator entries (used to suppress false unknown-variable warnings) */
  readonly hasIndicators = computed(() => this.variables().some((v) => v.source === 'indicator'));

  private editorHost = viewChild<ElementRef<HTMLElement>>('editorHost');
  private proseCmHost = viewChild<ElementRef<HTMLElement>>('proseCmHost');
  private editorView: EditorView | null = null;
  private proseEditorView: EditorView | null = null;
  private proseCleanup: (() => void) | null = null;
  private suppressEmit = false;
  private initialized = false;
  private cdr = inject(ChangeDetectorRef);
  private variableDictionary = inject(VariableDictionaryService);

  readonly proseTranslation = computed(() => translateJsonLogicToProse(this.committedValue() ?? this.value(), this.mode()));

  /** Prose parts for json-edit mode — reacts to live editor content */
  readonly jsonEditProseTranslation = computed(() => translateJsonLogicToProse(this.jsonEditorValue(), this.mode()));

  readonly proseParts = computed(() => this.buildProseParts(this.proseTranslation()));

  readonly jsonEditProseParts = computed(() => this.buildProseParts(this.jsonEditProseTranslation()));

  /** Formatted JSON for the json-read display */
  readonly formattedJson = computed(() => {
    const val = this.committedValue() ?? this.value();
    if (!val?.trim()) return '';
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  });

  constructor() {
    // Initialize editor state based on whether value is empty
    // Clear committedValue once the parent input catches up
    effect(() => {
      const val = this.value();
      if (!this.initialized) {
        this.initialized = true;
        if (!val?.trim()) {
          this.editorState.set('texte-edit');
        }
      }
      // Clear local override once parent input matches
      if (this.committedValue() !== null && val === this.committedValue()) {
        this.committedValue.set(null);
      }
    });

    // Populate variables from dictionary when modelType/modelId are provided
    effect(() => {
      const type = this.modelType();
      const id = this.modelId();
      const exclude = this.excludeIndicator();
      if (type && id) {
        // Use untracked to avoid calling toSignal() inside a reactive context (NG0602)
        const dictSignal = untracked(() => this.variableDictionary.getVariables(type, id));
        let vars = dictSignal();
        // Exclude the indicator being edited (its own rule shouldn't reference itself)
        if (exclude) {
          vars = vars.filter((v) => v.path !== exclude);
        }
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
        this.proseCleanup?.();
        this.proseCleanup = null;
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
    if (!host || this.proseEditorView) return;

    const doc = this.jsonLogicToProseText();

    const { state, cleanup } = createProseEditorState({
      doc,
      variables: this.variables,
      hasIndicators: this.hasIndicators,
      callbacks: {
        onParseResult: (r) => this.parseResult.set(r),
        onUnknownVarCount: (n) => this.unknownVarCount.set(n),
        onSave: (jsonStr) => this.committedValue.set(jsonStr),
        onValueChange: (val) => this.valueChange.emit(val),
        onValidChange: (valid) => this.validChange.emit(valid),
        onTransitionToRead: () => {
          setTimeout(() => {
            this.editorState.set('texte-read');
            this.cdr.detectChanges();
          }, 0);
        },
      },
    });
    this.proseCleanup = cleanup;

    this.proseEditorView = new EditorView({ state, parent: host.nativeElement });
    this.proseEditorView.dispatch({ selection: { anchor: doc.length } });

    runInitialParse(doc, this.variables, this.hasIndicators, {
      onParseResult: (r) => this.parseResult.set(r),
      onUnknownVarCount: (n) => this.unknownVarCount.set(n),
    });
  }

  private initJsonEditor(): void {
    const host = this.editorHost();
    if (!host || this.editorView) return;

    const formattedDoc = this.formattedJson() || this.value();

    const state = createJsonEditorState({
      doc: formattedDoc,
      placeholder: this.placeholder(),
      suppressEmit: () => this.suppressEmit,
      callbacks: {
        onValueChange: (val) => this.valueChange.emit(val),
        onValidate: (val) => this.validateJson(val),
        onJsonEditorValue: (val) => this.jsonEditorValue.set(val),
        onBlurValid: () => this.editorState.set('json-read'),
      },
    });

    this.editorView = new EditorView({ state, parent: host.nativeElement });
    this.jsonEditorValue.set(formattedDoc);
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
    this.editorView = null;
    this.proseEditorView?.destroy();
    this.proseEditorView = null;
    this.proseCleanup?.();
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

  hasNonEndErrors(errors: { atEnd?: boolean; message?: string }[]): boolean {
    return errors.some((e) => !e.atEnd);
  }

  firstNonEndErrorMessage(errors: { atEnd?: boolean; message?: string }[]): string {
    return errors.find((e) => !e.atEnd)?.message ?? '';
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
