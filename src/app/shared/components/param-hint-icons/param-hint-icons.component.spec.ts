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

  it('should render 6 hint circles', () => {
    fixture.detectChanges();
    const circles = fixture.nativeElement.querySelectorAll('span.rounded-full:not(.bg-amber-500)');
    expect(circles.length).toBe(6);
  });

  it('should show all gray when all defaults', () => {
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

    expect(component.hintList()[0].state).toBe('on');
    expect(component.hintList()[1].state).toBe('on');
    expect(component.hintList()[2].state).toBe('off');
  });

  it('should generate tooltip for configured params', () => {
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

    expect(component.tooltip()).toBe('Configured: visibility, default value (rule)');
  });

  it('should show default tooltip when no params configured', () => {
    fixture.detectChanges();
    expect(component.tooltip()).toBe('All parameters at defaults');
  });

  it('should support rule state with orange dot indicator', () => {
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

    expect(component.hintList()[0].state).toBe('rule');
  });
});
