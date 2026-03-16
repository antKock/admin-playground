import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BuildingListComponent } from './building-list.component';

describe('BuildingListComponent', () => {
  let fixture: ComponentFixture<BuildingListComponent>;
  let component: BuildingListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BuildingListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have columns defined', () => {
    expect(component.columns.length).toBeGreaterThan(0);
    expect(component.columns[0].key).toBe('name');
  });

  it('should not show empty message before loading', () => {
    expect(component.emptyMessage()).toBeNull();
  });

  it('should track active filters', () => {
    expect(component.hasActiveFilters()).toBe(false);

    component.onFilterChange({ key: 'site_id', values: ['site-1'] });
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('should clear filters', () => {
    component.onFilterChange({ key: 'site_id', values: ['site-1'] });
    expect(component.hasActiveFilters()).toBe(true);

    component.clearFilters();
    expect(component.hasActiveFilters()).toBe(false);
  });
});
