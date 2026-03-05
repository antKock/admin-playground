import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { DataTableComponent, ColumnDef, RowAction } from './data-table.component';

interface TestRow extends Record<string, unknown> {
  id: string;
  name: string;
  technical_label?: string;
}

@Component({
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [columns]="columns"
      [data]="data"
      [isLoading]="isLoading"
      [hasMore]="hasMore"
      [actions]="actions"
      (rowClick)="onRowClick($event)"
      (loadMore)="onLoadMore()"
      (actionClick)="onActionClick($event)"
      (linkClick)="onLinkClick($event)"
    />
  `,
})
class TestHostComponent {
  columns: ColumnDef[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
  ];
  data: TestRow[] = [
    { id: '2', name: 'Banana' },
    { id: '1', name: 'Apple' },
    { id: '3', name: 'Cherry' },
  ];
  isLoading = false;
  hasMore = false;
  actions: RowAction[] = [];
  clickedRow: Record<string, unknown> | null = null;
  loadMoreCalled = false;
  actionClicked: { action: string; row: Record<string, unknown> } | null = null;
  linkClicked: { route: string; id: string } | null = null;

  onRowClick(row: Record<string, unknown>): void {
    this.clickedRow = row;
  }

  onLoadMore(): void {
    this.loadMoreCalled = true;
  }

  onActionClick(event: { action: string; row: Record<string, unknown> }): void {
    this.actionClicked = event;
  }

  onLinkClick(event: { route: string; id: string }): void {
    this.linkClicked = event;
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
    expect(headers[0].textContent).toContain('ID');
    expect(headers[1].textContent).toContain('Name');
  });

  it('should render data rows', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.data-row');
    expect(rows.length).toBe(3);
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
    expect(fixture.componentInstance.clickedRow).toEqual({ id: '2', name: 'Banana' });
  });

  it('should emit rowClick on Enter key', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const firstRow = fixture.nativeElement.querySelector('.data-row');
    firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(fixture.componentInstance.clickedRow).toEqual({ id: '2', name: 'Banana' });
  });

  it('should render proper table structure with thead and tbody', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('thead')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('tbody')).toBeTruthy();
  });

  // Sorting tests
  it('should show sort indicator on sortable columns', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const indicators = fixture.nativeElement.querySelectorAll('.sort-indicator');
    expect(indicators.length).toBe(2);
  });

  it('should sort ascending on first header click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const nameHeader = fixture.nativeElement.querySelectorAll('th')[1];
    nameHeader.click();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.data-row');
    expect(rows[0].textContent).toContain('Apple');
    expect(rows[1].textContent).toContain('Banana');
    expect(rows[2].textContent).toContain('Cherry');
  });

  it('should sort descending on second header click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const nameHeader = fixture.nativeElement.querySelectorAll('th')[1];
    nameHeader.click(); // asc
    nameHeader.click(); // desc
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.data-row');
    expect(rows[0].textContent).toContain('Cherry');
    expect(rows[2].textContent).toContain('Apple');
  });

  it('should reset sort on third header click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const nameHeader = fixture.nativeElement.querySelectorAll('th')[1];
    nameHeader.click(); // asc
    nameHeader.click(); // desc
    nameHeader.click(); // reset
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.data-row');
    // Back to original order
    expect(rows[0].textContent).toContain('Banana');
  });

  it('should not sort non-sortable columns', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ];
    fixture.detectChanges();
    const indicators = fixture.nativeElement.querySelectorAll('.sort-indicator');
    expect(indicators.length).toBe(0);
  });

  // Dual-line cell tests
  it('should render dual-line cells with primary and secondary text', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'name', label: 'Name', type: 'dual-line', secondaryKey: 'technical_label' },
    ];
    fixture.componentInstance.data = [
      { id: '1', name: 'Test Item', technical_label: 'test_item' },
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dual-line-primary').textContent).toContain('Test Item');
    expect(fixture.nativeElement.querySelector('.dual-line-secondary').textContent).toContain('test_item');
  });

  // Link cell tests
  it('should render link cells as anchors opening in new tab', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'name', label: 'Name', type: 'link', linkRoute: '/items', linkIdKey: 'id' },
    ];
    fixture.componentInstance.data = [
      { id: 'abc', name: 'Linked Item' },
    ];
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.cell-link');
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Linked Item');
    expect(link.getAttribute('href')).toBe('/items/abc');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  // Action button tests
  it('should show action buttons on hover', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.actions = [
      { label: 'Delete', handler: 'delete', variant: 'danger' },
    ];
    fixture.detectChanges();

    const actionBtns = fixture.nativeElement.querySelectorAll('.action-btn');
    expect(actionBtns.length).toBe(3); // one per row
  });

  it('should emit actionClick and not rowClick on action button click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.actions = [
      { label: 'Delete', handler: 'delete' },
    ];
    fixture.detectChanges();

    const actionBtn = fixture.nativeElement.querySelector('.action-btn');
    actionBtn.click();

    expect(fixture.componentInstance.actionClicked).toBeTruthy();
    expect(fixture.componentInstance.actionClicked!.action).toBe('delete');
    // rowClick should NOT have been triggered due to stopPropagation
    expect(fixture.componentInstance.clickedRow).toBeNull();
  });
});
