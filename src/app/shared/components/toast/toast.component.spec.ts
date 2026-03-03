import { TestBed } from '@angular/core/testing';

import { ToastContainerComponent } from './toast.component';
import { ToastService } from '@app/shared/services/toast.service';

describe('ToastContainerComponent', () => {
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
    }).compileComponents();

    service = TestBed.inject(ToastService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render toast container', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.toast-container');
    expect(container).toBeTruthy();
  });

  it('should render a toast when service adds one', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    service.success('Test message');
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('Test message');
  });

  it('should apply success class for success toast', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    service.success('Success!');
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('.toast-success');
    expect(toast).toBeTruthy();
  });

  it('should apply error class for error toast', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    service.error('Error!');
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('.toast-error');
    expect(toast).toBeTruthy();
  });

  it('should apply info class for info toast', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    service.info('Info!');
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('.toast-info');
    expect(toast).toBeTruthy();
  });

  it('should have role="alert" for accessibility', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    service.success('Test');
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('[role="alert"]');
    expect(toast).toBeTruthy();
  });

  it('should dismiss toast on click', () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    service.success('Dismiss me');
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('.toast');
    toast.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.toast')).toBeFalsy();
  });
});
