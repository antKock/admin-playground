import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';

import { FundingProgramDetailComponent } from './funding-program-detail.component';
import { FundingProgram } from './funding-program.model';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
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

describe('FundingProgramDetailComponent', () => {
  let component: FundingProgramDetailComponent;
  let fixture: ComponentFixture<FundingProgramDetailComponent>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundingProgramDetailComponent],
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

    fixture = TestBed.createComponent(FundingProgramDetailComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
  });

  it('should fetch program by ID on init', () => {
    fixture.detectChanges();

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProgram);

    expect(component.program()).toEqual(mockProgram);
  });

  it('should display program details in metadata grid', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    fixture.detectChanges();

    const fields = component.fields();
    expect(fields).toHaveLength(8);
    expect(fields[0]).toEqual({ label: 'Name', value: 'Test Program', type: 'text' });
    expect(fields[1]).toEqual({ label: 'Description', value: 'A test funding program', type: 'text' });
    expect(fields[2]).toEqual({ label: 'Budget', value: '50000', type: 'text' });
    expect(fields[3]).toEqual({ label: 'Active', value: 'Yes', type: 'text' });
  });

  it('should show skeleton loading while data loads', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.animate-pulse')).toBeTruthy();

    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    fixture.detectChanges();
    expect(el.querySelector('.animate-pulse')).toBeFalsy();
  });

  it('should have back to list navigation', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Back to list');
  });

  it('should have edit and delete buttons', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Edit');
    expect(el.textContent).toContain('Delete');
  });

  it('should display dashes for null optional fields', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush({
      ...mockProgram,
      description: null,
      budget: null,
      start_date: null,
      end_date: null,
    });
    fixture.detectChanges();

    const fields = component.fields();
    expect(fields[1].value).toBe('—');
    expect(fields[2].value).toBe('—');
    expect(fields[4].value).toBe('—');
    expect(fields[5].value).toBe('—');
  });

  it('should call delete with confirmation dialog', async () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    fixture.detectChanges();

    const confirmService = TestBed.inject(ConfirmDialogService);
    const confirmSpy = vi.spyOn(confirmService, 'confirm').mockResolvedValue(true);
    const navigateSpy = vi.spyOn(router, 'navigate');

    await component.onDelete();

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delete Funding Program', confirmVariant: 'danger' }),
    );

    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(null);
    expect(navigateSpy).toHaveBeenCalledWith(['/funding-programs']);
  });

  it('should not delete when confirmation is cancelled', async () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`).flush(mockProgram);
    fixture.detectChanges();

    const confirmService = TestBed.inject(ConfirmDialogService);
    vi.spyOn(confirmService, 'confirm').mockResolvedValue(false);

    await component.onDelete();
    // No delete request should be made
  });
});
