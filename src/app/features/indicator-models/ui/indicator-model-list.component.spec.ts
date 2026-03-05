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
      'name', 'type_display', 'unit', 'created_at',
    ]);
  });

  it('should include status-badge column type for type', () => {
    const typeCol = component.columns.find(c => c.key === 'type_display');
    expect(typeCol?.type).toBe('status-badge');
  });

  it('should call facade.load on init', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.ngOnInit();
    expect(loadSpy).toHaveBeenCalledWith({});
  });

  it('should start with empty filter', () => {
    expect(component.typeFilter()).toBe('');
  });

  it('should pass type filter to facade.load on filter change', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    const event = { target: { value: 'number' } } as unknown as Event;
    component.onTypeFilterChange(event);
    expect(component.typeFilter()).toBe('number');
    expect(loadSpy).toHaveBeenCalledWith({ type: 'number' });
  });

  it('should clear filter and reload with empty filters', () => {
    component.typeFilter.set('text');
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.clearFilters();
    expect(component.typeFilter()).toBe('');
    expect(loadSpy).toHaveBeenCalledWith({});
  });
});
