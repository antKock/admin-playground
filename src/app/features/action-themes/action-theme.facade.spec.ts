import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { ActionThemeFacade } from './action-theme.facade';
import { ActionTheme } from '@domains/action-themes/action-theme.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@app/shared/services/toast.service';

const mockActionTheme: ActionTheme = {
  id: 'at-1',
  unique_id: 'at-unique-1',
  name: 'Test Theme',
  technical_label: 'test_theme',
  description: 'A test theme',
  icon: null,
  color: null,
  status: 'draft',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<ActionTheme> = {
  data: [mockActionTheme],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/action-themes/', next: null, prev: null, first: '/action-themes/' },
  },
};

describe('ActionThemeFacade', () => {
  let facade: ActionThemeFacade;
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
    facade = TestBed.inject(ActionThemeFacade);
    httpTesting = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    successSpy = vi.spyOn(toastService, 'success');
    errorSpy = vi.spyOn(toastService, 'error');
    // Prevent unhandled router navigation rejections in tests
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('load', () => {
    it('should trigger domain store load and populate items', () => {
      facade.load();

      const req = httpTesting.expectOne((r) => r.url.includes('action-themes') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Theme');
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
        data: [{ ...mockActionTheme, id: 'at-2', name: 'Theme 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('at-1');

      const req = httpTesting.expectOne((r) => r.url.includes('action-themes/at-1'));
      req.flush(mockActionTheme);

      expect(facade.selectedItem()).toEqual(mockActionTheme);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({ name: 'New Theme', technical_label: 'new_theme', status: 'draft' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('action-themes'));
      createReq.flush({ ...mockActionTheme, id: 'at-new', name: 'New Theme' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Action Theme created');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('at-1', { name: 'Updated Theme' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-themes/at-1'));
      updateReq.flush({ ...mockActionTheme, name: 'Updated Theme' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Action Theme updated');

      // After success, it triggers a list refresh
      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-themes'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('at-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('action-themes/at-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Action Theme deleted');
    });
  });

  describe('publish', () => {
    it('should trigger publish mutation, show toast, and reload detail on success', async () => {
      const publishPromise = facade.publish('at-1');

      const publishReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-themes/at-1/publish'));
      publishReq.flush({ ...mockActionTheme, status: 'published' });

      await publishPromise;

      expect(successSpy).toHaveBeenCalledWith('Action Theme published');

      // After success, it reloads the detail
      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-themes/at-1'));
      detailReq.flush({ ...mockActionTheme, status: 'published' });
    });
  });

  describe('disable', () => {
    it('should trigger disable mutation, show toast, and reload detail on success', async () => {
      const disablePromise = facade.disable('at-1');

      const disableReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-themes/at-1/disable'));
      disableReq.flush({ ...mockActionTheme, status: 'disabled' });

      await disablePromise;

      expect(successSpy).toHaveBeenCalledWith('Action Theme disabled');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-themes/at-1'));
      detailReq.flush({ ...mockActionTheme, status: 'disabled' });
    });
  });

  describe('activate', () => {
    it('should trigger activate mutation, show toast, and reload detail on success', async () => {
      const activatePromise = facade.activate('at-1');

      const activateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('action-themes/at-1/activate'));
      activateReq.flush({ ...mockActionTheme, status: 'published' });

      await activatePromise;

      expect(successSpy).toHaveBeenCalledWith('Action Theme activated');

      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('action-themes/at-1'));
      detailReq.flush({ ...mockActionTheme, status: 'published' });
    });
  });

  describe('duplicate', () => {
    it('should trigger duplicate mutation, show toast, and navigate to new item', async () => {
      const duplicatePromise = facade.duplicate('at-1');

      const dupReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('action-themes/at-1/duplicate'));
      dupReq.flush({ ...mockActionTheme, id: 'at-dup', name: 'Test Theme (copy)' });

      await duplicatePromise;

      expect(successSpy).toHaveBeenCalledWith('Action Theme duplicated');
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({ name: 'Bad', technical_label: 'bad', status: 'draft' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });
});
