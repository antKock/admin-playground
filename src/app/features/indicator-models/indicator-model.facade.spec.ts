import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { IndicatorModelFacade } from './indicator-model.facade';
import { IndicatorModel } from '@domains/indicator-models/indicator-model.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@shared/components/toast/toast.service';

const mockIndicatorModel: IndicatorModel = {
  id: 'im-1',
  name: 'Test Indicator',
  technical_label: 'test_indicator',
  description: 'A test indicator model',
  type: 'number',
  unit: 'kg',
  status: 'draft',
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<IndicatorModel> = {
  data: [mockIndicatorModel],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/indicator-models/', next: null, prev: null, first: '/indicator-models/' },
  },
};

describe('IndicatorModelFacade', () => {
  let facade: IndicatorModelFacade;
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
    facade = TestBed.inject(IndicatorModelFacade);
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

      const req = httpTesting.expectOne((r) => r.url.includes('indicator-models') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Indicator');
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
        data: [{ ...mockIndicatorModel, id: 'im-2', name: 'Model 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById, loadUsage, and populate selectedItem', () => {
      facade.select('im-1');

      const detailReq = httpTesting.expectOne((r) => r.url.includes('indicator-models/im-1'));
      detailReq.flush(mockIndicatorModel);

      const usageReq = httpTesting.expectOne((r) => r.url.includes('action-models') && r.method === 'GET');
      usageReq.flush({ data: [], pagination: { ...mockPaginatedResponse.pagination, has_next_page: false } });

      expect(facade.selectedItem()).toEqual(mockIndicatorModel);
      expect(facade.usageCount()).toBe(0);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({
        name: 'New Indicator',
        technical_label: 'new_indicator',
        type: 'text',
        status: 'draft',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('indicator-models'));
      createReq.flush({ ...mockIndicatorModel, id: 'im-new', name: 'New Indicator' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'indicateur créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('im-1', { name: 'Updated Indicator' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('indicator-models/im-1'));
      updateReq.flush({ ...mockIndicatorModel, name: 'Updated Indicator' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'indicateur mis à jour');

      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('indicator-models'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('im-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('indicator-models/im-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'indicateur supprimé');
    });
  });

  describe('publish', () => {
    it('should trigger publish mutation, show toast, and reload detail on success', async () => {
      const publishPromise = facade.publish('im-1');

      const publishReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('indicator-models/im-1/publish'));
      publishReq.flush({ ...mockIndicatorModel, status: 'published' });

      await publishPromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'indicateur publié');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('indicator-models/im-1'));
      detailReq.flush({ ...mockIndicatorModel, status: 'published' });
    });
  });

  describe('disable', () => {
    it('should trigger disable mutation, show toast, and reload detail on success', async () => {
      const disablePromise = facade.disable('im-1');

      const disableReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('indicator-models/im-1/disable'));
      disableReq.flush({ ...mockIndicatorModel, status: 'disabled' });

      await disablePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'indicateur désactivé');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('indicator-models/im-1'));
      detailReq.flush({ ...mockIndicatorModel, status: 'disabled' });
    });
  });

  describe('activate', () => {
    it('should trigger activate mutation, show toast, and reload detail on success', async () => {
      const activatePromise = facade.activate('im-1');

      const activateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('indicator-models/im-1/activate'));
      activateReq.flush({ ...mockIndicatorModel, status: 'published' });

      await activatePromise;

      expect(successSpy).toHaveBeenCalledWith('Modèle d\'indicateur activé');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('indicator-models/im-1'));
      detailReq.flush({ ...mockIndicatorModel, status: 'published' });
    });
  });

  describe('availableChildIndicators', () => {
    it('should filter by type, editId, excluded children, and search term', () => {
      facade.load();
      const groupItem = { ...mockIndicatorModel, id: 'im-group', type: 'group', name: 'Group' };
      const textItem = { ...mockIndicatorModel, id: 'im-text', type: 'text', name: 'Text' };
      const numItem = { ...mockIndicatorModel, id: 'im-num', type: 'number', name: 'Number' };
      httpTesting.expectOne((r) => r.method === 'GET').flush({
        ...mockPaginatedResponse,
        data: [groupItem, textItem, numItem],
      });

      // Group types should be excluded
      expect(facade.availableChildIndicators().map(i => i.id)).toEqual(['im-text', 'im-num']);

      // Exclude by editId
      facade.setEditItemId('im-text');
      expect(facade.availableChildIndicators().map(i => i.id)).toEqual(['im-num']);

      // Exclude children
      facade.setEditItemId(null);
      facade.setExcludeChildrenIds(['im-text']);
      expect(facade.availableChildIndicators().map(i => i.id)).toEqual(['im-num']);

      // Search term
      facade.setExcludeChildrenIds([]);
      facade.setChildSearchTerm('Num');
      expect(facade.availableChildIndicators().map(i => i.id)).toEqual(['im-num']);
    });
  });

  describe('prepareIndicatorData', () => {
    it('should include children_ids for group type', () => {
      const result = facade.prepareIndicatorData(
        { name: 'Test', technical_label: 'test', description: null, type: 'group', unit: null },
        ['child-1', 'child-2'],
      );
      expect(result.children_ids).toEqual(['child-1', 'child-2']);
      expect(result.unit).toBeNull();
    });

    it('should set children_ids to null for non-group type', () => {
      const result = facade.prepareIndicatorData(
        { name: 'Test', technical_label: 'test', description: null, type: 'number', unit: 'kg' },
        ['child-1'],
      );
      expect(result.children_ids).toBeNull();
      expect(result.unit).toBe('kg');
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({
        name: 'Bad',
        technical_label: 'bad',
        type: 'text',
        status: 'draft',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });

    it('should show error toast on publish error', async () => {
      const publishPromise = facade.publish('im-1');

      const req = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('indicator-models/im-1/publish'));
      req.flush({ detail: 'Cannot publish' }, { status: 422, statusText: 'Unprocessable Entity' });

      await publishPromise;

      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });
});
