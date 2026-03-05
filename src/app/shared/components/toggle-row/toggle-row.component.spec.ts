import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleRowComponent } from './toggle-row.component';

describe('ToggleRowComponent', () => {
  let component: ToggleRowComponent;
  let fixture: ComponentFixture<ToggleRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleRowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleRowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Visibility');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display label', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Visibility');
  });

  it('should emit toggle event on click', () => {
    fixture.componentRef.setInput('enabled', false);
    fixture.detectChanges();

    const toggleSpy = vi.fn();
    component.toggle.subscribe(toggleSpy);

    const button = fixture.nativeElement.querySelector('button.toggle');
    button.click();

    expect(toggleSpy).toHaveBeenCalledWith(true);
  });

  it('should show enabled state', () => {
    fixture.componentRef.setInput('enabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button.toggle');
    expect(button.classList.contains('on')).toBe(true);
  });

  it('should show disabled state', () => {
    fixture.componentRef.setInput('enabled', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button.toggle');
    expect(button.classList.contains('on')).toBe(false);
  });

  it('should not render icon when null', () => {
    fixture.componentRef.setInput('icon', null);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.toggle-icon');
    expect(icon).toBeFalsy();
  });

  it('should have role="switch" on toggle button', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button.toggle');
    expect(button.getAttribute('role')).toBe('switch');
  });

  it('should set aria-checked to false when disabled', () => {
    fixture.componentRef.setInput('enabled', false);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button.toggle');
    expect(button.getAttribute('aria-checked')).toBe('false');
  });

  it('should set aria-checked to true when enabled', () => {
    fixture.componentRef.setInput('enabled', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button.toggle');
    expect(button.getAttribute('aria-checked')).toBe('true');
  });

  it('should set aria-label to the label text', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button.toggle');
    expect(button.getAttribute('aria-label')).toBe('Visibility');
  });
});
