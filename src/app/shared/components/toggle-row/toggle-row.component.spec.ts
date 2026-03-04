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

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(toggleSpy).toHaveBeenCalledWith(true);
  });

  it('should show enabled state', () => {
    fixture.componentRef.setInput('enabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList.contains('bg-brand')).toBe(true);
  });

  it('should show disabled state', () => {
    fixture.componentRef.setInput('enabled', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList.contains('bg-surface-muted')).toBe(true);
  });
});
