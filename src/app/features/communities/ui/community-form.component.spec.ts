import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { CommunityFormComponent } from './community-form.component';

describe('CommunityFormComponent', () => {
  let component: CommunityFormComponent;
  let fixture: ComponentFixture<CommunityFormComponent>;

  describe('create mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CommunityFormComponent],
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

      fixture = TestBed.createComponent(CommunityFormComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set isEditMode to false when no route id', () => {
      component.ngOnInit();
      expect(component.isEditMode).toBe(false);
    });

    it('should have required form fields', () => {
      expect(component.form.contains('name')).toBe(true);
      expect(component.form.contains('siret')).toBe(true);
      expect(component.form.contains('public_comment')).toBe(true);
      expect(component.form.contains('internal_comment')).toBe(true);
    });

    it('should validate name is required', () => {
      component.form.patchValue({ name: '' });
      expect(component.form.get('name')!.valid).toBe(false);
    });

    it('should validate siret is 14 digits', () => {
      component.form.patchValue({ siret: '123' });
      expect(component.form.get('siret')!.valid).toBe(false);

      component.form.patchValue({ siret: '12345678901234' });
      expect(component.form.get('siret')!.valid).toBe(true);
    });
  });
});
