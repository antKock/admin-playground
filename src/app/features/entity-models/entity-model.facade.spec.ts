import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { EntityModelFacade } from './entity-model.facade';
import { EntityModel } from '@domains/entity-models/entity-model.models';
import { ToastService } from '@shared/components/toast/toast.service';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/entity-models/`;

const mockEntityModels: EntityModel[] = [
  {
    entity_type: 'community',
    name: 'Communautés',
    id: 'em-1',
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
    sections: [],
  },
  {
    entity_type: 'agent',
    name: 'Agents',
    id: 'em-2',
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
    sections: [],
  },
  {
    entity_type: 'site',
    name: 'Sites',
    id: 'em-3',
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
    sections: [],
  },
];

describe('EntityModelFacade', () => {
  let facade: EntityModelFacade;
  let httpTesting: HttpTestingController;
  let toastService: ToastService;
  let successSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    facade = TestBed.inject(EntityModelFacade);
    httpTesting = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    successSpy = vi.spyOn(toastService, 'success');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('loadAll', () => {
    it('should populate items with 3 entity models', () => {
      facade.loadAll();

      const req = httpTesting.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush(mockEntityModels);

      expect(facade.items().length).toBe(3);
      expect(facade.items()[0].entity_type).toBe('community');
      expect(facade.items()[1].entity_type).toBe('agent');
      expect(facade.items()[2].entity_type).toBe('site');
    });
  });

  describe('selectByType', () => {
    it('should set selectedItem', () => {
      facade.selectByType('community');

      const req = httpTesting.expectOne(`${BASE}community`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEntityModels[0]);

      expect(facade.selectedItem()?.entity_type).toBe('community');
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedItem', () => {
      facade.selectByType('agent');
      httpTesting.expectOne(`${BASE}agent`).flush(mockEntityModels[1]);

      expect(facade.selectedItem()).not.toBeNull();
      facade.clearSelection();
      expect(facade.selectedItem()).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and show success toast then re-select', async () => {
      // First select the entity model
      facade.selectByType('community');
      httpTesting.expectOne(`${BASE}community`).flush(mockEntityModels[0]);

      const updatePromise = facade.update('community', { name: 'Communautés v2' });

      const updateReq = httpTesting.expectOne(`${BASE}community`);
      expect(updateReq.request.method).toBe('PUT');
      expect(updateReq.request.body).toEqual({ name: 'Communautés v2' });
      updateReq.flush({ ...mockEntityModels[0], name: 'Communautés v2' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'entité mis à jour');

      // Re-select fires another GET
      const reselectReq = httpTesting.expectOne(`${BASE}community`);
      reselectReq.flush({ ...mockEntityModels[0], name: 'Communautés v2' });
    });
  });

  describe('entityModelCards', () => {
    it('should compute card data from items', () => {
      facade.loadAll();
      httpTesting.expectOne(BASE).flush(mockEntityModels);

      const cards = facade.entityModelCards();
      expect(cards.length).toBe(3);
      expect(cards[0].label).toBe('Communautés');
      expect(cards[0].icon).toBe('🏘');
      expect(cards[0].route).toBe('/entity-models/community');
      expect(cards[1].label).toBe('Agents');
      expect(cards[2].label).toBe('Sites');
    });

    it('should extract indicator count from additional_info section', () => {
      const modelsWithSection: EntityModel[] = [{
        ...mockEntityModels[0],
        sections: [{
          id: 's-1',
          name: 'Infos',
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
            { id: 'ind-1', name: 'Ind 1', technical_label: 'ind1', type: 'text', hidden_rule: 'false', required_rule: 'false', disabled_rule: 'false', default_value_rule: 'false', occurrence_rule: { min: 'false', max: 'false' }, constrained_rule: 'false', position: 0, created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z' },
            { id: 'ind-2', name: 'Ind 2', technical_label: 'ind2', type: 'number', hidden_rule: 'false', required_rule: 'false', disabled_rule: 'false', default_value_rule: 'false', occurrence_rule: { min: 'false', max: 'false' }, constrained_rule: 'false', position: 1, created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z' },
          ],
        }],
      }];

      facade.loadAll();
      httpTesting.expectOne(BASE).flush(modelsWithSection);

      const cards = facade.entityModelCards();
      expect(cards[0].indicatorCount).toBe(2);
    });
  });
});
