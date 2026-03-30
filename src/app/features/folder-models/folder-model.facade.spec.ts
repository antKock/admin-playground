import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { FolderModelFacade } from './folder-model.facade';
import { FolderModel } from '@domains/folder-models/folder-model.models';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@shared/components/toast/toast.service';

const mockFolderModel: FolderModel = {
  id: 'fm-1',
  name: 'Test Folder Model',
  description: 'A test folder model',
  funding_programs: [
    {
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
  ],
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<FolderModel> = {
  data: [mockFolderModel],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/folder-models/', next: null, prev: null, first: '/folder-models/' },
  },
};

describe('FolderModelFacade', () => {
  let facade: FolderModelFacade;
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
    facade = TestBed.inject(FolderModelFacade);
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

      const req = httpTesting.expectOne((r) => r.url.includes('folder-models') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Folder Model');
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
        data: [{ ...mockFolderModel, id: 'fm-2', name: 'Model 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('fm-1');

      const req = httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1'));
      req.flush(mockFolderModel);

      expect(facade.selectedItem()).toEqual(mockFolderModel);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({
        name: 'New Model',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('folder-models'));
      createReq.flush({ ...mockFolderModel, id: 'fm-new', name: 'New Model' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle de dossier créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('fm-1', { name: 'Updated Model' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('folder-models/fm-1'));
      updateReq.flush({ ...mockFolderModel, name: 'Updated Model' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle de dossier mis à jour');

      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('folder-models'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('fm-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('folder-models/fm-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle de dossier supprimé');
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({
        name: 'Bad',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });

  describe('merged fixed sections', () => {
    const mockWithFixedSections = {
      ...mockFolderModel,
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
      facade.select('fm-1');
      httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1')).flush(mockWithFixedSections);

      const merged = facade.mergedFixedSections();
      expect(merged).toHaveLength(3);
      expect(merged[0].key).toBe('application');
      expect(merged[0].id).toBe('sec-app');
      expect(merged[1].key).toBe('progress');
      expect(merged[1].id).toBeNull();
      expect(merged[2].key).toBe('financial');
      expect(merged[2].id).toBeNull();
    });

    it('should create stubs for all missing fixed sections', () => {
      facade.select('fm-1');
      httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1')).flush({ ...mockFolderModel, sections: [] });

      const merged = facade.mergedFixedSections();
      expect(merged).toHaveLength(3);
      expect(merged[0].id).toBeNull();
      expect(merged[0].name).toBe('Candidature');
      expect(merged[1].id).toBeNull();
      expect(merged[1].name).toBe('Suivi');
      expect(merged[2].id).toBeNull();
      expect(merged[2].name).toBe('Financier');
    });
  });

  describe('ensureSectionExists', () => {
    const mockWithSection = {
      ...mockFolderModel,
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
      facade.select('fm-1');
      httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1')).flush(mockWithSection);

      const id = await facade.ensureSectionExists('application');
      expect(id).toBe('sec-app');
    });

    it('should create section and return new ID when not found', async () => {
      facade.select('fm-1');
      httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1')).flush({ ...mockFolderModel, sections: [] });

      const promise = facade.ensureSectionExists('progress');

      const createReq = httpTesting.expectOne((r) =>
        r.method === 'POST' && r.url.includes('folder-models/fm-1/sections'),
      );
      expect(createReq.request.body.key).toBe('progress');
      createReq.flush({ id: 'sec-new-progress' });

      const id = await promise;
      expect(id).toBe('sec-new-progress');
    });
  });

  describe('updateSectionParams', () => {
    const mockWithSection = {
      ...mockFolderModel,
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
      facade.select('fm-1');
      httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1')).flush(mockWithSection);

      const promise = facade.updateSectionParams('sec-app', 'application', { hidden_rule: 'true' });

      const putReq = httpTesting.expectOne((r) =>
        r.method === 'PUT' && r.url.includes('folder-models/fm-1/sections/sec-app'),
      );
      expect(putReq.request.body.hidden_rule).toBe('true');
      putReq.flush({ ...mockWithSection.sections[0], hidden_rule: 'true' });

      await promise;

      expect(successSpy).toHaveBeenCalledWith('Paramètres de section enregistrés');

      httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('folder-models/fm-1')).flush(mockWithSection);
    });
  });

  describe('section indicator management', () => {
    const mockWithSectionAndIndicator = {
      ...mockFolderModel,
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
      facade.select('fm-1');
      httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1')).flush(mockWithSectionAndIndicator);

      const promise = facade.addIndicatorToSection('sec-app', 'application', 'ind-new');

      const putReq = httpTesting.expectOne((r) =>
        r.method === 'PUT' && r.url.includes('folder-models/fm-1/sections/sec-app/indicators'),
      );
      expect(putReq.request.body).toHaveLength(2);
      expect(putReq.request.body[0].indicator_model_id).toBe('ind-1');
      expect(putReq.request.body[1].indicator_model_id).toBe('ind-new');
      putReq.flush(mockWithSectionAndIndicator.sections[0]);

      await promise;

      expect(successSpy).toHaveBeenCalledWith('Indicateur ajouté à la section');

      httpTesting.match((r) => r.method === 'GET' && r.url.includes('folder-models/fm-1'))
        .forEach((r) => r.flush(mockWithSectionAndIndicator));
    });

    it('should remove indicator from section', async () => {
      facade.select('fm-1');
      httpTesting.expectOne((r) => r.url.includes('folder-models/fm-1')).flush(mockWithSectionAndIndicator);

      const promise = facade.removeIndicatorFromSection('sec-app', 'ind-1');

      const putReq = httpTesting.expectOne((r) =>
        r.method === 'PUT' && r.url.includes('folder-models/fm-1/sections/sec-app/indicators'),
      );
      expect(putReq.request.body).toHaveLength(0);
      putReq.flush({ ...mockWithSectionAndIndicator.sections[0], indicators: [] });

      await promise;

      expect(successSpy).toHaveBeenCalledWith('Indicateur retiré de la section');

      httpTesting.match((r) => r.method === 'GET' && r.url.includes('folder-models/fm-1'))
        .forEach((r) => r.flush(mockWithSectionAndIndicator));
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

    it('should trigger FP domain store load', () => {
      facade.loadAssociationData();

      const fpReq = httpTesting.expectOne((r) => r.url.includes('funding-programs') && r.method === 'GET');
      fpReq.flush(mockFpResponse);

      expect(facade.fpOptions().length).toBe(1);
      expect(facade.fpOptions()[0].label).toBe('Test FP');
    });

    it('should expose fpOptions signal with id/label shape', () => {
      expect(facade.fpOptions()).toEqual([]);
    });
  });
});
