import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { DataTableComponent, ColumnDef } from './data-table.component';

interface TestRow extends Record<string, unknown> {
  id: string;
  name: string;
}

@Component({
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [columns]="columns"
      [data]="data"
      [isLoading]="isLoading"
      [hasMore]="hasMore"
      (rowClick)="onRowClick($event)"
      (loadMore)="onLoadMore()"
    />
  `,
})
class TestHostComponent {
  columns: ColumnDef[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ];
  data: TestRow[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];
  isLoading = false;
  hasMore = false;
  clickedRow: Record<string, unknown> | null = null;
  loadMoreCalled = false;

  onRowClick(row: Record<string, unknown>): void {
    this.clickedRow = row;
  }

  onLoadMore(): void {
    this.loadMoreCalled = true;
  }
}

describe('DataTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('.data-table');
    expect(table).toBeTruthy();
  });

  it('should render column headers', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const headers = fixture.nativeElement.querySelectorAll('th');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent.trim()).toBe('ID');
    expect(headers[1].textContent.trim()).toBe('Name');
  });

  it('should render data rows', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.data-row');
    expect(rows.length).toBe(2);
  });

  it('should show skeleton rows when loading with no data', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isLoading = true;
    fixture.componentInstance.data = [];
    fixture.detectChanges();
    const skeletonRows = fixture.nativeElement.querySelectorAll('.skeleton-row');
    expect(skeletonRows.length).toBe(6);
  });

  it('should emit rowClick on row click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const firstRow = fixture.nativeElement.querySelector('.data-row');
    firstRow.click();
    expect(fixture.componentInstance.clickedRow).toEqual({ id: '1', name: 'Item 1' });
  });

  it('should emit rowClick on Enter key', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const firstRow = fixture.nativeElement.querySelector('.data-row');
    firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(fixture.componentInstance.clickedRow).toEqual({ id: '1', name: 'Item 1' });
  });

  it('should render proper table structure with thead and tbody', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('thead')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('tbody')).toBeTruthy();
  });
});
