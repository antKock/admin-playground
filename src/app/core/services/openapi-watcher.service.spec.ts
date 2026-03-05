import { TestBed } from '@angular/core/testing';

import { OpenApiWatcherService } from './openapi-watcher.service';

describe('OpenApiWatcherService', () => {
  let service: OpenApiWatcherService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenApiWatcherService);
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
    it('should detect added paths', () => {
      const oldSpec = { paths: { '/a': {} } };
      const newSpec = { paths: { '/a': {}, '/b': {} } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'added', category: 'path', name: '/b' });
    });

    it('should detect removed paths', () => {
      const oldSpec = { paths: { '/a': {}, '/b': {} } };
      const newSpec = { paths: { '/a': {} } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'removed', category: 'path', name: '/b' });
    });

    it('should detect modified paths', () => {
      const oldSpec = { paths: { '/a': { get: { summary: 'old' } } } };
      const newSpec = { paths: { '/a': { get: { summary: 'new' } } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'modified', category: 'path', name: '/a' });
    });

    it('should detect added schemas', () => {
      const oldSpec = { components: { schemas: { Foo: {} } } };
      const newSpec = { components: { schemas: { Foo: {}, Bar: {} } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'added', category: 'schema', name: 'Bar' });
    });

    it('should detect removed schemas', () => {
      const oldSpec = { components: { schemas: { Foo: {}, Bar: {} } } };
      const newSpec = { components: { schemas: { Foo: {} } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'removed', category: 'schema', name: 'Bar' });
    });

    it('should detect modified schemas', () => {
      const oldSpec = { components: { schemas: { Foo: { type: 'string' } } } };
      const newSpec = { components: { schemas: { Foo: { type: 'number' } } } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'modified', category: 'schema', name: 'Foo' });
    });

    it('should return empty array when specs are identical', () => {
      const spec = { paths: { '/a': {} }, components: { schemas: { Foo: {} } } };
      const changes = service.diffSpecs(spec, spec);
      expect(changes).toEqual([]);
    });

    it('should handle missing paths or components gracefully', () => {
      const oldSpec = {};
      const newSpec = { paths: { '/a': {} } };
      const changes = service.diffSpecs(oldSpec, newSpec);
      expect(changes).toContainEqual({ type: 'added', category: 'path', name: '/a' });
    });
  });

  describe('check', () => {
    const mockSpec = JSON.stringify({ paths: { '/a': {} }, components: { schemas: { Foo: {} } } });

    it('should save baseline on first run and not set changes', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));

      await service.check();

      expect(service.changes()).toBeNull();
      expect(localStorage.getItem('openapi-baseline-hash')).toBeTruthy();
      expect(localStorage.getItem('openapi-baseline-spec')).toBe(mockSpec);
    });

    it('should not set changes when spec has not changed', async () => {
      // First run
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      // Second run — same spec
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      expect(service.changes()).toBeNull();
    });

    it('should set changes when spec has changed', async () => {
      // First run
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      // Second run — different spec
      const newSpec = JSON.stringify({ paths: { '/a': {}, '/b': {} }, components: { schemas: { Foo: {} } } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();

      expect(service.changes()).toBeTruthy();
      expect(service.changes()!.length).toBeGreaterThan(0);
      expect(service.changes()).toContainEqual({ type: 'added', category: 'path', name: '/b' });
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

    it('should not show banner when hash was dismissed', async () => {
      // First run
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      // Change spec + dismiss
      const newSpec = JSON.stringify({ paths: { '/b': {} }, components: { schemas: {} } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();
      service.dismiss();

      expect(service.changes()).toBeNull();

      // Re-check same changed spec — should stay dismissed
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();
      expect(service.changes()).toBeNull();
    });
  });

  describe('dismiss', () => {
    it('should clear changes and store dismissed hash', async () => {
      const mockSpec = JSON.stringify({ paths: { '/a': {} }, components: { schemas: {} } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(mockSpec, { status: 200 }));
      await service.check();

      const newSpec = JSON.stringify({ paths: { '/b': {} }, components: { schemas: {} } });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(newSpec, { status: 200 }));
      await service.check();

      expect(service.changes()).toBeTruthy();

      service.dismiss();
      expect(service.changes()).toBeNull();
      expect(localStorage.getItem('openapi-dismissed-hash')).toBeTruthy();
    });
  });
});
