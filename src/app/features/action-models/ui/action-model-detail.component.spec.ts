import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { ActionModelDetailComponent } from './action-model-detail.component';

describe('ActionModelDetailComponent', () => {
  let component: ActionModelDetailComponent;
  let fixture: ComponentFixture<ActionModelDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionModelDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'am-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionModelDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call facade.select and loadIndicators on init', () => {
    const selectSpy = vi.spyOn(component.facade, 'select');
    const loadIndicatorsSpy = vi.spyOn(component.facade, 'loadIndicators');
    component.ngOnInit();
    expect(selectSpy).toHaveBeenCalledWith('am-1');
    expect(loadIndicatorsSpy).toHaveBeenCalled();
  });

  it('should compute empty indicatorCards when no attached indicators', () => {
    expect(component.indicatorCards()).toEqual([]);
  });

  it('should delegate param updates to facade', () => {
    const updateSpy = vi.spyOn(component.facade, 'updateParams');
    const params = {
      visibility_rule: 'true',
      required_rule: 'true',
      editable_rule: 'true',
      default_value_rule: null,
      duplicable: null,
      constrained_values: null,
    };
    component.onParamsChange('ind-1', params);
    expect(updateSpy).toHaveBeenCalledWith('ind-1', params);
  });

  it('should delegate discard to facade', () => {
    const discardSpy = vi.spyOn(component.facade, 'discardParamEdits');
    component.onDiscard();
    expect(discardSpy).toHaveBeenCalled();
  });

  it('should call facade.clearSelection on destroy', () => {
    const clearSpy = vi.spyOn(component.facade, 'clearSelection');
    component.ngOnDestroy();
    expect(clearSpy).toHaveBeenCalled();
  });
});
