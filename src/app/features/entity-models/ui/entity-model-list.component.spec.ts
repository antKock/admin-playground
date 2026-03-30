import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { EntityModelListComponent } from './entity-model-list.component';
import { EntityModel } from '@domains/entity-models/entity-model.models';
import { environment } from '@app/../environments/environment';

const BASE = `${environment.apiBaseUrl}/entity-models/`;

const mockEntityModels: EntityModel[] = [
  {
    entity_type: 'community',
    name: 'Communautés',
    id: 'em-1',
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
    sections: [{
      id: 's-1',
      name: 'Infos',
      key: 'additional_info',
      is_enabled: true,
      position: 0,
      hidden_rule: 'false',
      required_rule: 'false',
      disabled_rule: 'false',
      occurrence_rule: { min: 'false', max: 'false' },
      constrained_rule: 'false',
      created_at: '2026-01-01T00:00:00Z',
      last_updated_at: '2026-01-01T00:00:00Z',
      indicators: [
        { id: 'ind-1', name: 'Ind 1', technical_label: 'ind1', type: 'text', hidden_rule: 'false', required_rule: 'false', disabled_rule: 'false', default_value_rule: 'false', occurrence_rule: { min: 'false', max: 'false' }, constrained_rule: 'false', position: 0, created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z' },
        { id: 'ind-2', name: 'Ind 2', technical_label: 'ind2', type: 'number', hidden_rule: 'false', required_rule: 'false', disabled_rule: 'false', default_value_rule: 'false', occurrence_rule: { min: 'false', max: 'false' }, constrained_rule: 'false', position: 1, created_at: '2026-01-01T00:00:00Z', last_updated_at: '2026-01-01T00:00:00Z' },
      ],
    }],
  },
  {
    entity_type: 'agent',
    name: 'Agents',
    id: 'em-2',
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
    sections: [],
  },
  {
    entity_type: 'site',
    name: 'Sites',
    id: 'em-3',
    created_at: '2026-01-01T00:00:00Z',
    last_updated_at: '2026-01-01T00:00:00Z',
    sections: [],
  },
];

describe('EntityModelListComponent', () => {
  let component: EntityModelListComponent;
  let fixture: ComponentFixture<EntityModelListComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityModelListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityModelListComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call facade.loadAll on init', () => {
    const loadSpy = vi.spyOn(component['facade'], 'loadAll');
    component.ngOnInit();
    expect(loadSpy).toHaveBeenCalled();
    httpTesting.expectOne(BASE).flush([]);
  });

  it('should navigate to entity type route on card click', () => {
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onCardClick({
      entityType: 'community',
      label: 'Communautés',
      icon: '🏘',
      indicatorCount: 0,
      route: '/entity-models/community',
    });

    expect(navSpy).toHaveBeenCalledWith(['/entity-models', 'community']);
  });

  it('should initialize hasLoaded as false', () => {
    expect(component.hasLoaded()).toBe(false);
  });

  it('should render 3 cards with correct labels and icons after load', () => {
    fixture.detectChanges(); // triggers ngOnInit → loadAll
    httpTesting.expectOne(BASE).flush(mockEntityModels);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('[role="button"]');
    expect(cards.length).toBe(3);

    expect(cards[0].textContent).toContain('🏘');
    expect(cards[0].textContent).toContain('Communautés');
    expect(cards[1].textContent).toContain('👤');
    expect(cards[1].textContent).toContain('Agents');
    expect(cards[2].textContent).toContain('🏠');
    expect(cards[2].textContent).toContain('Sites');
  });

  it('should display indicator count from additional_info section', () => {
    fixture.detectChanges();
    httpTesting.expectOne(BASE).flush(mockEntityModels);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('[role="button"]');
    // First card has 2 indicators in additional_info section
    expect(cards[0].textContent).toContain('2 indicateurs');
    // Other cards have 0
    expect(cards[1].textContent).toContain('0 indicateur');
    expect(cards[2].textContent).toContain('0 indicateur');
  });

  it('should set hasLoaded to true after loading completes', () => {
    fixture.detectChanges();
    expect(component.hasLoaded()).toBe(false);

    httpTesting.expectOne(BASE).flush(mockEntityModels);
    fixture.detectChanges();

    expect(component.hasLoaded()).toBe(true);
  });

  it('should not show empty message while loading (hasLoaded guard)', () => {
    fixture.detectChanges(); // loading in progress
    const emptyMsg = fixture.nativeElement.querySelector('.text-center.text-text-secondary');
    expect(emptyMsg).toBeNull();
    httpTesting.expectOne(BASE).flush(mockEntityModels);
  });

  it('should navigate on card click via DOM', () => {
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    httpTesting.expectOne(BASE).flush(mockEntityModels);
    fixture.detectChanges();

    const firstCard = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    firstCard.click();

    expect(navSpy).toHaveBeenCalledWith(['/entity-models', 'community']);
  });
});
