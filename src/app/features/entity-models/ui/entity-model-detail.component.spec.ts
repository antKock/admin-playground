import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { EntityModelDetailComponent } from './entity-model-detail.component';
import { EntityModel } from '@domains/entity-models/entity-model.models';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/entity-models/`;
const IM_URL = `${environment.apiBaseUrl}/indicator-models/`;

const mockEntityModel: EntityModel = {
  entity_type: 'community',
  name: 'Communautés',
  description: 'Description test',
  id: 'em-1',
  created_at: '2026-01-15T10:30:00Z',
  last_updated_at: '2026-03-20T14:00:00Z',
  last_updated_by_id: null,
  sections: [{
    id: 's-1',
    name: 'Informations complémentaires',
    key: 'additional_info',
    is_enabled: true,
    position: 0,
    hidden_rule: 'false',
    required_rule: 'false',
    disabled_rule: 'false',
    occurrence_rule: { min: 'false', max: 'false' },
    constrained_rule: 'false',
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
    indicators: [
      { id: 'ind-1', name: 'Population', technical_label: 'population', type: 'number', hidden_rule: 'false', required_rule: 'false', disabled_rule: 'false', default_value_rule: 'false', occurrence_rule: { min: 'false', max: 'false' }, constrained_rule: 'false', position: 0, created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z' },
    ],
  }],
};

const mockEntityModelNoSections: EntityModel = {
  ...mockEntityModel,
  sections: [],
};

describe('EntityModelDetailComponent', () => {
  let component: EntityModelDetailComponent;
  let fixture: ComponentFixture<EntityModelDetailComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityModelDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => key === 'entityType' ? 'community' : null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityModelDetailComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  function initAndFlush(model: EntityModel = mockEntityModel): void {
    fixture.detectChanges(); // triggers ngOnInit → selectByType + loadIndicators
    httpTesting.expectOne(`${BASE}community`).flush(model);
    httpTesting.expectOne((req) => req.method === 'GET' && req.url.startsWith(IM_URL)).flush({ items: [], next_cursor: null });
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call facade.selectByType with entityType route param on init', () => {
    const selectSpy = vi.spyOn(component.facade, 'selectByType');
    const loadIndicatorsSpy = vi.spyOn(component.facade, 'loadIndicators');
    component.ngOnInit();
    expect(selectSpy).toHaveBeenCalledWith('community');
    expect(loadIndicatorsSpy).toHaveBeenCalled();
    httpTesting.expectOne(`${BASE}community`).flush(mockEntityModel);
    httpTesting.expectOne((req) => req.method === 'GET' && req.url.startsWith(IM_URL)).flush({ items: [], next_cursor: null });
  });

  it('should call facade.clearSelection on destroy', () => {
    const clearSpy = vi.spyOn(component.facade, 'clearSelection');
    component.ngOnDestroy();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('should use entityType string param, not UUID', () => {
    const route = TestBed.inject(ActivatedRoute);
    expect(route.snapshot.paramMap.get('entityType')).toBe('community');
    expect(route.snapshot.paramMap.get('id')).toBeNull();
  });

  it('should compute breadcrumbs with entity type label after load', () => {
    initAndFlush();
    const crumbs = component.breadcrumbs();
    expect(crumbs[0].label).toBe('Modèles d\'entités');
    expect(crumbs[0].route).toBe('/entity-models');
    expect(crumbs[1].label).toBe('Communautés');
  });

  it('should return false for hasUnsavedChanges when form is pristine', () => {
    initAndFlush();
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('should render header with entity type French label', () => {
    initAndFlush();
    const header = fixture.nativeElement.querySelector('h1');
    expect(header.textContent).toContain('Modèle d\'entité: Communautés');
  });

  it('should render back button with Retour label', () => {
    initAndFlush();
    const backBtn = fixture.nativeElement.querySelector('button');
    expect(backBtn.textContent).toContain('Retour');
  });

  it('should render metadata grid with date fields', () => {
    initAndFlush();
    const metadataGrid = fixture.nativeElement.querySelector('app-metadata-grid');
    expect(metadataGrid).toBeTruthy();
  });

  it('should render properties form section', () => {
    initAndFlush();
    const form = fixture.nativeElement.querySelector('app-entity-model-form-section');
    expect(form).toBeTruthy();
  });

  it('should render section-card for additional_info section', () => {
    initAndFlush();
    const sectionCard = fixture.nativeElement.querySelector('app-section-card');
    expect(sectionCard).toBeTruthy();
  });

  it('should render indicator within additional_info section', () => {
    initAndFlush();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Population');
    expect(el.textContent).toContain('number');
  });

  it('should show empty section message and picker when no section exists', () => {
    initAndFlush(mockEntityModelNoSections);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Aucune section');
    // Picker should still be available to create section on first indicator add
    const picker = el.querySelector('app-indicator-picker');
    expect(picker).toBeTruthy();
  });

  it('should call facade.update via form save', async () => {
    initAndFlush();
    const updateSpy = vi.spyOn(component.facade, 'update').mockResolvedValue();

    // Access the form section child and submit
    const formEl = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    expect(formEl).toBeTruthy();

    // Change the name input to make form dirty
    const nameInput = formEl.querySelector('#name') as HTMLInputElement;
    nameInput.value = 'Communautés v2';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    formEl.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith('community', expect.objectContaining({ name: 'Communautés v2' }));
  });

  it('should call facade.removeIndicatorFromSection on detach', async () => {
    const removeSpy = vi.spyOn(component.facade, 'removeIndicatorFromSection').mockResolvedValue();
    initAndFlush();

    const section = mockEntityModel.sections![0];
    await component.onSectionDetach(section, 'ind-1');

    expect(removeSpy).toHaveBeenCalledWith('s-1', 'ind-1');
  });
});
