import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { IndicatorModelListComponent } from './indicator-model-list.component';

describe('IndicatorModelListComponent', () => {
  let component: IndicatorModelListComponent;
  let fixture: ComponentFixture<IndicatorModelListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicatorModelListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorModelListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should define expected columns', () => {
    expect(component.columns.map(c => c.key)).toEqual([
      'name', 'type_display', 'status', 'unit_display', 'last_updated_at',
    ]);
  });

  it('should include status-badge column type for type', () => {
    const typeCol = component.columns.find(c => c.key === 'type_display');
    expect(typeCol?.type).toBe('status-badge');
  });

  it('should have filterable type column', () => {
    const typeCol = component.columns.find(c => c.key === 'type_display');
    expect(typeCol?.filterable).toBe(true);
    expect(typeCol?.filterKey).toBe('type');
    expect(typeCol?.filterOptions).toEqual([
      { id: 'text_short', label: 'Texte court' },
      { id: 'text_long', label: 'Texte long' },
      { id: 'text_email', label: 'E-mail' },
      { id: 'text_phone', label: 'Téléphone' },
      { id: 'text_iban', label: 'IBAN' },
      { id: 'number', label: 'Nombre' },
      { id: 'list_single', label: 'Liste simple' },
      { id: 'list_multiple', label: 'Liste multiple' },
      { id: 'boolean', label: 'Booléen' },
      { id: 'file_upload', label: 'Fichier (upload)' },
      { id: 'file_downloadable', label: 'Fichier (téléchargeable)' },
      { id: 'date_full', label: 'Date complète' },
      { id: 'date_month', label: 'Date (mois)' },
      { id: 'date_year', label: 'Date (année)' },
      { id: 'group', label: 'Groupe' },
    ]);
  });

  it('should call facade.load on init', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.ngOnInit();
    expect(loadSpy).toHaveBeenCalledWith({});
  });

  it('should start with empty filters', () => {
    expect(component.activeFilters()).toEqual({});
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('should pass type filter to facade.load on filter change', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.onFilterChange({ key: 'type', values: ['number'] });
    expect(component.activeFilters()).toEqual({ type: ['number'] });
    expect(loadSpy).toHaveBeenCalledWith({ type: ['number'] });
  });

  it('should clear filters and reload with empty filters', () => {
    component.activeFilters.set({ type: ['text_short'] });
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.clearFilters();
    expect(component.activeFilters()).toEqual({});
    expect(loadSpy).toHaveBeenCalledWith({});
  });

  it('should pass multi-select filter values as arrays', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.onFilterChange({ key: 'status', values: ['draft', 'published'] });
    expect(component.activeFilters()).toEqual({ status: ['draft', 'published'] });
    expect(loadSpy).toHaveBeenCalledWith({ status: ['draft', 'published'] });
  });
});
