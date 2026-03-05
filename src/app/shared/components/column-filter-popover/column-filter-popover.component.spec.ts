import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { ColumnFilterPopoverComponent } from './column-filter-popover.component';
import { FilterOption } from '../data-table/data-table.component';

@Component({
  imports: [ColumnFilterPopoverComponent],
  template: `
    <app-column-filter-popover
      [options]="options"
      [selected]="selected()"
      (selectionChange)="onSelectionChange($event)"
      (closePopover)="onClose()"
    />
  `,
})
class TestHostComponent {
  options: FilterOption[] = [
    { id: '1', label: 'Option A' },
    { id: '2', label: 'Option B' },
    { id: '3', label: 'Option C' },
  ];
  selected = signal<string[]>([]);
  lastSelection: string[] | null = null;
  closed = false;

  onSelectionChange(values: string[]): void {
    this.lastSelection = values;
    this.selected.set(values);
  }

  onClose(): void {
    this.closed = true;
  }
}

describe('ColumnFilterPopoverComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  afterEach(() => {
    // Clean up any document listeners
    document.querySelectorAll('.filter-popover').forEach(el => el.remove());
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.filter-popover')).toBeTruthy();
  });

  it('should render all options as checkboxes', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);
  });

  it('should display option labels', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.filter-option-label');
    expect(labels[0].textContent).toContain('Option A');
    expect(labels[1].textContent).toContain('Option B');
    expect(labels[2].textContent).toContain('Option C');
  });

  it('should check selected options', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.selected.set(['2']);
    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);
    expect(checkboxes[2].checked).toBe(false);
  });

  it('should emit selectionChange when toggling an option', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    checkboxes[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelection).toEqual(['1']);
  });

  it('should remove option when unchecking', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.selected.set(['1', '2']);
    fixture.detectChanges();
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    checkboxes[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelection).toEqual(['2']);
  });

  it('should clear all selections on clear button click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.selected.set(['1', '2']);
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.filter-clear-btn');
    clearBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.lastSelection).toEqual([]);
  });

  it('should disable clear button when nothing selected', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-clear-btn');
    expect(clearBtn.disabled).toBe(true);
  });

  it('should emit closePopover on Escape key', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const popover = fixture.nativeElement.querySelector('.filter-popover');
    popover.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.closed).toBe(true);
  });

  it('should not show search input when <= 10 options', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.filter-search-input')).toBeNull();
  });

  it('should show search input when > 10 options', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.options = Array.from({ length: 12 }, (_, i) => ({
      id: `${i}`,
      label: `Option ${i}`,
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.filter-search-input')).toBeTruthy();
  });

  it('should filter options based on search term', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.options = Array.from({ length: 12 }, (_, i) => ({
      id: `${i}`,
      label: `Item ${i}`,
    }));
    fixture.detectChanges();

    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector('.filter-search-input');
    searchInput.value = 'Item 1';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const labels = fixture.nativeElement.querySelectorAll('.filter-option-label');
    // Should match Item 1, Item 10, Item 11
    expect(labels.length).toBe(3);
  });
});
