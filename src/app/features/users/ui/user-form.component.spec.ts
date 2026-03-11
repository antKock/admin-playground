import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  describe('create mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [UserFormComponent],
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

      fixture = TestBed.createComponent(UserFormComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be in create mode', () => {
      expect(component.isEditMode).toBe(false);
    });

    it('should have password field in create mode', () => {
      expect(component.form.get('password')).toBeTruthy();
    });

    it('should call facade.loadRoles on init', () => {
      const loadRolesSpy = vi.spyOn(component.facade, 'loadRoles');
      component.ngOnInit();
      expect(loadRolesSpy).toHaveBeenCalled();
    });

    it('should not submit when form is invalid', async () => {
      const createSpy = vi.spyOn(component.facade, 'create');
      await component.onSubmit();
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [UserFormComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: () => 'user-1' } } },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(UserFormComponent);
      component = fixture.componentInstance;
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBe(true);
    });

    it('should not have password field in edit mode', () => {
      expect(component.form.get('password')).toBeNull();
    });

    it('should call facade.select on init', () => {
      const selectSpy = vi.spyOn(component.facade, 'select');
      component.ngOnInit();
      expect(selectSpy).toHaveBeenCalledWith('user-1');
    });
  });
});
