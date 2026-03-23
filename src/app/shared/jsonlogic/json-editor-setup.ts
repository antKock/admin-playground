/**
 * JSON CodeMirror editor state factory.
 *
 * Encapsulates the JSON editor configuration:
 *   - JSON language extension
 *   - JSONLogic validation linter
 *   - Blur-to-read transition
 *
 * @see docs/jsonlogic-prose-architecture.md
 */
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { bracketMatching } from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';
import { linter, type Diagnostic, lintGutter } from '@codemirror/lint';

import { validateJsonLogic } from './jsonlogic-validate';
import { jsonEditorTheme } from './codemirror-themes';

export interface JsonEditorCallbacks {
  onValueChange: (val: string) => void;
  onValidate: (val: string) => void;
  onJsonEditorValue: (val: string) => void;
  onBlurValid: () => void;
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

    const logicErrors = validateJsonLogic(trimmed);
    return logicErrors.map((err) => ({
      from: 0,
      to: doc.length,
      severity: 'warning' as const,
      message: err.message,
    }));
  };
}

export interface JsonEditorConfig {
  doc: string;
  placeholder: string;
  callbacks: JsonEditorCallbacks;
  suppressEmit: () => boolean;
}

/**
 * Creates a fully configured EditorState for the JSON editor.
 */
export function createJsonEditorState(config: JsonEditorConfig): EditorState {
  const { doc, placeholder, callbacks, suppressEmit } = config;

  const jsonLint = linter(jsonLogicLinter(), { delay: 300 });

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && !suppressEmit()) {
      const val = update.state.doc.toString();
      callbacks.onValueChange(val);
      callbacks.onValidate(val);
      callbacks.onJsonEditorValue(val);
    }
    // Blur → json-read
    if (update.focusChanged && !update.view.hasFocus) {
      const val = update.view.state.doc.toString().trim();
      if (val) {
        try {
          JSON.parse(val);
          callbacks.onBlurValid();
        } catch {
          // Invalid JSON — stay in json-edit
        }
      }
    }
  });

  return EditorState.create({
    doc,
    extensions: [
      json(),
      bracketMatching(),
      keymap.of([indentWithTab]),
      jsonLint,
      lintGutter(),
      jsonEditorTheme,
      cmPlaceholder(placeholder),
      updateListener,
      EditorView.lineWrapping,
    ],
  });
}
