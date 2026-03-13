import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { UserFacade } from './user.facade';
import { UserRead } from '@domains/users/user.models';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ToastService } from '@app/shared/services/toast.service';

const mockUser: UserRead = {
  id: 'user-1',
  email: 'alice@example.com',
  first_name: 'Alice',
  last_name: 'Dupont',
  is_active: true,
  role: 'admin',
  communities: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedResponse: PaginatedResponse<UserRead> = {
  data: [mockUser],
  pagination: {
    total_count: 1,
    page_size: 20,
    has_next_page: true,
    has_previous_page: false,
    cursors: { start_cursor: 'start', end_cursor: 'cursor-1' },
    _links: { self: '/users/', next: null, prev: null, first: '/users/' },
  },
};

describe('UserFacade', () => {
  let facade: UserFacade;
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
    facade = TestBed.inject(UserFacade);
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

      const req = httpTesting.expectOne((r) => r.url.includes('users') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(facade.items().length).toBe(1);
      expect(facade.items()[0].first_name).toBe('Alice');
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
        data: [{ ...mockUser, id: 'user-2', first_name: 'Bob' }],
        pagination: { ...mockPaginatedResponse.pagination, has_next_page: false },
      };
      httpTesting.expectOne((r) => r.method === 'GET' && r.params.has('cursor')).flush(moreResponse);

      expect(facade.items().length).toBe(2);
    });
  });

  describe('select', () => {
    it('should trigger selectById and populate selectedItem', () => {
      facade.select('user-1');

      const req = httpTesting.expectOne((r) => r.url.includes('users/user-1'));
      req.flush(mockUser);

      expect(facade.selectedItem()).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const createPromise = facade.create({
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        is_active: true,
        password: 'password123',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST' && r.url.includes('auth/register'));
      createReq.flush({ ...mockUser, id: 'user-new' });

      await createPromise;

      expect(successSpy).toHaveBeenCalledWith('Utilisateur créé');
    });
  });

  describe('update', () => {
    it('should trigger mutation, show toast, and refresh detail on success', async () => {
      const updatePromise = facade.update('user-1', { first_name: 'Updated' });

      const updateReq = httpTesting.expectOne((r) => r.method === 'PUT' && r.url.includes('users/user-1'));
      updateReq.flush({ ...mockUser, first_name: 'Updated' });

      await updatePromise;

      expect(successSpy).toHaveBeenCalledWith('Utilisateur mis à jour');

      // After success, it reloads the detail via selectById
      const detailReq = httpTesting.expectOne((r) => r.method === 'GET' && r.url.includes('users/user-1'));
      detailReq.flush({ ...mockUser, first_name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('should trigger mutation, show toast, and navigate on success', async () => {
      const deletePromise = facade.delete('user-1');

      const deleteReq = httpTesting.expectOne((r) => r.method === 'DELETE' && r.url.includes('users/user-1'));
      deleteReq.flush(null);

      await deletePromise;

      expect(successSpy).toHaveBeenCalledWith('Utilisateur supprimé');
    });
  });

  describe('error handling', () => {
    it('should show error toast on mutation error', async () => {
      const createPromise = facade.create({
        email: 'fail@example.com',
        first_name: 'Fail',
        last_name: 'User',
        is_active: true,
        password: 'password123',
      });

      const createReq = httpTesting.expectOne((r) => r.method === 'POST');
      createReq.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      await createPromise;

      expect(errorSpy).toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });
});
