import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

@Component({
  imports: [TooltipDirective],
  template: `<button [appTooltip]="tooltipText">Hover me</button>`,
})
class TestHostComponent {
  tooltipText = 'Test tooltip';
}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let buttonEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    buttonEl = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    document.querySelectorAll('[role="tooltip"]').forEach(el => el.remove());
  });

  it('should create tooltip on mouseenter with role and aria', () => {
    buttonEl.dispatchEvent(new MouseEvent('mouseenter'));

    const tooltip = document.body.querySelector('[role="tooltip"]') as HTMLDivElement;
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toBe('Test tooltip');
    expect(tooltip.id).toBeTruthy();
    expect(buttonEl.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('should remove tooltip on mouseleave and clear aria', () => {
    buttonEl.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeTruthy();

    buttonEl.dispatchEvent(new MouseEvent('mouseleave'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeFalsy();
    expect(buttonEl.getAttribute('aria-describedby')).toBeNull();
  });

  it('should show tooltip on focus', () => {
    buttonEl.dispatchEvent(new FocusEvent('focus'));

    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip).toBeTruthy();
    expect(tooltip!.textContent).toBe('Test tooltip');
  });

  it('should hide tooltip on blur', () => {
    buttonEl.dispatchEvent(new FocusEvent('focus'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeTruthy();

    buttonEl.dispatchEvent(new FocusEvent('blur'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeFalsy();
  });

  it('should not create tooltip if appTooltip is empty', async () => {
    fixture.componentInstance.tooltipText = '';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    buttonEl.dispatchEvent(new MouseEvent('mouseenter'));

    expect(document.body.querySelector('[role="tooltip"]')).toBeFalsy();
  });

  it('should clean up tooltip on directive destroy', () => {
    buttonEl.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeTruthy();

    fixture.destroy();
    expect(document.body.querySelector('[role="tooltip"]')).toBeFalsy();
  });

  it('should hide tooltip on Escape key', () => {
    buttonEl.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeTruthy();

    buttonEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.body.querySelector('[role="tooltip"]')).toBeFalsy();
  });

  it('should not leak DOM when mouseenter fires twice rapidly', () => {
    buttonEl.dispatchEvent(new MouseEvent('mouseenter'));
    buttonEl.dispatchEvent(new MouseEvent('mouseenter'));

    const tooltips = document.body.querySelectorAll('[role="tooltip"]');
    expect(tooltips.length).toBe(1);
  });
});
