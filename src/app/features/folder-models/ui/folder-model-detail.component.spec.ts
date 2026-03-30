import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { FolderModelDetailComponent } from './folder-model-detail.component';

describe('FolderModelDetailComponent', () => {
  let component: FolderModelDetailComponent;
  let fixture: ComponentFixture<FolderModelDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderModelDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'fm-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderModelDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call facade.select and loadIndicators on init', () => {
    const selectSpy = vi.spyOn(component.facade, 'select');
    const loadIndicatorsSpy = vi.spyOn(component.facade, 'loadIndicators');
    component.ngOnInit();
    expect(selectSpy).toHaveBeenCalledWith('fm-1');
    expect(loadIndicatorsSpy).toHaveBeenCalled();
  });

  it('should compute three merged fixed sections when no sections exist', () => {
    const merged = component.mergedFixedSections();
    expect(merged).toHaveLength(3);
    expect(merged[0].key).toBe('application');
    expect(merged[0].name).toBe('Candidature');
    expect(merged[1].key).toBe('progress');
    expect(merged[1].name).toBe('Suivi');
    expect(merged[2].key).toBe('financial');
    expect(merged[2].name).toBe('Financier');
  });

  it('should delegate section params change to facade', () => {
    const updateSpy = vi.spyOn(component.facade, 'updateSectionParams');
    const section = component.mergedFixedSections()[0];
    const params = { hidden_rule: 'true' };
    component.onSectionParamsChange(section, params as import('@app/shared/components/section-card/section-params-editor.component').SectionParams);
    expect(updateSpy).toHaveBeenCalledWith(section.id, section.key, params);
  });

  it('should extract section params from DisplaySection', () => {
    const section = component.mergedFixedSections()[0];
    const params = component.getSectionParams(section);
    expect(params.hidden_rule).toBe('false');
    expect(params.required_rule).toBe('false');
    expect(params.disabled_rule).toBe('false');
  });
});
