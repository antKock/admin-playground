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
});
