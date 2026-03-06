import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RuleFieldComponent } from './rule-field.component';

describe('RuleFieldComponent', () => {
  let component: RuleFieldComponent;
  let fixture: ComponentFixture<RuleFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleFieldComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RuleFieldComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show no error initially', () => {
    fixture.detectChanges();
    expect(component.hasError()).toBe(false);
  });

  it('should allow empty string without error', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(component.hasError()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });

  // State machine tests (Story 7.1)
  it('should initialize editorState as texte-read when value is non-empty', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    expect(component.editorState()).toBe('texte-read');
  });

  it('should initialize editorState as texte-edit when value is empty', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(component.editorState()).toBe('texte-edit');
  });

  it('should compute activeMode from editorState', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    expect(component.activeMode()).toBe('texte');

    component.editorState.set('json-read');
    expect(component.activeMode()).toBe('json');

    component.editorState.set('json-edit');
    expect(component.activeMode()).toBe('json');

    component.editorState.set('texte-edit');
    expect(component.activeMode()).toBe('texte');
  });

  it('should not collide RuleEditorState with CM EditorState import', () => {
    const state: import('./rule-field.component').RuleEditorState = 'texte-read';
    expect(state).toBe('texte-read');
  });

  // Prose read mode tests (Story 7.1)
  it('should show prose-read-zone in texte-read state with non-empty value', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "mode_chauffe"}, "autre"]}');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.prose-read-zone')).toBeTruthy();
  });

  it('should show semantic token spans in prose output', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "mode_chauffe"}, "autre"]}');
    fixture.detectChanges();
    const zone = fixture.nativeElement.querySelector('.prose-read-zone');
    expect(zone).toBeTruthy();
    expect(zone.querySelector('.tk-var')).toBeTruthy();
    expect(zone.querySelector('.tk-kw')).toBeTruthy();
    expect(zone.querySelector('.tk-val')).toBeTruthy();
  });

  it('should show separate prefix with tk-pfx class', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    const pfx = fixture.nativeElement.querySelector('.tk-pfx');
    expect(pfx).toBeTruthy();
    expect(pfx.textContent).toContain('Le paramètre est activé si');
  });

  it('should show correct prefix for multi-OR branches', () => {
    fixture.componentRef.setInput('value', '{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}');
    fixture.detectChanges();
    const pfx = fixture.nativeElement.querySelector('.tk-pfx');
    expect(pfx).toBeTruthy();
    expect(pfx.textContent).toContain('au moins une de ces conditions est vraie');
  });

  it('should render OR branches as list items', () => {
    fixture.componentRef.setInput('value', '{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}');
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.rule-or-list li');
    expect(items.length).toBe(2);
  });

  it('should use value mode prefix for ProseMode value', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.componentRef.setInput('mode', 'value');
    fixture.detectChanges();
    const pfx = fixture.nativeElement.querySelector('.tk-pfx');
    expect(pfx).toBeTruthy();
    expect(pfx.textContent).toContain('La valeur par défaut est');
  });

  // Click-to-edit tests
  it('should transition to texte-edit on prose zone click', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    expect(component.editorState()).toBe('texte-read');

    const zone = fixture.nativeElement.querySelector('.prose-read-zone');
    zone.click();
    fixture.detectChanges();

    expect(component.editorState()).toBe('texte-edit');
  });

  it('should show Modifier button in prose zone', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.prose-edit-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Modifier');
  });

  // Prose translation tests
  it('should hide prose when value is empty', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(component.proseTranslation()).toBeNull();
    expect(fixture.nativeElement.querySelector('.prose-read-zone')).toBeFalsy();
  });

  it('should update prose when value input changes', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    expect(component.proseTranslation()).toContain('x');
    expect(component.proseTranslation()).toContain('contient');

    fixture.componentRef.setInput('value', '{"!=": [{"var": "y"}, 2]}');
    fixture.detectChanges();
    expect(component.proseTranslation()).toContain('y');
    expect(component.proseTranslation()).toContain('ne contient pas');
  });

  // JSON mode tests
  it('should not render cm-host in texte-read state', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cm-host')).toBeFalsy();
  });

  // Story 7.2 — Segmented toggle tests
  it('should render mode toggle with Texte and JSON segments', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    const toggleSegs = fixture.nativeElement.querySelectorAll('.toggle-seg');
    expect(toggleSegs.length).toBe(2);
    expect(toggleSegs[0].textContent).toContain('Texte');
    expect(toggleSegs[1].textContent).toContain('JSON');
  });

  it('should default to texte mode active', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    const activeSegs = fixture.nativeElement.querySelectorAll('.toggle-seg.active');
    expect(activeSegs.length).toBe(1);
    expect(activeSegs[0].textContent).toContain('Texte');
  });

  it('should switch to json-read on JSON toggle click from texte-read', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    expect(component.editorState()).toBe('texte-read');

    component.switchMode('json');
    fixture.detectChanges();

    expect(component.editorState()).toBe('json-read');
    expect(component.activeMode()).toBe('json');
  });

  it('should switch to json-edit on JSON toggle click from texte-edit', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    component.editorState.set('texte-edit');

    component.switchMode('json');
    fixture.detectChanges();

    expect(component.editorState()).toBe('json-edit');
  });

  it('should switch back to texte-read on Texte toggle from json-read', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    component.editorState.set('json-read');

    component.switchMode('texte');
    fixture.detectChanges();

    expect(component.editorState()).toBe('texte-read');
  });

  it('should switch back to texte-edit on Texte toggle from json-edit', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    component.editorState.set('json-edit');

    component.switchMode('texte');
    fixture.detectChanges();

    expect(component.editorState()).toBe('texte-edit');
  });

  it('should switch empty value + JSON toggle → json-edit', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();

    component.switchMode('json');
    fixture.detectChanges();

    expect(component.editorState()).toBe('json-edit');
  });

  // JSON read mode tests
  it('should show prose-mirror in json-read mode (read-only, no click handler on prose)', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    component.editorState.set('json-read');
    fixture.detectChanges();

    const mirror = fixture.nativeElement.querySelector('.prose-mirror.read-only');
    expect(mirror).toBeTruthy();
    // No click handler on prose mirror — clicking it should NOT change state
    expect(fixture.nativeElement.querySelector('.prose-read-zone')).toBeFalsy();
  });

  it('should show formatted JSON in json-read-zone', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    component.editorState.set('json-read');
    fixture.detectChanges();

    const pre = fixture.nativeElement.querySelector('.json-read-zone');
    expect(pre).toBeTruthy();
    expect(pre.textContent).toContain('"=="');
  });

  it('should transition to json-edit on json-read-zone click', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    component.editorState.set('json-read');
    fixture.detectChanges();

    const pre = fixture.nativeElement.querySelector('.json-read-zone');
    pre.click();
    fixture.detectChanges();

    expect(component.editorState()).toBe('json-edit');
  });

  it('should hide prose mirror when proseParts is null in json-read', () => {
    fixture.componentRef.setInput('value', '{invalid}');
    fixture.detectChanges();
    component.editorState.set('json-read');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.prose-mirror')).toBeFalsy();
  });

  // formattedJson computed
  it('should format valid JSON with indentation', () => {
    fixture.componentRef.setInput('value', '{"==": [1, 1]}');
    fixture.detectChanges();
    expect(component.formattedJson()).toContain('\n');
    expect(component.formattedJson()).toContain('  ');
  });

  it('should return raw value for invalid JSON', () => {
    fixture.componentRef.setInput('value', '{invalid}');
    fixture.detectChanges();
    expect(component.formattedJson()).toBe('{invalid}');
  });

  // Story 7.6 — Texte Edit Mode tests
  it('should show prose-cm-host in texte-edit state', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(component.editorState()).toBe('texte-edit');
    expect(fixture.nativeElement.querySelector('.prose-cm-host')).toBeTruthy();
  });

  it('should not show prefix line in texte-edit mode', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    component.editorState.set('texte-edit');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tk-pfx')).toBeFalsy();
  });

  it('should initialize parseResult as null', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    expect(component.parseResult()).toBeNull();
  });

  it('should show no validation badge when parseResult is null', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.validation-badge')).toBeFalsy();
  });

  it('should compute orBranchCount from parseResult', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(component.orBranchCount()).toBe(0);

    // Simulate a successful parse result with OR
    component.parseResult.set({
      success: true,
      jsonLogic: { or: [{ '==': [{ var: 'x' }, 1] }, { '==': [{ var: 'y' }, 2] }] },
    });
    expect(component.orBranchCount()).toBe(2);
  });

  it('should show validation-row in texte-edit when parseResult has value', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    component.parseResult.set({ success: true, jsonLogic: { '==': [{ var: 'x' }, 1] } });
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.validation-badge.valid');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Valide');
  });

  it('should show error badge when parse fails', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    component.parseResult.set({
      success: false,
      errors: [{ message: 'Erreur de syntaxe', line: 1, col: 1, start: 0, end: 5 }],
    });
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.validation-badge.error');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Erreur de syntaxe');
  });

  it('should show branch count in badge for multi-OR results', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    component.parseResult.set({
      success: true,
      jsonLogic: { or: [{ '==': [{ var: 'x' }, 1] }, { '==': [{ var: 'y' }, 2] }, { '==': [{ var: 'z' }, 3] }] },
    });
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.validation-badge.valid');
    expect(badge.textContent).toContain('3 branches OR');
  });

  it('should clear parseResult when leaving texte-edit state', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "x"}, 1]}');
    fixture.detectChanges();
    component.editorState.set('texte-edit');
    fixture.detectChanges();
    component.parseResult.set({ success: true, jsonLogic: {} });
    expect(component.parseResult()).toBeTruthy();

    component.editorState.set('texte-read');
    // Effect runs asynchronously, so we need to trigger detection
    fixture.detectChanges();
    expect(component.parseResult()).toBeNull();
  });

  // Story 7.8 — Validation Polish tests
  it('should compute hasBlockingErrors from parseResult', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(component.hasBlockingErrors()).toBe(false);

    component.parseResult.set({ success: true, jsonLogic: {} });
    expect(component.hasBlockingErrors()).toBe(false);

    component.parseResult.set({
      success: false,
      errors: [{ message: 'err', line: 1, col: 1, start: 0, end: 1 }],
    });
    expect(component.hasBlockingErrors()).toBe(true);
  });

  it('should apply has-error class when hasBlockingErrors is true', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    component.parseResult.set({
      success: false,
      errors: [{ message: 'err', line: 1, col: 1, start: 0, end: 1 }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rule-field.has-error')).toBeTruthy();
  });

  it('should not apply has-error class when parse is valid', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    component.parseResult.set({ success: true, jsonLogic: {} });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rule-field.has-error')).toBeFalsy();
  });

  it('should show amber warning badge when unknownVarCount > 0', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    component.parseResult.set({ success: true, jsonLogic: { '==': [{ var: 'x' }, 1] } });
    component.unknownVarCount.set(2);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.validation-badge.warning');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('2 variable(s) inconnue(s)');
  });

  it('should show Valide badge when unknownVarCount is 0', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    component.parseResult.set({ success: true, jsonLogic: { '==': [{ var: 'x' }, 1] } });
    component.unknownVarCount.set(0);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.validation-badge.valid');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Valide');
  });

  it('should have empty variables signal by default', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(component.variables().length).toBe(0);
  });
});
