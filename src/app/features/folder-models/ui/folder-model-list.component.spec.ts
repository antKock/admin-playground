import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { FolderModelListComponent } from './folder-model-list.component';

describe('FolderModelListComponent', () => {
  let component: FolderModelListComponent;
  let fixture: ComponentFixture<FolderModelListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderModelListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderModelListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should define expected columns', () => {
    expect(component.columns().map(c => c.key)).toEqual([
      'name', 'description', 'funding_programs_display', 'last_updated_at',
    ]);
  });

  it('should call facade.load and loadAssociationData on init', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    const assocSpy = vi.spyOn(component.facade, 'loadAssociationData');
    component.ngOnInit();
    expect(loadSpy).toHaveBeenCalledWith({});
    expect(assocSpy).toHaveBeenCalled();
  });

  it('should start with empty filters', () => {
    expect(component.activeFilters()).toEqual({});
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('should pass funding_program_id filter to facade.load on filter change', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.onFilterChange({ key: 'funding_program_id', values: ['fp-123'] });
    expect(component.activeFilters()).toEqual({ funding_program_id: ['fp-123'] });
    expect(loadSpy).toHaveBeenCalledWith({ funding_program_id: ['fp-123'] });
  });

  it('should clear filters and reload with empty filters', () => {
    component.activeFilters.set({ funding_program_id: ['fp-123'] });
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.clearFilters();
    expect(component.activeFilters()).toEqual({});
    expect(loadSpy).toHaveBeenCalledWith({});
  });

  it('should have filterable funding_programs_display column', () => {
    const col = component.columns().find(c => c.key === 'funding_programs_display');
    expect(col?.filterable).toBe(true);
    expect(col?.filterKey).toBe('funding_program_id');
  });
});
