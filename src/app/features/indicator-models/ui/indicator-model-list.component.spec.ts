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
      'name', 'type_display', 'unit_display', 'updated_at',
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
      { id: 'text', label: 'Texte' },
      { id: 'number', label: 'Nombre' },
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
    expect(loadSpy).toHaveBeenCalledWith({ type: 'number' });
  });

  it('should clear filters and reload with empty filters', () => {
    component.activeFilters.set({ type: ['text'] });
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.clearFilters();
    expect(component.activeFilters()).toEqual({});
    expect(loadSpy).toHaveBeenCalledWith({});
  });
});
