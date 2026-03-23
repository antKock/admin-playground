import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { FundingProgramListComponent } from './funding-program-list.component';

describe('FundingProgramListComponent', () => {
  let component: FundingProgramListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundingProgramListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(FundingProgramListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have filterable Statut column with active_only filterKey', () => {
    const statutCol = component.columns.find(c => c.key === 'active_display');
    expect(statutCol?.filterable).toBe(true);
    expect(statutCol?.filterKey).toBe('active_only');
    expect(statutCol?.filterOptions).toEqual([
      { id: 'true', label: 'Actif' },
    ]);
  });

  it('should pass active_only filter to facade.load on filter change', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.onFilterChange({ key: 'active_only', values: ['true'] });
    expect(component.activeFilters()).toEqual({ active_only: ['true'] });
    expect(loadSpy).toHaveBeenCalledWith({ active_only: ['true'] });
  });

  it('should clear filters and reload with empty filters', () => {
    component.activeFilters.set({ active_only: ['true'] });
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.clearFilters();
    expect(component.activeFilters()).toEqual({});
    expect(loadSpy).toHaveBeenCalledWith({});
  });
});
