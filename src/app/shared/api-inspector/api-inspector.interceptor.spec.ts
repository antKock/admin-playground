import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@app/../environments/environment';
import { ApiInspectorService } from './api-inspector.service';
import { apiInspectorInterceptor } from './api-inspector.interceptor';

describe('apiInspectorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let inspectorService: ApiInspectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInspectorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    inspectorService = TestBed.inject(ApiInspectorService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should capture API request URL and response body', () => {
    const responseBody = { id: 1, name: 'Test Item' };
    const url = `${environment.apiBaseUrl}/items/1`;

    http.get(url).subscribe();

    const req = httpTesting.expectOne(url);
    req.flush(responseBody);

    expect(inspectorService.lastRequestUrl()).toBe(url);
    expect(inspectorService.lastResponseBody()).toEqual(responseBody);
  });

  it('should not capture non-API URLs', () => {
    const url = 'https://other-service.com/data';

    http.get(url).subscribe();

    const req = httpTesting.expectOne(url);
    req.flush({ data: 'other' });

    expect(inspectorService.lastRequestUrl()).toBeNull();
    expect(inspectorService.lastResponseBody()).toBeNull();
  });

  it('should not interfere with the response stream', () => {
    const responseBody = { id: 1, name: 'Test' };
    const url = `${environment.apiBaseUrl}/items/1`;
    let receivedBody: unknown;

    http.get(url).subscribe(body => {
      receivedBody = body;
    });

    const req = httpTesting.expectOne(url);
    req.flush(responseBody);

    expect(receivedBody).toEqual(responseBody);
  });

  it('should update with the latest API call', () => {
    const url1 = `${environment.apiBaseUrl}/items/1`;
    const url2 = `${environment.apiBaseUrl}/items/2`;

    http.get(url1).subscribe();
    httpTesting.expectOne(url1).flush({ id: 1 });

    http.get(url2).subscribe();
    httpTesting.expectOne(url2).flush({ id: 2 });

    expect(inspectorService.lastRequestUrl()).toBe(url2);
    expect(inspectorService.lastResponseBody()).toEqual({ id: 2 });
  });
});
