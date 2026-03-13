import { TestBed } from '@angular/core/testing';

import { OpenApiWatcherService } from './openapi-watcher.service';

describe('OpenApiWatcherService', () => {
  let service: OpenApiWatcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenApiWatcherService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('diffSpecs', () => {
    it('should detect added paths with after value', () => {
      const oldSpec = { paths: { '/a': { get: {} } } };
      const newSpec = { paths: { '/a': { get: {} }, '/b': { post: {} } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'added', category: 'path', name: '/b', after: { post: {} } });
    });

    it('should detect removed paths with before value', () => {
      const oldSpec = { paths: { '/a': { get: {} }, '/b': { post: {} } } };
      const newSpec = { paths: { '/a': { get: {} } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'removed', category: 'path', name: '/b', before: { post: {} } });
    });

    it('should detect modified paths with before and after values', () => {
      const oldSpec = { paths: { '/a': { get: { summary: 'old' } } } };
      const newSpec = { paths: { '/a': { get: { summary: 'new' } } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({
        type: 'modified', category: 'path', name: '/a',
        before: { get: { summary: 'old' } },
        after: { get: { summary: 'new' } },
      });
    });

    it('should detect added schemas with after value', () => {
      const oldSpec = { components: { schemas: { Foo: { type: 'string' } } } };
      const newSpec = { components: { schemas: { Foo: { type: 'string' }, Bar: { type: 'number' } } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'added', category: 'schema', name: 'Bar', after: { type: 'number' } });
    });

    it('should detect removed schemas with before value', () => {
      const oldSpec = { components: { schemas: { Foo: { type: 'string' }, Bar: { type: 'number' } } } };
      const newSpec = { components: { schemas: { Foo: { type: 'string' } } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'removed', category: 'schema', name: 'Bar', before: { type: 'number' } });
    });

    it('should detect modified schemas with before and after values', () => {
      const oldSpec = { components: { schemas: { Foo: { type: 'string' } } } };
      const newSpec = { components: { schemas: { Foo: { type: 'number' } } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({
        type: 'modified', category: 'schema', name: 'Foo',
        before: { type: 'string' },
        after: { type: 'number' },
      });
    });

    it('should return empty array when specs are identical', () => {
      const spec = { paths: { '/a': {} }, components: { schemas: { Foo: {} } } };
      const changes = service.diffSpecs(spec, spec);
      expect(changes).toEqual([]);
    });

    it('should handle missing paths or components gracefully', () => {
      const oldSpec = {};
      const newSpec = { paths: { '/a': { get: {} } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'added', category: 'path', name: '/a', after: { get: {} } });
    });

    it('should detect required-to-optional field change in schema', () => {
      const oldSchema = {
        properties: { name: { type: 'string' }, email: { type: 'string' } },
        required: ['name', 'email'],
        type: 'object',
      };
      const newSchema = {
        properties: { name: { type: 'string' }, email: { type: 'string' } },
        required: ['name'],
        type: 'object',
      };
      const oldSpec = { paths: {}, components: { schemas: { UserCreate: oldSchema } } };
      const newSpec = { paths: {}, components: { schemas: { UserCreate: newSchema } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toEqual([{
        type: 'modified', category: 'schema', name: 'UserCreate',
        before: oldSchema,
        after: newSchema,
      }]);
    });
  });

  describe('check', () => {
    it('should set changes when spec differs from baseline', async () => {
      vi.spyOn(service, 'diffSpecs').mockReturnValue([
        { type: 'added', category: 'path', name: '/new', after: { get: {} } },
      ]);

      await service.check();

      expect(service.changes()).toBeTruthy();
      expect(service.changes()!.length).toBe(1);
    });

    it('should not set changes when spec matches baseline', async () => {
      vi.spyOn(service, 'diffSpecs').mockReturnValue([]);

      await service.check();

      expect(service.changes()).toBeNull();
    });
  });
});
