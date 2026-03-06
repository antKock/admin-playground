/**
 * Shared CodeMirror 6 theme definitions for the rule field editor.
 *
 * Two themes are provided:
 *   - jsonEditorTheme: JSON editing mode (blue focus ring)
 *   - proseEditorTheme: Prose editing mode (neutral focus, no ring)
 *
 * Both share a common base (font, border, gutter, lint, selection styles).
 */
import { EditorView } from '@codemirror/view';

const BASE_STYLES: Record<string, Record<string, string>> = {
  '&': {
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    border: '1px solid var(--color-stroke-standard)',
    borderRadius: '6px',
    background: 'var(--color-surface-base)',
  },
  '.cm-content': {
    padding: '8px',
    caretColor: 'var(--color-text-primary)',
    color: 'var(--color-text-primary)',
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
};

/** JSON editor theme — blue focus ring, gutter, active line highlight */
export const jsonEditorTheme = EditorView.theme({
  ...BASE_STYLES,
  '&.cm-focused': {
    outline: 'none',
    borderColor: 'var(--color-brand, #1400cc)',
    boxShadow: '0 0 0 3px rgba(20, 0, 204, 0.08)',
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
  '.ͼc': {
    color: 'var(--color-brand, #1400cc)',
  },
});

/** Prose editor theme — neutral focus (no ring), extra line height */
export const proseEditorTheme = EditorView.theme({
  ...BASE_STYLES,
  '.cm-content': {
    ...BASE_STYLES['.cm-content'],
    lineHeight: '1.6',
  },
  '&.cm-focused': {
    outline: 'none',
    borderColor: 'var(--color-stroke-standard)',
    boxShadow: 'none',
  },
});
