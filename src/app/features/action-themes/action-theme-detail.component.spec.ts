import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';

import { ActionThemeDetailComponent } from './action-theme-detail.component';
import { ActionTheme } from './action-theme.model';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
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

describe('ActionThemeDetailComponent', () => {
  let component: ActionThemeDetailComponent;
  let fixture: ComponentFixture<ActionThemeDetailComponent>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionThemeDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', mockTheme.id]]) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionThemeDetailComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTesting.verify());

  it('should load theme on init', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);
    expect(component.theme()).toEqual(mockTheme);
  });

  it('should display metadata fields', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);
    const fields = component.fields();
    expect(fields).toHaveLength(8);
    expect(fields[0]).toEqual({ label: 'Name', value: 'Test Theme', type: 'text' });
    expect(fields[1]).toEqual({ label: 'Technical Label', value: 'test_theme', type: 'mono' });
  });

  it('should show Publish button for draft themes', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Publish');
  });

  it('should show Disable button for published themes', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush({ ...mockTheme, status: 'published' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Disable');
  });

  it('should show Activate button for disabled themes', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush({ ...mockTheme, status: 'disabled' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Activate');
  });

  it('should publish and update selected item', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);

    component.onPublish();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}/publish`).flush({ ...mockTheme, status: 'published' });

    expect(component.theme()?.status).toBe('published');
    expect(component.actionLoading()).toBe(false);
  });

  it('should duplicate and navigate', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);

    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onDuplicate();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}/duplicate`).flush({ ...mockTheme, id: 'new-id' });
    expect(navigateSpy).toHaveBeenCalledWith(['/action-themes', 'new-id']);
  });

  it('should not show Edit or Delete for published themes', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush({ ...mockTheme, status: 'published' });
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const buttonTexts = buttons.map((b) => (b as HTMLButtonElement).textContent?.trim());
    expect(buttonTexts).not.toContain('Edit');
    expect(buttonTexts).not.toContain('Delete');
    expect(buttonTexts).toContain('Disable');
    expect(buttonTexts).toContain('Duplicate');
  });

  it('should show Edit and Delete for draft themes', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Edit');
    expect(el.textContent).toContain('Delete');
  });

  it('should show Delete but not Edit for disabled themes', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush({ ...mockTheme, status: 'disabled' });
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const buttonTexts = buttons.map((b) => (b as HTMLButtonElement).textContent?.trim());
    expect(buttonTexts).not.toContain('Edit');
    expect(buttonTexts).toContain('Delete');
    expect(buttonTexts).toContain('Activate');
  });

  it('should show loading state on action buttons', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);
    fixture.detectChanges();

    component.onPublish();
    fixture.detectChanges();
    expect(component.actionLoading()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Publishing...');

    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}/publish`).flush({ ...mockTheme, status: 'published' });
    expect(component.actionLoading()).toBe(false);
  });

  it('should delete with confirmation', async () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);

    const confirmService = TestBed.inject(ConfirmDialogService);
    vi.spyOn(confirmService, 'confirm').mockResolvedValue(true);
    const navigateSpy = vi.spyOn(router, 'navigate');

    await component.onDelete();
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(null);
    expect(navigateSpy).toHaveBeenCalledWith(['/action-themes']);
  });
});
