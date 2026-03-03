import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { StatusBadgeComponent } from './status-badge.component';

@Component({
  imports: [StatusBadgeComponent],
  template: `<app-status-badge [status]="status" [label]="label" />`,
})
class TestHostComponent {
  status = 'draft';
  label: string | undefined;
}

describe('StatusBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge).toBeTruthy();
  });

  it('should display status as label by default', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.textContent.trim()).toBe('draft');
  });

  it('should display custom label when provided', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.label = 'Custom Label';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.textContent.trim()).toBe('Custom Label');
  });

  it('should apply correct class for draft status', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.classList.contains('bg-surface-base')).toBe(true);
  });

  it('should apply correct class for published status', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.status = 'published';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.classList.contains('bg-status-done')).toBe(true);
  });

  it('should apply correct class for done status', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.status = 'done';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.classList.contains('bg-status-done')).toBe(true);
  });

  it('should apply correct class for review status', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.status = 'review';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.classList.contains('bg-status-review')).toBe(true);
  });

  it('should apply correct class for invalid status', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.status = 'invalid';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.classList.contains('bg-status-invalid')).toBe(true);
  });

  it('should apply default class for unknown status', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.status = 'unknown-status';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.classList.contains('bg-surface-muted')).toBe(true);
  });
});
