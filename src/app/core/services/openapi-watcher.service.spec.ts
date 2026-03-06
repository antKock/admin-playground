import { TestBed } from '@angular/core/testing';

import { OpenApiWatcherService } from './openapi-watcher.service';

describe('OpenApiWatcherService', () => {
  let service: OpenApiWatcherService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenApiWatcherService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(service as any, 'loadBaseline').mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(service as any, 'saveBaseline').mockResolvedValue(undefined);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('hashSha256', () => {
    it('should produce a 64-char hex string', async () => {
      const hash = await service.hashSha256('hello');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await service.hashSha256('hello');
      const hash2 = await service.hashSha256('world');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce the same hash for the same input', async () => {
      const hash1 = await service.hashSha256('test');
      const hash2 = await service.hashSha256('test');
      expect(hash1).toBe(hash2);
    });
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

    it('should detect changes in realistic OpenAPI spec structure', () => {
      const agentCreateOld = {
        properties: { first_name: { type: 'string' }, community_id: { anyOf: [{ type: 'string' }, { type: 'null' }] } },
        required: ['first_name', 'community_id'],
        type: 'object',
      };
      const baseSpec = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/auth/login': { post: { operationId: 'login', requestBody: { content: { 'application/json': { schema: { '$ref': '#/components/schemas/LoginRequest' } } } } } },
          '/agents/': { get: { operationId: 'list_agents', parameters: [{ name: 'status', in: 'query' }] } },
        },
        components: {
          schemas: {
            AgentCreate: agentCreateOld,
            AgentRead: {
              properties: { id: { type: 'string' }, first_name: { type: 'string' } },
              required: ['id', 'first_name'],
              type: 'object',
            },
          },
        },
      };

      const modifiedSpec = JSON.parse(JSON.stringify(baseSpec));
      modifiedSpec.components.schemas.AgentCreate.required = ['first_name'];

      const changes = service.diffSpecs(baseSpec, modifiedSpec);
      expect(changes).toEqual([{
        type: 'modified', category: 'schema', name: 'AgentCreate',
        before: agentCreateOld,
        after: modifiedSpec.components.schemas.AgentCreate,
      }]);
    });
  });

  describe('check', () => {
    const mockSpec = JSON.stringify({ paths: { '/a': {} }, components: { schemas: { Foo: {} } } });

    it('should save baseline on first run and not set changes', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));

      await service.check();

      expect(service.changes()).toBeNull();
      expect(localStorage.getItem('openapi-baseline-hash')).toBeTruthy();
      expect(service['saveBaseline']).toHaveBeenCalled();
    });

    it('should not set changes when spec has not changed', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      expect(service.changes()).toBeNull();
    });

    it('should set changes with before/after when spec has changed', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      const newSpec = JSON.stringify({ paths: { '/a': {}, '/b': { post: {} } }, components: { schemas: { Foo: {} } } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();

      expect(service.changes()).toBeTruthy();
      expect(service.changes()!.length).toBeGreaterThan(0);
      expect(service.changes()).toContainEqual({ type: 'added', category: 'path', name: '/b', after: { post: {} } });
    });

    it('should fail silently on fetch error', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

      await service.check();

      expect(service.changes()).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should fail silently on non-200 response', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));

      await service.check();

      expect(service.changes()).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should recover baseline from IndexedDB on fresh page load and compute diff with before/after', async () => {
      const baselineObj = { paths: { '/a': {} }, components: { schemas: { Foo: {} } } };

      // First run
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      // Simulate fresh page load
      (service as any).baselineSpec = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(service as any, 'loadBaseline').mockResolvedValue(baselineObj);

      const newSpec = JSON.stringify({ paths: { '/a': {}, '/new-path': { get: {} } }, components: { schemas: { Foo: {} } } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();

      expect(service.changes()).toBeTruthy();
      expect(service.changes()).toContainEqual({ type: 'added', category: 'path', name: '/new-path', after: { get: {} } });
      expect(service.changes()!.some(c => c.name.includes('recharger'))).toBe(false);
    });

    it('should fall back to fingerprint when IndexedDB returns null', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      // Simulate fresh page load, no IndexedDB
      (service as any).baselineSpec = null;

      const newSpec = JSON.stringify({ paths: { '/a': {}, '/new-path': {} }, components: { schemas: { Foo: {} } } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();

      expect(service.changes()).toBeTruthy();
      expect(service.changes()).toContainEqual({ type: 'added', category: 'path', name: '/new-path' });
      // Fingerprint path: no before/after
      const addedChange = service.changes()!.find(c => c.name === '/new-path');
      expect(addedChange?.before).toBeUndefined();
      expect(addedChange?.after).toBeUndefined();
    });

    it('should not show banner when hash was dismissed', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      const newSpec = JSON.stringify({ paths: { '/b': {} }, components: { schemas: {} } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();
      await service.dismiss();

      expect(service.changes()).toBeNull();

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();
      expect(service.changes()).toBeNull();
    });
  });

  describe('dismiss', () => {
    it('should clear changes, store dismissed hash, and save to IndexedDB', async () => {
      const mockSpec = JSON.stringify({ paths: { '/a': {} }, components: { schemas: {} } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      const newSpec = JSON.stringify({ paths: { '/b': {} }, components: { schemas: {} } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();

      expect(service.changes()).toBeTruthy();

      await service.dismiss();
      expect(service.changes()).toBeNull();
      expect(localStorage.getItem('openapi-dismissed-hash')).toBeTruthy();
      expect(service['saveBaseline']).toHaveBeenCalled();
    });
  });
});
