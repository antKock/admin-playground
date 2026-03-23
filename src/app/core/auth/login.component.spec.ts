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

  it('should not submit when form is invalid', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    await component.onSubmit();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should navigate to returnUrl after successful login', async () => {
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
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({ access_token: 'test-token', token_type: 'bearer' });

    await submitPromise;

    expect(navigateSpy).toHaveBeenCalledWith('/action-models/abc123');
  });

  it('should navigate to default route when no returnUrl present', async () => {
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
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({ access_token: 'test-token', token_type: 'bearer' });

    await submitPromise;

    expect(navigateSpy).toHaveBeenCalledWith('/');
  });

  it('should show error message on 401 response', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    component.loginForm.setValue({ email: 'test@example.com', password: 'wrong' });
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    await submitPromise;

    expect(component.errorMessage()).toBe('E-mail ou mot de passe invalide. Veuillez réessayer.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show validation error on 422 response', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    component.loginForm.setValue({ email: 'test@example.com', password: 'pass' });
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({ detail: 'Validation error' }, { status: 422, statusText: 'Unprocessable Entity' });

    await submitPromise;

    expect(component.errorMessage()).toBe('Veuillez saisir une adresse e-mail valide.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show network error on status 0', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    component.loginForm.setValue({ email: 'test@example.com', password: 'pass' });
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.error(new ProgressEvent('error'), { status: 0 });

    await submitPromise;

    expect(component.errorMessage()).toBe('Impossible de se connecter au serveur. Vérifiez votre connexion.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show generic error on unexpected status', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    component.loginForm.setValue({ email: 'test@example.com', password: 'pass' });
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    await submitPromise;

    expect(component.errorMessage()).toBe('Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should reset password field on login error', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    component.loginForm.setValue({ email: 'test@example.com', password: 'wrong' });
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    await submitPromise;

    expect(component.loginForm.controls.password.value).toBe('');
  });
});
