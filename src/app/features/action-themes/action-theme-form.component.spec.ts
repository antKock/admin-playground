import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';

import { ActionThemeFormComponent } from './action-theme-form.component';
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

describe('ActionThemeFormComponent - Create Mode', () => {
  let component: ActionThemeFormComponent;
  let fixture: ComponentFixture<ActionThemeFormComponent>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionThemeFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionThemeFormComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('should be in create mode', () => {
    expect(component.isEditMode).toBe(false);
  });

  it('should validate required fields', () => {
    component.onSubmit();
    expect(component.showError('name')).toBe(true);
    expect(component.showError('technical_label')).toBe(true);
  });

  it('should submit create request', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.form.patchValue({ name: 'New Theme', technical_label: 'new_theme' });
    component.onSubmit();

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.status).toBe('draft');
    req.flush(mockTheme);

    expect(navigateSpy).toHaveBeenCalledWith(['/action-themes', mockTheme.id]);
  });
});

describe('ActionThemeFormComponent - Edit Mode', () => {
  let component: ActionThemeFormComponent;
  let fixture: ComponentFixture<ActionThemeFormComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionThemeFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', mockTheme.id]]) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionThemeFormComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('should be in edit mode and pre-populate', () => {
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);
    expect(component.isEditMode).toBe(true);
    expect(component.form.get('name')!.value).toBe('Test Theme');
    expect(component.form.get('technical_label')!.value).toBe('test_theme');
  });

  it('should submit update request', () => {
    httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`).flush(mockTheme);
    component.form.patchValue({ name: 'Updated Theme' });
    component.onSubmit();

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/action-themes/${mockTheme.id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockTheme, name: 'Updated Theme' });
  });
});
