import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParamHintIconsComponent, ParamHints } from './param-hint-icons.component';

describe('ParamHintIconsComponent', () => {
  let component: ParamHintIconsComponent;
  let fixture: ComponentFixture<ParamHintIconsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParamHintIconsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParamHintIconsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 6 hint icons', () => {
    fixture.detectChanges();
    const hints = fixture.nativeElement.querySelectorAll('.param-hint');
    expect(hints.length).toBe(6);
  });

  it('should show all off when all defaults', () => {
    fixture.detectChanges();
    expect(component.hintList().every((h) => h.state === 'off')).toBe(true);
  });

  it('should show active colors for configured params', () => {
    const hints: ParamHints = {
      visibility: 'on',
      required: 'on',
      editable: 'off',
      defaultValue: 'off',
      duplicable: 'off',
      constrained: 'off',
    };
    fixture.componentRef.setInput('hints', hints);
    fixture.detectChanges();

    // Order: required, editable, visibility, defaultValue, duplicable, constrained
    const list = component.hintList();
    expect(list.find(h => h.label === 'required')!.state).toBe('on');
    expect(list.find(h => h.label === 'visibility')!.state).toBe('on');
    expect(list.find(h => h.label === 'editable')!.state).toBe('off');
  });

  it('should generate correct tooltips for configured params', () => {
    const hints: ParamHints = {
      visibility: 'on',
      required: 'off',
      editable: 'off',
      defaultValue: 'rule',
      duplicable: 'off',
      constrained: 'off',
    };
    fixture.componentRef.setInput('hints', hints);
    fixture.detectChanges();

    const list = component.hintList();
    expect(list.find(h => h.label === 'visibility')!.tooltip).toBe('Masqué');
    expect(list.find(h => h.label === 'defaultValue')!.tooltip).toBe('Valeur par défaut');
    expect(list.find(h => h.label === 'required')!.tooltip).toBe('Obligatoire');
  });

  it('should support rule state with on-rule class', () => {
    const hints: ParamHints = {
      visibility: 'rule',
      required: 'off',
      editable: 'off',
      defaultValue: 'off',
      duplicable: 'off',
      constrained: 'off',
    };
    fixture.componentRef.setInput('hints', hints);
    fixture.detectChanges();

    const list = component.hintList();
    expect(list.find(h => h.label === 'visibility')!.state).toBe('rule');
    expect(list.find(h => h.label === 'visibility')!.stateClass).toBe('on-rule');
  });
});
