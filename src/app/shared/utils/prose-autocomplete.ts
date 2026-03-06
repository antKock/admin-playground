/**
 * Context-aware autocomplete for the French prose rule editor.
 *
 * Provides a CodeMirror CompletionSource that suggests:
 *   - Variables (grouped by entity) at the start of a condition
 *   - Type-filtered operators after a variable name
 *   - Connectors (et / ou) after a complete condition
 *   - Expression keywords (some / all / none quantifiers)
 *
 * @see docs/jsonlogic-prose-architecture.md
 */
import type { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';
import { startCompletion } from '@codemirror/autocomplete';
import type { ProseVariable } from '../services/variable-dictionary.service';
import type { Signal } from '@angular/core';

/** Operators available per variable type */
export const TYPE_OPERATORS: Record<string, string[]> = {
  nombre: ['=', '≠', '>', '<', '≥', '≤'],
  texte: ['=', '≠', 'contient', 'ne contient pas', 'fait partie de'],
  liste: ['fait partie de'],
  booleen: ['=', '≠'],
  date: ['=', '≠', '>', '<', '≥', '≤'],
};

/** All known operator tokens (for detection) */
const ALL_OPERATORS = new Set(
  Object.values(TYPE_OPERATORS).flat()
);

/**
 * Creates an apply function that inserts label + space and re-triggers autocomplete.
 */
function applyWithSpace(label: string): (view: import('@codemirror/view').EditorView, completion: Completion, from: number, to: number) => void {
  return (view, _completion, from, to) => {
    view.dispatch({
      changes: { from, to, insert: label + ' ' },
      selection: { anchor: from + label.length + 1 },
    });
    setTimeout(() => startCompletion(view), 0);
  };
}

/** Expression completions (quantifier keywords) */
const EXPRESSION_COMPLETIONS: Completion[] = [
  { label: 'au moins un élément de …', type: 'keyword', section: { name: 'Expressions', rank: 99 }, apply: applyWithSpace('au moins un élément de …') },
  { label: 'tous les éléments de …', type: 'keyword', section: { name: 'Expressions', rank: 99 }, apply: applyWithSpace('tous les éléments de …') },
  { label: 'aucun élément de …', type: 'keyword', section: { name: 'Expressions', rank: 99 }, apply: applyWithSpace('aucun élément de …') },
];

/** Connector completions */
const CONNECTOR_COMPLETIONS: Completion[] = [
  { label: 'et', type: 'keyword', detail: 'toutes les conditions', section: { name: 'Connecteurs', rank: 0 }, apply: applyWithSpace('et') },
  { label: 'ou', type: 'keyword', detail: 'au moins une condition', section: { name: 'Connecteurs', rank: 0 }, apply: applyWithSpace('ou') },
];

/** Arithmetic operator completions */
const ARITHMETIC_COMPLETIONS: Completion[] = [
  { label: '+', type: 'keyword', detail: 'addition', section: { name: 'Opérateurs arithmétiques', rank: 1 }, apply: applyWithSpace('+') },
  { label: '-', type: 'keyword', detail: 'soustraction', section: { name: 'Opérateurs arithmétiques', rank: 1 }, apply: applyWithSpace('-') },
  { label: '×', type: 'keyword', detail: 'multiplication', section: { name: 'Opérateurs arithmétiques', rank: 1 }, apply: applyWithSpace('×') },
  { label: '÷', type: 'keyword', detail: 'division', section: { name: 'Opérateurs arithmétiques', rank: 1 }, apply: applyWithSpace('÷') },
  { label: 'modulo', type: 'keyword', detail: 'reste de la division', section: { name: 'Opérateurs arithmétiques', rank: 1 }, apply: applyWithSpace('modulo') },
];

/**
 * Extract whitespace-delimited tokens from text, preserving multi-word operators.
 * Returns tokens in order. Multi-word operators like "fait partie de" are kept as one token.
 */
function extractTokens(text: string): string[] {
  const tokens: string[] = [];
  const multiWordOps = ['ne contient pas', 'fait partie de'];

  let remaining = text;
  while (remaining.length > 0) {
    remaining = remaining.trimStart();
    if (!remaining) break;

    // Try multi-word operator match
    let matched = false;
    for (const mw of multiWordOps) {
      if (remaining.startsWith(mw)) {
        const after = remaining[mw.length];
        if (!after || /\s/.test(after)) {
          tokens.push(mw);
          remaining = remaining.slice(mw.length);
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;

    // Single token (up to next whitespace)
    const match = remaining.match(/^(\S+)/);
    if (match) {
      tokens.push(match[1]);
      remaining = remaining.slice(match[1].length);
    }
  }
  return tokens;
}

/**
 * Determines the context "phase" from text before the cursor.
 *
 * Uses token extraction + Set lookups (O(1)) instead of per-variable regex (O(n*m)).
 *
 * Returns:
 *  - 'variable'   → show variables + expressions
 *  - 'operator'   → show type-filtered operators (+ the detected variable name)
 *  - 'connector'  → show et / ou
 *  - null         → no completion
 */
export function detectContext(
  textBefore: string,
  variables: ProseVariable[],
): { phase: 'variable' | 'operator' | 'connector'; variableName?: string } | null {
  const trimmed = textBefore.trimEnd();

  // Empty → variable context
  if (!trimmed) {
    return { phase: 'variable' };
  }

  const tokens = extractTokens(trimmed);
  if (tokens.length === 0) {
    return { phase: 'variable' };
  }

  const variablePaths = new Set(variables.map((v) => v.path));
  const lastToken = tokens[tokens.length - 1];
  const prevToken = tokens.length >= 2 ? tokens[tokens.length - 2] : null;

  // After a connector (et / ou) → variable context
  if (lastToken === 'et' || lastToken === 'ou') {
    return { phase: 'variable' };
  }

  // Last token is a known variable → operator context
  if (variablePaths.has(lastToken)) {
    return { phase: 'operator', variableName: lastToken };
  }

  // Last token is a known operator and prev is a variable → variable context (right-hand side)
  if (ALL_OPERATORS.has(lastToken) && prevToken && variablePaths.has(prevToken)) {
    return { phase: 'variable' };
  }

  // Last token is a known operator (standalone, e.g. after another operator's value)
  if (ALL_OPERATORS.has(lastToken)) {
    return { phase: 'variable' };
  }

  // After arithmetic operator → variable context
  if (/^[+\-*/×÷]$/.test(lastToken) || lastToken === 'modulo') {
    return { phase: 'variable' };
  }

  // After a number → connector context
  if (/^\d+(?:\.\d+)?$/.test(lastToken)) {
    return { phase: 'connector' };
  }

  // Check for complete condition: variable operator value → connector
  if (tokens.length >= 3) {
    // Walk backwards: check if there's a variable + operator + value pattern ending at tokens
    for (let i = tokens.length - 1; i >= 2; i--) {
      const opCandidate = tokens[i - 1];
      const varCandidate = tokens[i - 2];
      if (variablePaths.has(varCandidate) && ALL_OPERATORS.has(opCandidate)) {
        return { phase: 'connector' };
      }
    }
  }

  // Partial word being typed → check if it matches variables or expressions
  const partialMatch = trimmed.match(/(?:^|\s)(\S+)$/);
  if (partialMatch) {
    const partial = partialMatch[1].toLowerCase();
    if (variables.some((v) => v.path.toLowerCase().includes(partial))) {
      return { phase: 'variable' };
    }
    if (EXPRESSION_COMPLETIONS.some((e) => e.label.toLowerCase().includes(partial))) {
      return { phase: 'variable' };
    }
    if ('et'.startsWith(partial) || 'ou'.startsWith(partial)) {
      return { phase: 'connector' };
    }
  }

  return null;
}

/**
 * Builds variable completions grouped by entity.
 */
function buildVariableCompletions(variables: ProseVariable[]): Completion[] {
  // Assign rank by group order of appearance
  const groupRanks = new Map<string, number>();
  let rank = 0;
  for (const v of variables) {
    const g = v.group || 'Indicateurs';
    if (!groupRanks.has(g)) {
      groupRanks.set(g, rank++);
    }
  }

  return variables.map((variable): Completion => {
    const groupName = variable.group || 'Indicateurs';
    return {
      label: variable.path,
      type: 'variable',
      detail: variable.type,
      section: { name: groupName, rank: groupRanks.get(groupName) ?? 99 },
      apply: applyWithSpace(variable.path),
    };
  });
}

/**
 * Builds operator completions filtered by variable type.
 */
function buildOperatorCompletions(variableType: string): Completion[] {
  const ops = TYPE_OPERATORS[variableType] ?? TYPE_OPERATORS['texte'];
  return ops.map((op): Completion => ({
    label: op,
    type: 'keyword',
    detail: 'opérateur',
    section: { name: 'Opérateurs', rank: 0 },
    apply: applyWithSpace(op),
  }));
}

/**
 * Creates a CodeMirror CompletionSource for the prose rule editor.
 *
 * @param variables - A signal containing the available variables
 * @returns A function compatible with CM's autocompletion override
 */
export function createProseCompletionSource(
  variables: Signal<ProseVariable[]>,
): (context: CompletionContext) => CompletionResult | null {
  return (context: CompletionContext): CompletionResult | null => {
    const vars = variables();
    if (!vars || vars.length === 0) {
      return null;
    }

    // Get all text before cursor on the current line
    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);

    // Don't trigger on empty lines unless explicitly requested (e.g. focus/click)
    if (!textBefore.trim() && !context.explicit) {
      return null;
    }

    const detected = detectContext(textBefore, vars);
    if (!detected) {
      return null;
    }

    // Determine the "from" position: start of the partial word being typed
    const wordMatch = context.matchBefore(/[\w.À-ÿ≠≥≤]+/);
    const from = wordMatch ? wordMatch.from : context.pos;
    const typed = wordMatch ? wordMatch.text.toLowerCase() : '';

    // Substring filter (replaces CM's default fuzzy matching)
    const filterOptions = (options: Completion[]) =>
      typed ? options.filter((o) => o.label.toLowerCase().includes(typed)) : options;

    switch (detected.phase) {
      case 'variable': {
        const options = filterOptions([
          ...buildVariableCompletions(vars),
          ...EXPRESSION_COMPLETIONS,
        ]);
        return { from, options, filter: false };
      }

      case 'operator': {
        const variable = vars.find((v) => v.path === detected.variableName);
        const varType = variable?.type ?? 'texte';
        const compOps = buildOperatorCompletions(varType);
        // Number-type variables also get arithmetic operators and connectors
        const extras = varType === 'nombre' ? [...ARITHMETIC_COMPLETIONS, ...CONNECTOR_COMPLETIONS] : [];
        const options = filterOptions([...compOps, ...extras]);
        return { from, options, filter: false };
      }

      case 'connector': {
        const compOps = buildOperatorCompletions('nombre');
        const options = filterOptions([...compOps, ...CONNECTOR_COMPLETIONS, ...ARITHMETIC_COMPLETIONS]);
        return { from, options, filter: false };
      }
    }
  };
}
