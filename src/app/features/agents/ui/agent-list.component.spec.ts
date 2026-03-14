import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AgentListComponent } from './agent-list.component';

describe('AgentListComponent', () => {
  let component: AgentListComponent;
  let fixture: ComponentFixture<AgentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should define expected columns', () => {
    expect(component.columns().map(c => c.key)).toEqual([
      'displayName', 'email', 'agent_type', 'status', 'community_name', 'last_updated_at',
    ]);
  });

  it('should include status-badge column type', () => {
    const statusCol = component.columns().find(c => c.key === 'status');
    expect(statusCol?.type).toBe('status-badge');
  });

  it('should have status column marked as filterable', () => {
    const statusCol = component.columns().find(c => c.key === 'status');
    expect(statusCol?.filterable).toBe(true);
    expect(statusCol?.filterKey).toBe('status');
    expect(statusCol?.filterOptions?.length).toBe(3);
  });

  it('should call facade.load on init with empty filters', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    const assocSpy = vi.spyOn(component.facade, 'loadAssociationData');
    component.ngOnInit();
    expect(assocSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalledWith({});
  });

  it('should start with no active filters', () => {
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('should pass filter to facade.load on filterChange', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.onFilterChange({ key: 'status', values: ['draft'] });
    expect(component.hasActiveFilters()).toBe(true);
    expect(loadSpy).toHaveBeenCalledWith({ status: 'draft' });
  });

  it('should clear filters and reload with empty filters', () => {
    component.onFilterChange({ key: 'status', values: ['completed'] });
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.clearFilters();
    expect(component.hasActiveFilters()).toBe(false);
    expect(loadSpy).toHaveBeenCalledWith({});
  });

  it('should have community column marked as filterable', () => {
    const communityCol = component.columns().find(c => c.key === 'community_name');
    expect(communityCol?.filterable).toBe(true);
    expect(communityCol?.filterKey).toBe('community_id');
  });

  it('should support multi-select filter values', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.onFilterChange({ key: 'status', values: ['draft', 'completed'] });
    expect(loadSpy).toHaveBeenCalledWith({ status: 'draft,completed' });
  });
});
