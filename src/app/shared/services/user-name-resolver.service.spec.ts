import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserNameResolverService } from './user-name-resolver.service';
import { environment } from '@app/../environments/environment';

describe('UserNameResolverService', () => {
  let service: UserNameResolverService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserNameResolverService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return "—" for null id', () => {
    expect(service.resolve(null)).toBe('—');
  });

  it('should return "—" for undefined id', () => {
    expect(service.resolve(undefined)).toBe('—');
  });

  it('should return loading placeholder and resolve to user name', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const result = service.resolve(id);
    expect(result).toBe('…');

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/${id}`);
    req.flush({ first_name: 'Jean', last_name: 'Dupont' });

    expect(service.resolve(id)).toBe('Jean Dupont');
  });

  it('should cache resolved names', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    service.resolve(id);

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/${id}`);
    req.flush({ first_name: 'Jean', last_name: 'Dupont' });

    // Second call should not trigger another HTTP request
    expect(service.resolve(id)).toBe('Jean Dupont');
    httpMock.expectNone(`${environment.apiBaseUrl}/users/${id}`);
  });

  it('should show fallback label on error', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    service.resolve(id);

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/${id}`);
    req.error(new ProgressEvent('error'));

    expect(service.resolve(id)).toBe('Utilisateur inconnu');
  });
});
