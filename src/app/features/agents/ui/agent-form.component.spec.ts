import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { AgentFormComponent } from './agent-form.component';

describe('AgentFormComponent', () => {
  let component: AgentFormComponent;
  let fixture: ComponentFixture<AgentFormComponent>;

  describe('create mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AgentFormComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: () => null } } },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AgentFormComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set isEditMode to false when no route id', () => {
      component.ngOnInit();
      expect(component.isEditMode).toBe(false);
    });

    it('should have expected form fields', () => {
      expect(component.form.contains('first_name')).toBe(true);
      expect(component.form.contains('last_name')).toBe(true);
      expect(component.form.contains('email')).toBe(true);
      expect(component.form.contains('agent_type')).toBe(true);
      expect(component.form.contains('community_id')).toBe(true);
    });

    it('should require agent_type', () => {
      component.form.patchValue({ agent_type: '' });
      expect(component.form.get('agent_type')!.valid).toBe(false);

      component.form.patchValue({ agent_type: 'other' });
      expect(component.form.get('agent_type')!.valid).toBe(true);
    });

    it('should require community_id', () => {
      component.form.patchValue({ community_id: '' });
      expect(component.form.get('community_id')!.valid).toBe(false);

      component.form.patchValue({ community_id: 'comm-1' });
      expect(component.form.get('community_id')!.valid).toBe(true);
    });
  });
});
