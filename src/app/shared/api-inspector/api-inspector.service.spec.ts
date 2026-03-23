import { TestBed } from '@angular/core/testing';
import { ApiInspectorService } from './api-inspector.service';

describe('ApiInspectorService', () => {
  let service: ApiInspectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiInspectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null values', () => {
    expect(service.lastRequestUrl()).toBeNull();
    expect(service.lastResponseBody()).toBeNull();
  });

  it('should capture request URL and response body', () => {
    const url = 'https://api.example.com/items/1';
    const body = { id: 1, name: 'Test' };

    service.capture(url, body);

    expect(service.lastRequestUrl()).toBe(url);
    expect(service.lastResponseBody()).toEqual(body);
  });

  it('should overwrite previous capture with new data', () => {
    service.capture('https://api.example.com/first', { first: true });
    service.capture('https://api.example.com/second', { second: true });

    expect(service.lastRequestUrl()).toBe('https://api.example.com/second');
    expect(service.lastResponseBody()).toEqual({ second: true });
  });

  it('should clear both signals to null', () => {
    service.capture('https://api.example.com/items', { data: 'test' });
    service.clear();

    expect(service.lastRequestUrl()).toBeNull();
    expect(service.lastResponseBody()).toBeNull();
  });
});
