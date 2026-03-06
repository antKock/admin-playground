import { signal } from '@angular/core';
import { EditorState } from '@codemirror/state';
import { detectContext, createProseCompletionSource, TYPE_OPERATORS } from './prose-autocomplete';
import type { ProseVariable } from '../services/variable-dictionary.service';

const SAMPLE_VARIABLES: ProseVariable[] = [
  { path: 'statut', type: 'texte', group: 'Action', source: 'property' },
  { path: 'score', type: 'nombre', group: 'Indicateurs', source: 'indicator' },
  { path: 'community.siret', type: 'texte', group: 'Communauté', source: 'property' },
  { path: 'actif', type: 'booleen', group: 'Action', source: 'property' },
  { path: 'type_energie', type: 'liste', group: 'Indicateurs', source: 'indicator' },
  { path: 'date_debut', type: 'date', group: 'Action', source: 'property' },
];

describe('detectContext', () => {
  it('returns variable phase at start of input', () => {
    const result = detectContext('', SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'variable' });
  });

  it('returns variable phase after "et"', () => {
    const result = detectContext("statut = 'abc' et ", SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'variable' });
  });

  it('returns variable phase after "ou"', () => {
    const result = detectContext("statut = 'abc' ou ", SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'variable' });
  });

  it('returns operator phase after a variable name', () => {
    const result = detectContext('statut ', SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'operator', variableName: 'statut' });
  });

  it('returns operator phase after a dotted variable name', () => {
    const result = detectContext('community.siret ', SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'operator', variableName: 'community.siret' });
  });

  it('returns connector phase after a complete condition', () => {
    const result = detectContext("statut = 'abc' ", SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'connector' });
  });

  it('returns variable phase for partial variable prefix', () => {
    const result = detectContext('sta', SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'variable' });
  });

  it('returns null for unknown tokens', () => {
    const result = detectContext('xyz123unknown ', SAMPLE_VARIABLES);
    expect(result).toBeNull();
  });

  it('returns variable phase for partial expression prefix like "au"', () => {
    const result = detectContext('au', SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'variable' });
  });

  it('returns variable phase for partial expression prefix like "tous"', () => {
    const result = detectContext('tous', SAMPLE_VARIABLES);
    expect(result).toEqual({ phase: 'variable' });
  });
});

describe('TYPE_OPERATORS', () => {
  it('nombre has 6 operators', () => {
    expect(TYPE_OPERATORS['nombre']).toHaveLength(6);
  });

  it('texte has 5 operators', () => {
    expect(TYPE_OPERATORS['texte']).toHaveLength(5);
  });

  it('liste has 1 operator', () => {
    expect(TYPE_OPERATORS['liste']).toHaveLength(1);
  });

  it('booleen has 2 operators', () => {
    expect(TYPE_OPERATORS['booleen']).toHaveLength(2);
  });

  it('date has 6 operators', () => {
    expect(TYPE_OPERATORS['date']).toHaveLength(6);
  });
});

describe('createProseCompletionSource', () => {
  function callSource(text: string, variables: ProseVariable[]) {
    const vars = signal(variables);
    const source = createProseCompletionSource(vars);

    // Create a minimal CM EditorState to build a CompletionContext
    const state = EditorState.create({ doc: text });
    const pos = text.length;

    // Build a minimal CompletionContext-like object
    // We use the real EditorState but manually construct the context
    const context = {
      state,
      pos,
      explicit: true,
      matchBefore(re: RegExp) {
        const line = state.doc.lineAt(pos);
        const textBefore = line.text.slice(0, pos - line.from);
        const match = textBefore.match(re);
        if (!match) return null;
        return { from: pos - match[0].length, to: pos, text: match[0] };
      },
    };
    return source(context as any);
  }

  it('returns variables and expressions at start of input', () => {
    const result = callSource('', SAMPLE_VARIABLES);
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    // Should include all variable paths
    expect(labels).toContain('statut');
    expect(labels).toContain('score');
    expect(labels).toContain('community.siret');
    // Should include expression completions
    expect(labels).toContain('au moins un élément de …');
    expect(labels).toContain('tous les éléments de …');
    expect(labels).toContain('aucun élément de …');
  });

  it('returns variables after "et"', () => {
    const result = callSource("statut = 'abc' et ", SAMPLE_VARIABLES);
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    expect(labels).toContain('statut');
    expect(labels).toContain('au moins un élément de …');
  });

  it('returns variables after "ou"', () => {
    const result = callSource("statut = 'abc' ou ", SAMPLE_VARIABLES);
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    expect(labels).toContain('score');
  });

  it('returns type-filtered operators after a variable', () => {
    const result = callSource('score ', SAMPLE_VARIABLES);
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    // score is type 'nombre' → should get 6 operators
    expect(labels).toEqual(['=', '≠', '>', '<', '≥', '≤']);
  });

  it('returns only "fait partie de" for liste type', () => {
    const result = callSource('type_energie ', SAMPLE_VARIABLES);
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    expect(labels).toEqual(['fait partie de']);
  });

  it('returns connectors after a complete condition', () => {
    const result = callSource("statut = 'abc' ", SAMPLE_VARIABLES);
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    expect(labels).toContain('et');
    expect(labels).toContain('ou');
  });

  it('returns null for empty variable dictionary', () => {
    const result = callSource('statut ', []);
    expect(result).toBeNull();
  });

  it('groups variables by their group field', () => {
    const result = callSource('', SAMPLE_VARIABLES);
    expect(result).not.toBeNull();
    const sections = result!.options
      .filter((o) => o.type === 'variable')
      .map((o) => (o.section as any)?.name);
    expect(sections).toContain('Action');
    expect(sections).toContain('Indicateurs');
    expect(sections).toContain('Communauté');
  });

  it('shows only type in detail for variables', () => {
    const result = callSource('', SAMPLE_VARIABLES);
    expect(result).not.toBeNull();
    const statut = result!.options.find((o) => o.label === 'statut');
    expect(statut?.detail).toBe('texte');
    const score = result!.options.find((o) => o.label === 'score');
    expect(score?.detail).toBe('nombre');
  });
});
