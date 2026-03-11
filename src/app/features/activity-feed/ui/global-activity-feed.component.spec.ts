import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Component, signal } from '@angular/core';

import { GlobalActivityFeedComponent } from './global-activity-feed.component';
import { ActivityFeedFacade } from '../activity-feed.facade';

const mockActivities = [
  {
    id: '1',
    user_id: 'u1',
    user_name: 'Alice',
    action: 'create' as const,
    entity_type: 'FundingProgram',
    entity_id: 'fp1',
    entity_display_name: 'Programme Alpha',
    description: 'Created',
    changes_summary: 'Initial creation',
    parent_entity_type: null,
    parent_entity_id: null,
    parent_entity_name: null,
    created_at: '2026-03-11T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'u2',
    user_name: 'Bob',
    action: 'update' as const,
    entity_type: 'Community',
    entity_id: 'c1',
    entity_display_name: 'Communauté Beta',
    description: 'Updated',
    changes_summary: null,
    parent_entity_type: null,
    parent_entity_id: null,
    parent_entity_name: null,
    created_at: '2026-03-11T09:00:00Z',
  },
];

@Component({
  selector: 'app-test-host',
  imports: [GlobalActivityFeedComponent],
  template: `<app-global-activity-feed [isOpen]="isOpen()" (closed)="isOpen.set(false)" />`,
})
class TestHostComponent {
  isOpen = signal(true);
}

describe('GlobalActivityFeedComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let compiled: HTMLElement;
  let facade: ActivityFeedFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    facade = TestBed.inject(ActivityFeedFacade);
    fixture = TestBed.createComponent(TestHostComponent);
  });

  it('should render panel when isOpen is true', async () => {
    await fixture.whenStable();
    compiled = fixture.nativeElement;
    const panel = compiled.querySelector('.fixed');
    expect(panel).toBeTruthy();
  });

  it('should not render panel when isOpen is false', async () => {
    fixture.componentInstance.isOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    compiled = fixture.nativeElement;
    const panel = compiled.querySelector('.fixed');
    expect(panel).toBeFalsy();
  });

  it('should render filter controls (2 dropdowns + date input)', async () => {
    await fixture.whenStable();
    compiled = fixture.nativeElement;
    const selects = compiled.querySelectorAll('select');
    const dateInput = compiled.querySelector('input[type="date"]');
    expect(selects.length).toBe(2);
    expect(dateInput).toBeTruthy();
  });

  it('should render activity entries with expected fields', async () => {
    // Directly set activities via the underlying store
    vi.spyOn(facade, 'activities').mockReturnValue(mockActivities as any);
    vi.spyOn(facade, 'isLoading').mockReturnValue(false);
    vi.spyOn(facade, 'hasMore').mockReturnValue(false);
    vi.spyOn(facade, 'error').mockReturnValue(null);
    fixture.detectChanges();
    await fixture.whenStable();
    compiled = fixture.nativeElement;

    const entries = compiled.querySelectorAll('.divide-y > div');
    expect(entries.length).toBe(2);

    const firstEntry = entries[0];
    expect(firstEntry.textContent).toContain('Alice');
    expect(firstEntry.textContent).toContain('Création');
    expect(firstEntry.textContent).toContain('Programme Alpha');
  });

  it('should emit closed on Escape key', async () => {
    await fixture.whenStable();
    compiled = fixture.nativeElement;
    const panel = compiled.querySelector('.fixed');
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('should navigate to entity route and close on activity click', async () => {
    vi.spyOn(facade, 'activities').mockReturnValue(mockActivities as any);
    vi.spyOn(facade, 'isLoading').mockReturnValue(false);
    vi.spyOn(facade, 'hasMore').mockReturnValue(false);
    vi.spyOn(facade, 'error').mockReturnValue(null);
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    await fixture.whenStable();
    compiled = fixture.nativeElement;

    const firstEntry = compiled.querySelector('.cursor-pointer') as HTMLElement;
    firstEntry?.click();
    expect(navSpy).toHaveBeenCalledWith('/funding-programs/fp1');
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('should show empty state when no activities', async () => {
    vi.spyOn(facade, 'activities').mockReturnValue([]);
    vi.spyOn(facade, 'isLoading').mockReturnValue(false);
    vi.spyOn(facade, 'hasMore').mockReturnValue(false);
    vi.spyOn(facade, 'error').mockReturnValue(null);
    fixture.detectChanges();
    await fixture.whenStable();
    compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('Aucune activité trouvée');
  });
});
