import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance.loginForm.valid).toBe(false);
  });

  it('should have valid form with email and password', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.loginForm.setValue({ email: 'test@example.com', password: 'password' });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.onSubmit();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should navigate to returnUrl after successful login', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ returnUrl: '/action-models/abc123' }),
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    component.loginForm.setValue({ email: 'test@example.com', password: 'pass' });
    component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({ access_token: 'test-token', token_type: 'bearer' });

    expect(navigateSpy).toHaveBeenCalledWith('/action-models/abc123');
  });

  it('should navigate to default route when no returnUrl present', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    component.loginForm.setValue({ email: 'test@example.com', password: 'pass' });
    component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({ access_token: 'test-token', token_type: 'bearer' });

    expect(navigateSpy).toHaveBeenCalledWith('/');
  });
});
