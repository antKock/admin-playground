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

/** Expression completions (quantifier keywords) */
const EXPRESSION_COMPLETIONS: Completion[] = [
  { label: 'au moins un élément de …', type: 'keyword', detail: 'some', section: { name: 'Expressions', rank: 99 } },
  { label: 'tous les éléments de …', type: 'keyword', detail: 'all', section: { name: 'Expressions', rank: 99 } },
  { label: 'aucun élément de …', type: 'keyword', detail: 'none', section: { name: 'Expressions', rank: 99 } },
];

/** Connector completions */
const CONNECTOR_COMPLETIONS: Completion[] = [
  { label: 'et', type: 'keyword', detail: 'toutes les conditions', section: { name: 'Connecteurs', rank: 0 } },
  { label: 'ou', type: 'keyword', detail: 'au moins une condition', section: { name: 'Connecteurs', rank: 0 } },
];

/**
 * Determines the context "phase" from text before the cursor.
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

  // Empty or nothing typed yet → variable context
  if (!trimmed) {
    return { phase: 'variable' };
  }

  // After a connector (et / ou) at end → variable context
  if (/\b(?:et|ou)\s*$/.test(trimmed)) {
    return { phase: 'variable' };
  }

  // Build a set of variable paths for lookup
  const variablePaths = new Set(variables.map((v) => v.path));

  // Check if text ends with a known variable name → operator context
  for (const path of variablePaths) {
    // Variable at end of trimmed text, preceded by start-of-string or whitespace
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|\\s)${escaped}\\s*$`);
    if (re.test(trimmed)) {
      return { phase: 'operator', variableName: path };
    }
  }

  // Check if text ends with a known operator → might be in value entry or connector
  // We look for: variable + operator + something (a value token) → connector context
  for (const path of variablePaths) {
    for (const op of ALL_OPERATORS) {
      const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const opEscaped = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Pattern: variable operator value (value = at least one non-whitespace token after the operator)
      const re = new RegExp(`(?:^|\\s)${escaped}\\s+${opEscaped}\\s+\\S+.*$`);
      if (re.test(trimmed)) {
        return { phase: 'connector' };
      }
    }
  }

  // If typing a partial word that could be a variable prefix → variable context
  const partialMatch = trimmed.match(/(?:^|\s)(\S+)$/);
  if (partialMatch) {
    const partial = partialMatch[1];
    // Check if partial matches any variable prefix
    const matchesVariable = variables.some((v) => v.path.startsWith(partial));
    if (matchesVariable) {
      return { phase: 'variable' };
    }
    // Check if partial matches a connector prefix
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
    const g = v.group || 'Indicateurs (directs)';
    if (!groupRanks.has(g)) {
      groupRanks.set(g, rank++);
    }
  }

  return variables.map((variable): Completion => {
    const groupName = variable.group || 'Indicateurs (directs)';
    const sourceLabel = variable.source === 'property' ? '  prop' : variable.group ? '  ind' : '';
    return {
      label: variable.path,
      type: 'variable',
      detail: `${variable.type}${sourceLabel}`,
      section: { name: groupName, rank: groupRanks.get(groupName) ?? 99 },
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

    const detected = detectContext(textBefore, vars);
    if (!detected) {
      return null;
    }

    // Determine the "from" position: start of the partial word being typed
    const wordMatch = context.matchBefore(/[\w.À-ÿ≠≥≤]+/);
    const from = wordMatch ? wordMatch.from : context.pos;

    switch (detected.phase) {
      case 'variable': {
        const options = [
          ...buildVariableCompletions(vars),
          ...EXPRESSION_COMPLETIONS,
        ];
        return { from, options };
      }

      case 'operator': {
        const variable = vars.find((v) => v.path === detected.variableName);
        const varType = variable?.type ?? 'texte';
        const options = buildOperatorCompletions(varType);
        return { from, options };
      }

      case 'connector': {
        return { from, options: CONNECTOR_COMPLETIONS };
      }
    }
  };
}
