import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { ActionModelFacade } from './action-model.facade';
import { ActionModel } from '@domains/action-models/action-model.models';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@shared/components/toast/toast.service';

const mockActionModel: ActionModel = {
  id: 'am-1',
  name: 'Test Action Model',
  description: 'A test action model',
  status: 'draft',
  funding_program_id: 'fp-1',
  action_theme_id: 'at-1',
  funding_program: {
    id: 'fp-1',
    name: 'Test FP',
    description: null,
    budget: null,
    is_active: true,
    start_date: null,
    end_date: null,
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
  },
  action_theme: {
    id: 'at-1',
    name: 'Test AT',
    technical_label: 'test-at',
    unique_id: 'test-at',
    description: null,
    status: 'published',
    icon: null,
    color: null,
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
  },
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<ActionModel> = {
  data: [mockActionModel],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/action-models/', next: null, prev: null, first: '/action-models/' },
  },
};

describe('ActionModelFacade', () => {
  let facade: ActionModelFacade;
  let httpTesting: HttpTestingController;
  let toastService: ToastService;
  let successSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    facade = TestBed.inject(ActionModelFacade);
    httpTesting = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    successSpy = vi.spyOn(toastService, 'success');
    errorSpy = vi.spyOn(toastService, 'error');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('load', () => {
    it('should trigger domain store load and populate items', () => {
      facade.load();

      const req = httpTesting.expectOne((r) => r.url.includes('action-models') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Action Model');
    });
  });

  describe('loadMore', () => {
    it('should trigger domain store loadMore', () => {
      facade.load();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      expect(facade.hasMore()).toBe(true);

      facade.loadMore();

      const moreResponse = {
        ...mockPaginatedResponse,
        data: [{ ...mockActionModel, id: 'am-2', name: 'Model 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('am-1');

      const req = httpTesting.expectOne((r) => r.url.includes('action-models/am-1'));
      req.flush(mockActionModel);

      expect(facade.selectedItem()).toEqual(mockActionModel);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({
        name: 'New Model',
        status: 'draft',
        funding_program_id: 'fp-1',
        action_theme_id: 'at-1',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('action-models'));
      createReq.flush({ ...mockActionModel, id: 'am-new', name: 'New Model' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('am-1', { name: 'Updated Model' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1'));
      updateReq.flush({ ...mockActionModel, name: 'Updated Model' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action mis à jour');

      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('am-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('action-models/am-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action supprimé');
    });
  });

  describe('publish', () => {
    it('should trigger publish mutation, show toast, and reload detail on success', async () => {
      const publishPromise = facade.publish('am-1');

      const publishReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1/publish'));
      publishReq.flush({ ...mockActionModel, status: 'published' });

      await publishPromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action publié');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush({ ...mockActionModel, status: 'published' });
    });
  });

  describe('disable', () => {
    it('should trigger disable mutation, show toast, and reload detail on success', async () => {
      const disablePromise = facade.disable('am-1');

      const disableReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1/disable'));
      disableReq.flush({ ...mockActionModel, status: 'disabled' });

      await disablePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action désactivé');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush({ ...mockActionModel, status: 'disabled' });
    });
  });

  describe('activate', () => {
    it('should trigger activate mutation, show toast, and reload detail on success', async () => {
      const activatePromise = facade.activate('am-1');

      const activateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1/activate'));
      activateReq.flush({ ...mockActionModel, status: 'published' });

      await activatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'action activé');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush({ ...mockActionModel, status: 'published' });
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({
        name: 'Bad',
        status: 'draft',
        funding_program_id: 'fp-1',
        action_theme_id: 'at-1',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });

    it('should show error toast on publish error', async () => {
      const publishPromise = facade.publish('am-1');

      const req = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-models/am-1/publish'));
      req.flush({ detail: 'Cannot publish' }, { status: 422, statusText: 'Unprocessable Entity' });

      await publishPromise;

      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });

  describe('section toggles', () => {
    const mockWithSections = {
      ...mockActionModel,
      sections: [{
        id: 'sec-1',
        name: 'Sites',
        key: 'buildings' as const,
        association_entity_type: 'buildings' as const,
        is_enabled: true,
        position: 0,
        hidden_rule: 'false',
        disabled_rule: 'false',
        required_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
        created_at: '2026-01-01T00:00:00Z',
        last_updated_at: '2026-01-01T00:00:00Z',
        indicators: [],
      }],
    };

    it('should return true for enabled association section', () => {
      // First select an action model with sections
      facade.select('am-1');
      const req = httpTesting.expectOne((r) => r.url.includes('action-models/am-1'));
      req.flush(mockWithSections);

      expect(facade.isAssociationSectionEnabled('buildings')).toBe(true);
      expect(facade.isAssociationSectionEnabled('agents')).toBe(false);
    });

    it('should toggle OFF (delete) an existing section', async () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush(mockWithSections);

      const togglePromise = facade.toggleAssociationSection('buildings');

      const deleteReq = httpTesting.expectOne((r) =>
        r.method === 'DELETE' && r.url.includes('action-models/am-1/sections/sec-1'),
      );
      deleteReq.flush(null);

      await togglePromise;

      expect(successSpy).toHaveBeenCalledWith('Section supprimée');

      // Re-select detail
      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush({ ...mockActionModel, sections: [] });
    });

    it('should toggle ON (create) a missing section', async () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush(mockWithSections);

      const togglePromise = facade.toggleAssociationSection('agents');

      const createReq = httpTesting.expectOne((r) =>
        r.method === 'POST' && r.url.includes('action-models/am-1/sections'),
      );
      expect(createReq.request.body.key).toBe('agents');
      expect(createReq.request.body.name).toBe('Agents');
      createReq.flush({ id: 'sec-new', key: 'agents' });

      await togglePromise;

      expect(successSpy).toHaveBeenCalledWith('Section créée');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush(mockWithSections);
    });

    it('should show error toast on toggle failure', async () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush(mockWithSections);

      const togglePromise = facade.toggleAssociationSection('buildings');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE');
      deleteReq.flush({ detail: 'Cannot delete' }, { status: 500, statusText: 'Internal Server Error' });

      await togglePromise;

      expect(errorSpy).toHaveBeenCalled();

      // Re-select to revert (server-confirmed approach)
      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1'));
      detailReq.flush(mockWithSections);
    });
  });

  describe('updateSectionParams', () => {
    const mockWithSection = {
      ...mockActionModel,
      sections: [{
        id: 'sec-app',
        name: 'Candidature',
        key: 'application' as const,

        is_enabled: true,
        position: 0,
        hidden_rule: 'false',
        disabled_rule: 'false',
        required_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
        created_at: '2026-01-01T00:00:00Z',
        last_updated_at: '2026-01-01T00:00:00Z',
        indicators: [],
      }],
    };

    it('should update existing section via PUT', async () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush(mockWithSection);

      const promise = facade.updateSectionParams('sec-app', 'application', { hidden_rule: 'true' });

      const putReq = httpTesting.expectOne((r) =>
        r.method === 'PUT' && r.url.includes('action-models/am-1/sections/sec-app'),
      );
      expect(putReq.request.body.hidden_rule).toBe('true');
      putReq.flush({ ...mockWithSection.sections[0], hidden_rule: 'true' });

      await promise;

      expect(successSpy).toHaveBeenCalledWith('Paramètres de section enregistrés');

      httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-models/am-1')).flush(mockWithSection);
    });

    // Auto-create flow (id === null → ensureSectionExists → update) is tested
    // via the separate ensureSectionExists tests + this updateSection test.
    // The combined async flow is complex to test with HttpTestingController
    // due to overlapping rxMethod subscriptions.
  });

  describe('section indicator management', () => {
    const mockWithSectionAndIndicator = {
      ...mockActionModel,
      sections: [{
        id: 'sec-app',
        name: 'Candidature',
        key: 'application' as const,

        is_enabled: true,
        position: 0,
        hidden_rule: 'false',
        disabled_rule: 'false',
        required_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
        created_at: '2026-01-01T00:00:00Z',
        last_updated_at: '2026-01-01T00:00:00Z',
        indicators: [{
          id: 'ind-1',
          name: 'Existing Indicator',
          technical_label: 'existing',
          type: 'number',
          created_at: '2026-01-01T00:00:00Z',
          last_updated_at: '2026-01-01T00:00:00Z',
          hidden_rule: 'false',
          required_rule: 'false',
          disabled_rule: 'false',
          default_value_rule: 'false',
          occurrence_rule: { min: 'false', max: 'false' },
          constrained_rule: 'false',
          position: 0,
        }],
      }],
    };

    it('should add indicator to section via PUT replace-all', async () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush(mockWithSectionAndIndicator);

      const promise = facade.addIndicatorToSection('sec-app', 'application', 'ind-new');

      const putReq = httpTesting.expectOne((r) =>
        r.method === 'PUT' && r.url.includes('action-models/am-1/sections/sec-app/indicators'),
      );
      expect(putReq.request.body).toHaveLength(2);
      expect(putReq.request.body[0].indicator_model_id).toBe('ind-1');
      expect(putReq.request.body[1].indicator_model_id).toBe('ind-new');
      putReq.flush(mockWithSectionAndIndicator.sections[0]);

      await promise;

      expect(successSpy).toHaveBeenCalledWith('Indicateur ajouté à la section');

      httpTesting.match((r) => r.method === 'GET' && r.url.includes('action-models/am-1'))
        .forEach((r) => r.flush(mockWithSectionAndIndicator));
    });

    it('should remove indicator from section', async () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush(mockWithSectionAndIndicator);

      const promise = facade.removeIndicatorFromSection('sec-app', 'ind-1');

      const putReq = httpTesting.expectOne((r) =>
        r.method === 'PUT' && r.url.includes('action-models/am-1/sections/sec-app/indicators'),
      );
      expect(putReq.request.body).toHaveLength(0);
      putReq.flush({ ...mockWithSectionAndIndicator.sections[0], indicators: [] });

      await promise;

      expect(successSpy).toHaveBeenCalledWith('Indicateur retiré de la section');

      httpTesting.match((r) => r.method === 'GET' && r.url.includes('action-models/am-1'))
        .forEach((r) => r.flush(mockWithSectionAndIndicator));
    });
  });

  describe('merged fixed sections', () => {
    const mockWithFixedSections = {
      ...mockActionModel,
      sections: [{
        id: 'sec-app',
        name: 'Candidature',
        key: 'application' as const,

        is_enabled: true,
        position: 0,
        hidden_rule: 'false',
        disabled_rule: 'false',
        required_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
        created_at: '2026-01-01T00:00:00Z',
        last_updated_at: '2026-01-01T00:00:00Z',
        indicators: [],
      }],
    };

    it('should return both fixed sections with existing one from API', () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush(mockWithFixedSections);

      const merged = facade.mergedFixedSections();
      expect(merged).toHaveLength(3);
      expect(merged[0].key).toBe('financial');
      expect(merged[0].id).toBeNull();
      expect(merged[1].key).toBe('application');
      expect(merged[1].id).toBe('sec-app');
      expect(merged[2].key).toBe('progress');
      expect(merged[2].id).toBeNull();
    });

    it('should create stubs for all missing fixed sections', () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush({ ...mockActionModel, sections: [] });

      const merged = facade.mergedFixedSections();
      expect(merged).toHaveLength(3);
      expect(merged[0].id).toBeNull();
      expect(merged[0].name).toBe('Financier');
      expect(merged[1].id).toBeNull();
      expect(merged[1].name).toBe('Candidature');
      expect(merged[2].id).toBeNull();
      expect(merged[2].name).toBe('Suivi');
    });
  });

  describe('ensureSectionExists', () => {
    const mockWithSection = {
      ...mockActionModel,
      sections: [{
        id: 'sec-app',
        name: 'Candidature',
        key: 'application' as const,

        is_enabled: true,
        position: 0,
        hidden_rule: 'false',
        disabled_rule: 'false',
        required_rule: 'false',
        occurrence_rule: { min: 'false', max: 'false' },
        constrained_rule: 'false',
        created_at: '2026-01-01T00:00:00Z',
        last_updated_at: '2026-01-01T00:00:00Z',
        indicators: [],
      }],
    };

    it('should return existing section ID without API call', async () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush(mockWithSection);

      const id = await facade.ensureSectionExists('application');
      expect(id).toBe('sec-app');
    });

    it('should create section and return new ID when not found', async () => {
      facade.select('am-1');
      httpTesting.expectOne((r) => r.url.includes('action-models/am-1')).flush({ ...mockActionModel, sections: [] });

      const promise = facade.ensureSectionExists('progress');

      const createReq = httpTesting.expectOne((r) =>
        r.method === 'POST' && r.url.includes('action-models/am-1/sections'),
      );
      expect(createReq.request.body.key).toBe('progress');
      createReq.flush({ id: 'sec-new-progress' });

      const id = await promise;
      expect(id).toBe('sec-new-progress');
    });
  });

  describe('cross-domain: loadAssociationData', () => {
    const mockFpResponse: PaginatedResponse<FundingProgram> = {
      data: [{
        id: 'fp-1', name: 'Test FP', description: null, budget: null,
        is_active: true, start_date: null, end_date: null,
        created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z',
      }],
      pagination: {
        total_count: 1, page_size: 20, has_next_page: false, has_previous_page: false,
        cursors: { start_cursor: null, end_cursor: null },
        _links: { self: '/', next: null, prev: null, first: '/' },
      },
    };

    it('should trigger FP and AT domain store loads', () => {
      facade.loadAssociationData();

      const fpReq = httpTesting.expectOne((r) => r.url.includes('funding-programs') && r.method === 'GET');
      const atReq = httpTesting.expectOne((r) => r.url.includes('action-themes') && r.method === 'GET');

      fpReq.flush(mockFpResponse);
      atReq.flush({ ...mockFpResponse, data: [] });

      expect(facade.fpOptions().length).toBe(1);
      expect(facade.fpOptions()[0].name).toBe('Test FP');
    });

    it('should expose fpOptions and atOptions signals', () => {
      expect(facade.fpOptions()).toEqual([]);
      expect(facade.atOptions()).toEqual([]);
    });
  });
});
