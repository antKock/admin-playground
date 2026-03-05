import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { AgentDetailComponent } from './agent-detail.component';

describe('AgentDetailComponent', () => {
  let component: AgentDetailComponent;
  let fixture: ComponentFixture<AgentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'agent-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call facade.select on init with route id', () => {
    const selectSpy = vi.spyOn(component.facade, 'select');
    component.ngOnInit();
    expect(selectSpy).toHaveBeenCalledWith('agent-1');
  });

  it('should map agent type to human-readable label', () => {
    expect(component.agentTypeLabel('energy_performance_advisor')).toBe('Conseiller en performance énergétique');
    expect(component.agentTypeLabel('other')).toBe('Autre');
    expect(component.agentTypeLabel('unknown_type')).toBe('unknown_type');
  });

  it('should return French transition labels', () => {
    expect(component.transitionLabel('completed')).toBe('Complété');
    expect(component.transitionLabel('draft')).toBe('Brouillon');
    expect(component.transitionLabel('deleted')).toBe('Supprimé');
  });
});
