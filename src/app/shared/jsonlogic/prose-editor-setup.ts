/**
 * Prose CodeMirror editor state factory.
 *
 * Encapsulates the full prose editor configuration:
 *   - Prose language extension (syntax highlighting)
 *   - Debounced parsing with unknown-variable counting
 *   - Blur-to-save with validation
 *   - Inline linting (errors + unknown-variable warnings)
 *   - Context-aware autocomplete
 *
 * @see docs/jsonlogic-prose-architecture.md
 */
import type { Signal } from '@angular/core';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { bracketMatching } from '@codemirror/language';
import { history } from '@codemirror/commands';
import { linter, type Diagnostic } from '@codemirror/lint';
import { autocompletion, startCompletion, acceptCompletion, closeCompletion } from '@codemirror/autocomplete';

import { parseProse, type ParseResult, extractVarPaths } from './prose-parser';
import { tokenize } from './prose-tokenizer';
import { proseLanguageExtension } from './prose-codemirror-language';
import { createProseCompletionSource } from './prose-autocomplete';
import { proseEditorTheme } from './codemirror-themes';
import type { ProseVariable } from './variable-dictionary.service';

export interface ProseEditorCallbacks {
  onParseResult: (result: ParseResult | null) => void;
  onUnknownVarCount: (count: number) => void;
  onSave: (jsonStr: string) => void;
  onValueChange: (val: string) => void;
  onValidChange: (valid: boolean) => void;
  onTransitionToRead: () => void;
}

export interface ProseEditorConfig {
  doc: string;
  variables: Signal<ProseVariable[]>;
  hasIndicators: Signal<boolean>;
  callbacks: ProseEditorCallbacks;
}

/**
 * Counts unknown variables in a successful parse result.
 * Only reports unknowns when the variable dictionary has indicators loaded.
 */
function countUnknownVars(
  jsonLogic: unknown,
  variables: Signal<ProseVariable[]>,
  hasIndicators: Signal<boolean>,
): number {
  const varPaths = extractVarPaths(jsonLogic);
  const knownPaths = new Set(variables().map((v) => v.path));
  return hasIndicators()
    ? varPaths.filter((p) => !knownPaths.has(p)).length
    : 0;
}

/**
 * Creates a fully configured EditorState for the prose editor.
 *
 * Returns an object with the state and a cleanup function for the parse timeout.
 */
export function createProseEditorState(config: ProseEditorConfig): {
  state: EditorState;
  cleanup: () => void;
} {
  const { doc, variables, hasIndicators, callbacks } = config;
  let parseTimeout: ReturnType<typeof setTimeout> | null = null;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      if (parseTimeout) clearTimeout(parseTimeout);
      parseTimeout = setTimeout(() => {
        const text = update.state.doc.toString();
        if (!text.trim()) {
          callbacks.onParseResult(null);
          callbacks.onUnknownVarCount(0);
        } else {
          const result = parseProse(text);
          callbacks.onParseResult(result);
          if (result.success) {
            callbacks.onUnknownVarCount(countUnknownVars(result.jsonLogic, variables, hasIndicators));
          } else {
            callbacks.onUnknownVarCount(0);
          }
        }
      }, 300);
    }
    // Blur handling
    if (update.focusChanged && !update.view.hasFocus) {
      const text = update.view.state.doc.toString().trim();
      if (!text) {
        callbacks.onValueChange('');
        callbacks.onValidChange(true);
        return;
      }
      const result = parseProse(text);
      callbacks.onParseResult(result);
      if (result.success) {
        const jsonStr = JSON.stringify(result.jsonLogic);
        callbacks.onSave(jsonStr);
        callbacks.onValueChange(jsonStr);
        callbacks.onValidChange(true);
        callbacks.onTransitionToRead();
      }
    }
  });

  // Inline linting: parse errors + unknown-variable warnings
  const proseLint = linter((view: EditorView): Diagnostic[] => {
    const text = view.state.doc.toString().trim();
    if (!text) return [];

    const diagnostics: Diagnostic[] = [];
    const result = parseProse(text);

    if (!result.success) {
      for (const error of result.errors.filter((e) => !e.atEnd)) {
        diagnostics.push({
          from: error.start,
          to: Math.max(error.end, error.start + 1),
          severity: 'error',
          message: error.message,
        });
      }
    } else if (hasIndicators()) {
      const varPaths = extractVarPaths(result.jsonLogic);
      const knownPaths = new Set(variables().map((v) => v.path));
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

    return diagnostics;
  }, { delay: 300 });

  const state = EditorState.create({
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
        override: [createProseCompletionSource(variables)],
        activateOnTyping: true,
        icons: false,
      }),
      keymap.of([
        { key: 'Tab', run: acceptCompletion },
        { key: 'Enter', run: closeCompletion },
      ]),
      EditorView.domEventHandlers({
        focus: (_event, view) => { startCompletion(view); },
        click: (_event, view) => { startCompletion(view); },
      }),
      updateListener,
    ],
  });

  return {
    state,
    cleanup: () => { if (parseTimeout) clearTimeout(parseTimeout); },
  };
}

/**
 * Runs an initial parse on the document and reports results via callbacks.
 */
export function runInitialParse(
  doc: string,
  variables: Signal<ProseVariable[]>,
  hasIndicators: Signal<boolean>,
  callbacks: Pick<ProseEditorCallbacks, 'onParseResult' | 'onUnknownVarCount'>,
): void {
  if (!doc.trim()) return;
  const result = parseProse(doc);
  callbacks.onParseResult(result);
  if (result.success) {
    callbacks.onUnknownVarCount(countUnknownVars(result.jsonLogic, variables, hasIndicators));
  }
}
