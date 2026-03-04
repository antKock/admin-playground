import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { ActionThemeListComponent } from './action-theme-list.component';
import { ActionTheme } from './action-theme.model';
import { environment } from '@app/../environments/environment';

const mockTheme: ActionTheme = {
  id: 'theme-uuid-1',
  unique_id: 'unique-1',
  name: 'Test Theme',
  technical_label: 'test_theme',
  description: 'A test theme',
  icon: null,
  color: null,
  status: 'draft',
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

describe('ActionThemeListComponent', () => {
  let component: ActionThemeListComponent;
  let fixture: ComponentFixture<ActionThemeListComponent>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionThemeListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionThemeListComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTesting.verify());

  it('should create and load themes', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes`).flush({
      data: [mockTheme],
      pagination: emptyPagination,
    });
    expect(component.items()).toHaveLength(1);
  });

  it('should display empty state', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes`).flush({ data: [], pagination: emptyPagination });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No action themes found');
  });

  it('should navigate to detail on row click', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes`).flush({ data: [mockTheme], pagination: emptyPagination });
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onRowClick({ id: mockTheme.id });
    expect(navigateSpy).toHaveBeenCalledWith(['/action-themes', mockTheme.id]);
  });

  it('should have status column', () => {
    expect(component.columns.find((c) => c.key === 'status')).toBeTruthy();
  });

  it('should filter by status', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes`).flush({ data: [mockTheme], pagination: emptyPagination });

    component.onStatusFilterChange({ target: { value: 'published' } } as unknown as Event);

    const req = httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes` && r.params.get('status') === 'published');
    req.flush({ data: [], pagination: emptyPagination });
    expect(component.statusFilter()).toBe('published');
  });

  it('should clear filters and reload', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes`).flush({ data: [mockTheme], pagination: emptyPagination });

    component.statusFilter.set('draft');
    component.clearFilters();

    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes` && !r.params.has('status')).flush({
      data: [mockTheme],
      pagination: emptyPagination,
    });
    expect(component.statusFilter()).toBe('');
  });

  it('should show filtered empty state message', () => {
    fixture.detectChanges();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes`).flush({ data: [mockTheme], pagination: emptyPagination });

    component.onStatusFilterChange({ target: { value: 'disabled' } } as unknown as Event);
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes`).flush({ data: [], pagination: emptyPagination });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No action themes match your filters');
  });
});
