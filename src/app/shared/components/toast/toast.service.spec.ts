import { TestBed } from '@angular/core/testing';

import { ToastService } from '@app/shared/services/toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should start with no toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should add a success toast', () => {
    service.success('Test message');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Test message');
  });

  it('should add an error toast', () => {
    service.error('Error message');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should add an info toast', () => {
    service.info('Info message');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should dismiss a toast', () => {
    service.success('Test');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('should support multiple toasts', () => {
    service.success('Success');
    service.error('Error');
    service.info('Info');
    expect(service.toasts().length).toBe(3);
  });

  it('should use default 4s duration for success', () => {
    service.success('Test');
    expect(service.toasts()[0].duration).toBe(4000);
  });

  it('should use default 6s duration for error', () => {
    service.error('Test');
    expect(service.toasts()[0].duration).toBe(6000);
  });

  it('should allow custom duration', () => {
    service.success('Test', 10000);
    expect(service.toasts()[0].duration).toBe(10000);
  });
});
