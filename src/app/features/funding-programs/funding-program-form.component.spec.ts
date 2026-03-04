import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';

import { FundingProgramFormComponent } from './funding-program-form.component';
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

describe('FundingProgramFormComponent - Create Mode', () => {
  let component: FundingProgramFormComponent;
  let fixture: ComponentFixture<FundingProgramFormComponent>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundingProgramFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FundingProgramFormComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('should create in create mode', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode).toBe(false);
  });

  it('should show "Create Funding Program" title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Create Funding Program');
  });

  it('should validate required name field', () => {
    component.form.get('name')!.markAsTouched();
    expect(component.showError('name')).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(component.form.get('name')!.touched).toBe(true);
  });

  it('should submit create request with valid data', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.form.patchValue({ name: 'New Program' });
    component.onSubmit();

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs`);
    expect(req.request.method).toBe('POST');
    req.flush(mockProgram);

    expect(navigateSpy).toHaveBeenCalledWith(['/funding-programs', mockProgram.id]);
  });
});

describe('FundingProgramFormComponent - Edit Mode', () => {
  let component: FundingProgramFormComponent;
  let fixture: ComponentFixture<FundingProgramFormComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundingProgramFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', mockProgram.id]]) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FundingProgramFormComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('should be in edit mode', () => {
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    expect(component.isEditMode).toBe(true);
  });

  it('should pre-populate form with existing data', () => {
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    expect(component.form.get('name')!.value).toBe('Test Program');
    expect(component.form.get('budget')!.value).toBe(50000);
  });

  it('should show "Edit Funding Program" title', () => {
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Edit Funding Program');
  });

  it('should submit update request', () => {
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);

    component.form.patchValue({ name: 'Updated Program' });
    component.onSubmit();

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockProgram, name: 'Updated Program' });
  });
});
