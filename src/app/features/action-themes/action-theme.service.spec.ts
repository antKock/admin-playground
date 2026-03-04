import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ActionThemeService } from './action-theme.service';
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

describe('ActionThemeService', () => {
  let service: ActionThemeService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ActionThemeService],
    });
    service = TestBed.inject(ActionThemeService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list action themes', () => {
    service.list().subscribe((res) => expect(res.data).toHaveLength(1));
    const req = httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/action-themes`);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [mockTheme],
      pagination: { total_count: 1, page_size: 50, has_next_page: false, has_previous_page: false, cursors: { start_cursor: null, end_cursor: null }, _links: { self: '', next: null, prev: null, first: '' } },
    });
  });

  it('should get action theme by ID', () => {
    service.getById(mockTheme.id).subscribe((t) => expect(t.name).toBe('Test Theme'));
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);
  });

  it('should publish an action theme', () => {
    service.publish(mockTheme.id).subscribe();
    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}/publish`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockTheme, status: 'published' });
  });

  it('should disable an action theme', () => {
    service.disable(mockTheme.id).subscribe();
    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}/disable`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockTheme, status: 'disabled' });
  });

  it('should activate an action theme', () => {
    service.activate(mockTheme.id).subscribe();
    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}/activate`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockTheme, status: 'published' });
  });

  it('should duplicate an action theme', () => {
    service.duplicate(mockTheme.id).subscribe();
    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}/duplicate`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockTheme, id: 'new-uuid', status: 'draft' });
  });
});
