import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { FundingProgramListComponent } from './funding-program-list.component';
import { FundingProgram } from './funding-program.model';
import { environment } from '@app/../environments/environment';

const mockProgram: FundingProgram = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Program',
  description: 'A test funding program',
  budget: 50000,
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  is_active: true,
  folder_model_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const emptyPagination = {
  total_count: 0,
  page_size: 50,
  has_next_page: false,
  has_previous_page: false,
  cursors: { start_cursor: null, end_cursor: null },
  _links: { self: '', next: null, prev: null, first: '' },
};

describe('FundingProgramListComponent', () => {
  let component: FundingProgramListComponent;
  let fixture: ComponentFixture<FundingProgramListComponent>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundingProgramListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FundingProgramListComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTesting.verify());

  it('should create and load programs', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({ data: [mockProgram], pagination: emptyPagination });
    expect(component.items()).toHaveLength(1);
  });

  it('should display empty state when no programs exist', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({ data: [], pagination: emptyPagination });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No funding programs found');
  });

  it('should navigate to detail view on row click', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({ data: [mockProgram], pagination: emptyPagination });
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onRowClick({ id: mockProgram.id });
    expect(navigateSpy).toHaveBeenCalledWith(['/funding-programs', mockProgram.id]);
  });

  it('should support infinite scroll pagination', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({
      data: [mockProgram],
      pagination: { ...emptyPagination, total_count: 2, has_next_page: true, cursors: { start_cursor: 'c1', end_cursor: 'c2' } },
    });

    expect(component.hasMore).toBe(true);
    component.onLoadMore();

    const req = httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/` && r.params.get('cursor') === 'c2');
    req.flush({ data: [{ ...mockProgram, id: 'second-id' }], pagination: { ...emptyPagination, has_next_page: false } });
    expect(component.items()).toHaveLength(2);
    expect(component.hasMore).toBe(false);
  });

  it('should have correct column definitions', () => {
    expect(component.columns).toEqual([
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'created_at', label: 'Created' },
    ]);
  });

  it('should filter by active status', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({ data: [mockProgram], pagination: emptyPagination });

    component.onActiveFilterChange({ target: { value: 'true' } } as unknown as Event);

    const req = httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/` && r.params.get('is_active') === 'true');
    req.flush({ data: [mockProgram], pagination: emptyPagination });
    expect(component.activeFilter()).toBe('true');
  });

  it('should clear filters', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({ data: [mockProgram], pagination: emptyPagination });

    component.activeFilter.set('true');
    component.clearFilters();

    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/` && !r.params.has('is_active')).flush({
      data: [mockProgram],
      pagination: emptyPagination,
    });
    expect(component.activeFilter()).toBe('');
  });

  it('should show filtered empty state', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({ data: [mockProgram], pagination: emptyPagination });

    component.onActiveFilterChange({ target: { value: 'false' } } as unknown as Event);
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({ data: [], pagination: emptyPagination });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No funding programs match your filters');
  });
});
