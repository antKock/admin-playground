import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BaseEntityService } from './base-entity.service';
import { PaginatedResponse } from './paginated-response.model';

interface TestEntity {
  id: string;
  name: string;
}

@Injectable()
class TestEntityService extends BaseEntityService<TestEntity> {
  constructor() {
    super('test-entities');
  }

  protected getId(item: TestEntity): string {
    return item.id;
  }
}

const mockPaginatedResponse: PaginatedResponse<TestEntity> = {
  data: [
    { id: '1', name: 'Entity 1' },
    { id: '2', name: 'Entity 2' },
  ],
  pagination: {
    total_count: 2,
    page_size: 50,
    has_next_page: false,
    has_previous_page: false,
    cursors: { start_cursor: 'abc', end_cursor: 'def' },
    _links: {
      self: '/test-entities',
      next: null,
      prev: null,
      first: '/test-entities',
    },
  },
};

describe('BaseEntityService', () => {
  let service: TestEntityService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TestEntityService],
    });
    service = TestBed.inject(TestEntityService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should have initial signal values', () => {
    expect(service.items()).toEqual([]);
    expect(service.selectedItem()).toBeNull();
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.lastResponse()).toBeNull();
  });

  describe('list', () => {
    it('should fetch paginated list and update items signal', () => {
      service.list().subscribe((response) => {
        expect(response.data.length).toBe(2);
      });

      expect(service.isLoading()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.includes('test-entities') && r.method === 'GET');
      req.flush(mockPaginatedResponse);

      expect(service.isLoading()).toBe(false);
      expect(service.items().length).toBe(2);
      expect(service.items()[0].name).toBe('Entity 1');
      expect(service.lastResponse()).toBeTruthy();
    });

    it('should append items when cursor is provided', () => {
      // First load
      service.list().subscribe();
      httpTesting
        .expectOne((r) => r.url.includes('test-entities') && !r.params.has('cursor'))
        .flush(mockPaginatedResponse);

      // Load more with cursor
      service.list('cursor123').subscribe();
      const req = httpTesting.expectOne((r) => r.params.get('cursor') === 'cursor123');
      req.flush({
        ...mockPaginatedResponse,
        data: [{ id: '3', name: 'Entity 3' }],
      });

      expect(service.items().length).toBe(3);
    });

    it('should pass limit as query param', () => {
      service.list(undefined, 10).subscribe();
      const req = httpTesting.expectOne((r) => r.params.get('limit') === '10');
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });
  });

  describe('getById', () => {
    it('should fetch single entity and update selectedItem', () => {
      const entity: TestEntity = { id: '1', name: 'Entity 1' };

      service.getById('1').subscribe((response) => {
        expect(response).toEqual(entity);
      });

      expect(service.isLoading()).toBe(true);

      const req = httpTesting.expectOne((r) => r.url.endsWith('/1') && r.method === 'GET');
      req.flush(entity);

      expect(service.isLoading()).toBe(false);
      expect(service.selectedItem()).toEqual(entity);
    });
  });

  describe('create', () => {
    it('should post entity and add to items', () => {
      const newEntity: TestEntity = { id: '3', name: 'New Entity' };

      service.create({ name: 'New Entity' }).subscribe((response) => {
        expect(response).toEqual(newEntity);
      });

      const req = httpTesting.expectOne((r) => r.method === 'POST');
      expect(req.request.body).toEqual({ name: 'New Entity' });
      req.flush(newEntity);

      expect(service.items()).toContain(newEntity);
    });
  });

  describe('update', () => {
    it('should put entity and update in items list', () => {
      // Seed items first
      service.list().subscribe();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      const updated: TestEntity = { id: '1', name: 'Updated' };
      service.update('1', { name: 'Updated' }).subscribe();

      const req = httpTesting.expectOne((r) => r.url.endsWith('/1') && r.method === 'PUT');
      req.flush(updated);

      expect(service.items().find((e) => e.id === '1')?.name).toBe('Updated');
      expect(service.selectedItem()).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete entity and remove from items list', () => {
      // Seed items first
      service.list().subscribe();
      httpTesting.expectOne((r) => r.method === 'GET').flush(mockPaginatedResponse);

      service.delete('1').subscribe();

      const req = httpTesting.expectOne((r) => r.url.endsWith('/1') && r.method === 'DELETE');
      req.flush(null);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].id).toBe('2');
      expect(service.selectedItem()).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('should clear selection', () => {
      service.getById('1').subscribe();
      httpTesting.expectOne((r) => r.url.endsWith('/1')).flush({ id: '1', name: 'Entity 1' });
      expect(service.selectedItem()).toBeTruthy();

      service.clearSelection();
      expect(service.selectedItem()).toBeNull();
    });
  });
});
