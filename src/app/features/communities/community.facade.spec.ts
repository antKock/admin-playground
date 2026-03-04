import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { CommunityFacade } from './community.facade';
import { CommunityRead } from '@domains/communities/community.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@app/shared/services/toast.service';

const mockCommunity: CommunityRead = {
  id: 'comm-1',
  siret: '12345678901234',
  name: 'Test Community',
  public_comment: 'A test community',
  internal_comment: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<CommunityRead> = {
  data: [mockCommunity],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/communities/', next: null, prev: null, first: '/communities/' },
  },
};

describe('CommunityFacade', () => {
  let facade: CommunityFacade;
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
    facade = TestBed.inject(CommunityFacade);
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

      const req = httpTesting.expectOne((r) => r.url.includes('communities') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].name).toBe('Test Community');
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
        data: [{ ...mockCommunity, id: 'comm-2', name: 'Community 2' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('comm-1');

      const req = httpTesting.expectOne((r) => r.url.includes('communities/comm-1'));
      req.flush(mockCommunity);

      expect(facade.selectedItem()).toEqual(mockCommunity);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({ siret: '12345678901234', name: 'New Community' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('communities'));
      createReq.flush({ ...mockCommunity, id: 'comm-new', name: 'New Community' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Community created');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh list on success', async () => {
      const updatePromise = facade.update('comm-1', { name: 'Updated Community' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('communities/comm-1'));
      updateReq.flush({ ...mockCommunity, name: 'Updated Community' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Community updated');

      // After success, it triggers a list refresh
      const refreshReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('communities'));
      refreshReq.flush(mockPaginatedResponse);
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('comm-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('communities/comm-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Community deleted');
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({ siret: '12345678901234', name: 'Bad' });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(facade.items().length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });

    it('should show conflict error on 409', async () => {
      const deletePromise = facade.delete('comm-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE');
      deleteReq.flush({ detail: 'Has linked agents' }, { status: 409, statusText: 'Conflict' });

      await deletePromise;

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('assignUser', () => {
    it('should trigger mutation, show toast, and reload users on success', async () => {
      const assignPromise = facade.assignUser('comm-1', 'user-1');

      const assignReq = httpTesting.expectOne((r) =>
        r.method === 'POST' && r.url.includes('communities/comm-1/users/user-1'),
      );
      assignReq.flush({ message: 'User assigned' });

      await assignPromise;

      expect(successSpy).toHaveBeenCalledWith('User assigned to Community');

      // After success, it reloads users
      const usersReq = httpTesting.expectOne((r) => r.url.includes('auth/users') && r.method === 'GET');
      usersReq.flush([]);
    });

    it('should show error toast on assign failure', async () => {
      const assignPromise = facade.assignUser('comm-1', 'user-bad');

      const assignReq = httpTesting.expectOne((r) => r.method === 'POST');
      assignReq.flush({ detail: 'User not found' }, { status: 404, statusText: 'Not Found' });

      await assignPromise;

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('removeUser', () => {
    it('should trigger mutation, show toast, and reload users on success', async () => {
      const removePromise = facade.removeUser('comm-1', 'user-1');

      const removeReq = httpTesting.expectOne((r) =>
        r.method === 'DELETE' && r.url.includes('communities/comm-1/users/user-1'),
      );
      removeReq.flush(null);

      await removePromise;

      expect(successSpy).toHaveBeenCalledWith('User removed from Community');

      // After success, it reloads users
      const usersReq = httpTesting.expectOne((r) => r.url.includes('auth/users') && r.method === 'GET');
      usersReq.flush([]);
    });
  });
});
