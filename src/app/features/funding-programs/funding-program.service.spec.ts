import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { FundingProgramService } from './funding-program.service';
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

describe('FundingProgramService', () => {
  let service: FundingProgramService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), FundingProgramService],
    });

    service = TestBed.inject(FundingProgramService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should extend BaseEntityService with correct API path', () => {
    service.list().subscribe();

    const req = httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], pagination: { total_count: 0, page_size: 50, has_next_page: false, has_previous_page: false, cursors: { start_cursor: null, end_cursor: null }, _links: { self: '', next: null, prev: null, first: '' } } });
  });

  it('should fetch a list of funding programs', () => {
    service.list().subscribe((response) => {
      expect(response.data).toHaveLength(1);
      expect(response.data[0].name).toBe('Test Program');
    });

    const req = httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`);
    req.flush({
      data: [mockProgram],
      pagination: { total_count: 1, page_size: 50, has_next_page: false, has_previous_page: false, cursors: { start_cursor: null, end_cursor: null }, _links: { self: '', next: null, prev: null, first: '' } },
    });

    expect(service.items()).toHaveLength(1);
  });

  it('should fetch a funding program by ID', () => {
    service.getById(mockProgram.id).subscribe((program) => {
      expect(program.name).toBe('Test Program');
    });

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/funding-programs/${mockProgram.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProgram);

    expect(service.selectedItem()).toEqual(mockProgram);
  });

  it('should append items on paginated list with cursor', () => {
    const secondProgram: FundingProgram = { ...mockProgram, id: 'second-id', name: 'Second Program' };
    const pagination = { total_count: 2, page_size: 1, has_next_page: true, has_previous_page: false, cursors: { start_cursor: 'c1', end_cursor: 'c2' }, _links: { self: '', next: null, prev: null, first: '' } };

    service.list().subscribe();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({ data: [mockProgram], pagination });

    service.list('c2').subscribe();
    const req = httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/` && r.params.get('cursor') === 'c2');
    req.flush({ data: [secondProgram], pagination: { ...pagination, has_next_page: false } });

    expect(service.items()).toHaveLength(2);
    expect(service.items()[1].name).toBe('Second Program');
  });

  it('should correctly extract ID from funding program', () => {
    service.list().subscribe();
    httpTesting.expectOne((r) => r.url === `${environment.apiBaseUrl}/funding-programs/`).flush({
      data: [mockProgram],
      pagination: { total_count: 1, page_size: 50, has_next_page: false, has_previous_page: false, cursors: { start_cursor: null, end_cursor: null }, _links: { self: '', next: null, prev: null, first: '' } },
    });

    expect(service.items()[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});
