import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { MultiSelectorComponent, SelectorOption } from './multi-selector.component';

@Component({
  selector: 'app-test-host',
  imports: [MultiSelectorComponent],
  template: `
    <app-multi-selector
      [options]="options()"
      [selectedIds]="selectedIds()"
      [loading]="loading()"
      [hasError]="hasError()"
      placeholder="Select items..."
      (selectionChange)="onSelectionChange($event)"
    />
  `,
})
class TestHostComponent {
  options = signal<SelectorOption[]>([
    { id: '1', label: 'Option 1' },
    { id: '2', label: 'Option 2' },
    { id: '3', label: 'Option 3' },
  ]);
  selectedIds = signal<string[]>([]);
  loading = signal(false);
  hasError = signal(false);
  lastEmitted: string[] | null = null;

  onSelectionChange(ids: string[]): void {
    this.lastEmitted = ids;
  }
}

describe('MultiSelectorComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render with placeholder text', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Select items...');
  });

  it('should show loading state when loading', () => {
    host.loading.set(true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Chargement...');
    expect(button.disabled).toBe(true);
  });

  it('should show selected count', () => {
    host.selectedIds.set(['1', '2']);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('2 sélectionnés');
  });

  it('should show empty state when no options', () => {
    host.options.set([]);
    fixture.detectChanges();

    // Open dropdown
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    const emptyMsg = fixture.nativeElement.querySelector('.text-center');
    expect(emptyMsg.textContent).toContain('Aucune option disponible');
  });

  it('should toggle dropdown on click', () => {
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    const labels = fixture.nativeElement.querySelectorAll('label');
    expect(labels.length).toBe(3);

    button.click();
    fixture.detectChanges();

    const labelsAfter = fixture.nativeElement.querySelectorAll('label');
    expect(labelsAfter.length).toBe(0);
  });

  it('should emit selectionChange when option toggled', () => {
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    expect(host.lastEmitted).toEqual(['1']);
  });

  it('should render chips for selected items', () => {
    host.selectedIds.set(['1', '3']);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('.rounded-full');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('Option 1');
    expect(chips[1].textContent).toContain('Option 3');
  });

  it('should emit selectionChange when chip removed', () => {
    host.selectedIds.set(['1', '2']);
    fixture.detectChanges();

    const removeButtons = fixture.nativeElement.querySelectorAll('.rounded-full button');
    removeButtons[0].click();
    fixture.detectChanges();

    expect(host.lastEmitted).toEqual(['2']);
  });

  it('should apply error border when hasError is true', () => {
    host.hasError.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList.contains('border-error')).toBe(true);
  });
});
