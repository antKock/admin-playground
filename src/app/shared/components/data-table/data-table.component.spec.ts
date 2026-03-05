import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { DataTableComponent, ColumnDef, RowAction, FilterOption } from './data-table.component';

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
      (filterChange)="onFilterChange($event)"
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
  filterChanged: { key: string; values: string[] } | null = null;

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

  onFilterChange(event: { key: string; values: string[] }): void {
    this.filterChanged = event;
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

  it('should sort ascending on first sort button click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const sortBtns = fixture.nativeElement.querySelectorAll('.sort-btn');
    sortBtns[1].click();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.data-row');
    expect(rows[0].textContent).toContain('Apple');
    expect(rows[1].textContent).toContain('Banana');
    expect(rows[2].textContent).toContain('Cherry');
  });

  it('should sort descending on second sort button click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const sortBtns = fixture.nativeElement.querySelectorAll('.sort-btn');
    sortBtns[1].click(); // asc
    sortBtns[1].click(); // desc
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.data-row');
    expect(rows[0].textContent).toContain('Cherry');
    expect(rows[2].textContent).toContain('Apple');
  });

  it('should reset sort on third sort button click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const sortBtns = fixture.nativeElement.querySelectorAll('.sort-btn');
    sortBtns[1].click(); // asc
    sortBtns[1].click(); // desc
    sortBtns[1].click(); // reset
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

  // Filter tests
  it('should render filter icon button for filterable columns', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Name', filterable: true, filterOptions: [{ id: '1', label: 'A' }] },
    ];
    fixture.detectChanges();
    const filterBtns = fixture.nativeElement.querySelectorAll('.filter-icon-btn');
    expect(filterBtns.length).toBe(1);
  });

  it('should not render filter icon for non-filterable columns', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const filterBtns = fixture.nativeElement.querySelectorAll('.filter-icon-btn');
    expect(filterBtns.length).toBe(0);
  });

  it('should open filter popover on filter icon click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'name', label: 'Name', filterable: true, filterOptions: [{ id: '1', label: 'A' }] },
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-column-filter-popover')).toBeNull();

    const filterBtn = fixture.nativeElement.querySelector('.filter-icon-btn');
    filterBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-column-filter-popover')).toBeTruthy();
  });

  it('should close filter popover on second filter icon click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'name', label: 'Name', filterable: true, filterOptions: [{ id: '1', label: 'A' }] },
    ];
    fixture.detectChanges();

    const filterBtn = fixture.nativeElement.querySelector('.filter-icon-btn');
    filterBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-column-filter-popover')).toBeTruthy();

    filterBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-column-filter-popover')).toBeNull();
  });

  it('should emit filterChange when filter selection changes', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'name', label: 'Name', filterable: true, filterKey: 'name_filter', filterOptions: [{ id: '1', label: 'A' }, { id: '2', label: 'B' }] },
    ];
    fixture.detectChanges();

    // Open popover
    const filterBtn = fixture.nativeElement.querySelector('.filter-icon-btn');
    filterBtn.click();
    fixture.detectChanges();

    // Click first checkbox
    const checkbox = fixture.nativeElement.querySelector('app-column-filter-popover input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.filterChanged).toBeTruthy();
    expect(fixture.componentInstance.filterChanged!.key).toBe('name_filter');
    expect(fixture.componentInstance.filterChanged!.values).toEqual(['1']);
  });

  it('should show filter badge when filter is active', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'name', label: 'Name', filterable: true, filterKey: 'name_filter', filterOptions: [{ id: '1', label: 'A' }, { id: '2', label: 'B' }] },
    ];
    fixture.detectChanges();

    // No badge initially
    expect(fixture.nativeElement.querySelector('.filter-badge')).toBeNull();

    // Open and select
    const filterBtn = fixture.nativeElement.querySelector('.filter-icon-btn');
    filterBtn.click();
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('app-column-filter-popover input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    // Badge should appear
    const badge = fixture.nativeElement.querySelector('.filter-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('1');
  });

  it('should allow sorting and filtering to coexist independently', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.columns = [
      { key: 'name', label: 'Name', sortable: true, filterable: true, filterOptions: [{ id: '1', label: 'A' }] },
    ];
    fixture.detectChanges();

    // Sort should work via sort button click
    const sortBtn = fixture.nativeElement.querySelector('.sort-btn');
    sortBtn.click();
    fixture.detectChanges();

    const th = fixture.nativeElement.querySelector('th');
    expect(th.getAttribute('aria-sort')).toBe('ascending');

    // Filter icon should still be present and clickable
    const filterBtn = fixture.nativeElement.querySelector('.filter-icon-btn');
    expect(filterBtn).toBeTruthy();
    filterBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-column-filter-popover')).toBeTruthy();

    // Sort should still be ascending
    expect(th.getAttribute('aria-sort')).toBe('ascending');
  });

  // Empty state tests
  it('should show empty message when data is empty and emptyMessage is set', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.data = [];
    fixture.componentInstance.isLoading = false;
    fixture.detectChanges();

    // Without emptyMessage, no empty state shown
    expect(fixture.nativeElement.querySelector('.empty-row')).toBeNull();
  });

  it('should show headers even when data is empty with emptyMessage', async () => {
    @Component({
      imports: [DataTableComponent],
      template: `
        <app-data-table
          [columns]="columns"
          [data]="data"
          [emptyMessage]="'No results found.'"
        />
      `,
    })
    class EmptyTestHost {
      columns: ColumnDef[] = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ];
      data: TestRow[] = [];
    }

    await TestBed.configureTestingModule({ imports: [EmptyTestHost] }).compileComponents();
    const fixture = TestBed.createComponent(EmptyTestHost);
    fixture.detectChanges();

    // Headers should still be visible
    const headers = fixture.nativeElement.querySelectorAll('th');
    expect(headers.length).toBe(2);

    // Empty message should be in tbody
    const emptyRow = fixture.nativeElement.querySelector('.empty-row');
    expect(emptyRow).toBeTruthy();
    expect(emptyRow.textContent).toContain('No results found.');
  });

  it('should emit clearFiltersClick and reset internal activeFilters when clear button is clicked', async () => {
    @Component({
      imports: [DataTableComponent],
      template: `
        <app-data-table
          [columns]="columns"
          [data]="data"
          [emptyMessage]="'No results.'"
          (filterChange)="onFilterChange($event)"
          (clearFiltersClick)="clearClicked = true"
        />
      `,
    })
    class ClearFilterTestHost {
      columns: ColumnDef[] = [
        { key: 'name', label: 'Name', filterable: true, filterKey: 'name', filterOptions: [{ id: 'a', label: 'A' }] },
      ];
      data: TestRow[] = [];
      clearClicked = false;
      onFilterChange(_event: { key: string; values: string[] }): void {}
    }

    await TestBed.configureTestingModule({ imports: [ClearFilterTestHost] }).compileComponents();
    const fixture = TestBed.createComponent(ClearFilterTestHost);
    fixture.detectChanges();

    // Open filter and select a value to create active filter state
    const filterBtn = fixture.nativeElement.querySelector('.filter-icon-btn');
    filterBtn.click();
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('app-column-filter-popover input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    // Verify filter badge is shown
    expect(fixture.nativeElement.querySelector('.filter-badge')).toBeTruthy();

    // Click clear filters button
    const clearBtn = fixture.nativeElement.querySelector('.clear-filters-btn');
    expect(clearBtn).toBeTruthy();
    clearBtn.click();
    fixture.detectChanges();

    // Verify parent was notified
    expect(fixture.componentInstance.clearClicked).toBe(true);

    // Verify DataTable's internal filter state was reset (no badge)
    expect(fixture.nativeElement.querySelector('.filter-badge')).toBeNull();
  });
});
