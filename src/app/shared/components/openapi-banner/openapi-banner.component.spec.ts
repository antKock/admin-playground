import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenApiBannerComponent } from './openapi-banner.component';
import { OpenApiWatcherService } from '@app/core/services/openapi-watcher.service';

describe('OpenApiBannerComponent', () => {
  let component: OpenApiBannerComponent;
  let fixture: ComponentFixture<OpenApiBannerComponent>;
  let service: OpenApiWatcherService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenApiBannerComponent],
    }).compileComponents();

    service = TestBed.inject(OpenApiWatcherService);
    fixture = TestBed.createComponent(OpenApiBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when no changes', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.openapi-banner')).toBeFalsy();
  });

  it('should render banner when changes exist', () => {
    service.changes.set([
      { type: 'added', category: 'path', name: '/new-endpoint' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.openapi-banner')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Le schéma API a changé');
  });

  it('should be collapsed by default', () => {
    service.changes.set([
      { type: 'added', category: 'path', name: '/new-endpoint' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.openapi-banner-body')).toBeFalsy();
  });

  it('should expand on click', () => {
    service.changes.set([
      { type: 'added', category: 'path', name: '/new-endpoint' },
    ]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.openapi-banner-header').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.openapi-banner-body')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('/new-endpoint');
  });

  it('should show path and schema changes separately', () => {
    service.changes.set([
      { type: 'added', category: 'path', name: '/users' },
      { type: 'removed', category: 'schema', name: 'UserResponse' },
    ]);
    fixture.detectChanges();

    component.isExpanded.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Endpoints (1)');
    expect(fixture.nativeElement.textContent).toContain('Schémas (1)');
    expect(fixture.nativeElement.textContent).toContain('/users');
    expect(fixture.nativeElement.textContent).toContain('UserResponse');
  });

  it('should show translated change type labels', () => {
    expect(component.changeLabel('added')).toBe('Ajouté');
    expect(component.changeLabel('removed')).toBe('Supprimé');
    expect(component.changeLabel('modified')).toBe('Modifié');
  });

  it('should dismiss banner on dismiss click', () => {
    service.changes.set([
      { type: 'added', category: 'path', name: '/test' },
    ]);
    service.currentHash.set('abc123');
    fixture.detectChanges();

    const dismissSpy = vi.spyOn(service, 'dismiss');
    fixture.nativeElement.querySelector('.openapi-dismiss-btn').click();
    fixture.detectChanges();

    expect(dismissSpy).toHaveBeenCalled();
  });

  describe('before/after detail', () => {
    it('should show expand chevron when before/after data is available', () => {
      service.changes.set([
        { type: 'modified', category: 'schema', name: 'Foo', before: { type: 'string' }, after: { type: 'number' } },
      ]);
      component.isExpanded.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.detail-chevron')).toBeTruthy();
    });

    it('should not show expand chevron when no before/after data', () => {
      service.changes.set([
        { type: 'modified', category: 'schema', name: 'Foo' },
      ]);
      component.isExpanded.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.detail-chevron')).toBeFalsy();
    });

    it('should show before/after panels when detail is expanded', () => {
      service.changes.set([
        { type: 'modified', category: 'schema', name: 'Foo', before: { type: 'string' }, after: { type: 'number' } },
      ]);
      component.isExpanded.set(true);
      fixture.detectChanges();

      // Click to expand detail
      fixture.nativeElement.querySelector('.openapi-change-item.expandable').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.openapi-detail')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.detail-before')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.detail-after')).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Avant');
      expect(fixture.nativeElement.textContent).toContain('Après');
      expect(fixture.nativeElement.textContent).toContain('"string"');
      expect(fixture.nativeElement.textContent).toContain('"number"');
    });

    it('should show only Après for added items', () => {
      service.changes.set([
        { type: 'added', category: 'path', name: '/new', after: { get: {} } },
      ]);
      component.isExpanded.set(true);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.openapi-change-item.expandable').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.detail-before')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.detail-after')).toBeTruthy();
    });

    it('should show only Avant for removed items', () => {
      service.changes.set([
        { type: 'removed', category: 'schema', name: 'Old', before: { type: 'object' } },
      ]);
      component.isExpanded.set(true);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.openapi-change-item.expandable').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.detail-before')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.detail-after')).toBeFalsy();
    });

    it('should toggle detail on repeated clicks', () => {
      service.changes.set([
        { type: 'modified', category: 'schema', name: 'Foo', before: { type: 'string' }, after: { type: 'number' } },
      ]);
      component.isExpanded.set(true);
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector('.openapi-change-item.expandable');

      item.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.openapi-detail')).toBeTruthy();

      item.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.openapi-detail')).toBeFalsy();
    });
  });
});
