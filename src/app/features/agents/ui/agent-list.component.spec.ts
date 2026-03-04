import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AgentListComponent } from './agent-list.component';

describe('AgentListComponent', () => {
  let component: AgentListComponent;
  let fixture: ComponentFixture<AgentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should define expected columns', () => {
    expect(component.columns.map(c => c.key)).toEqual([
      'displayName', 'email', 'agent_type', 'status', 'community_name', 'created_at',
    ]);
  });

  it('should include status-badge column type', () => {
    const statusCol = component.columns.find(c => c.key === 'status');
    expect(statusCol?.type).toBe('status-badge');
  });

  it('should call facade.load on init', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.ngOnInit();
    expect(loadSpy).toHaveBeenCalled();
  });
});
