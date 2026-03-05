import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';

import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

@Component({
  imports: [BreadcrumbComponent],
  template: `<app-breadcrumb [items]="items" />`,
})
class TestHostComponent {
  items: BreadcrumbItem[] = [
    { label: 'Action Models', route: '/action-models' },
    { label: 'My Model' },
  ];
}

describe('BreadcrumbComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render correct number of items', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('.breadcrumb-link');
    const current = fixture.nativeElement.querySelectorAll('.breadcrumb-current');
    expect(links.length).toBe(1);
    expect(current.length).toBe(1);
  });

  it('should render last item as plain text, not a link', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const current = fixture.nativeElement.querySelector('.breadcrumb-current');
    expect(current.textContent).toContain('My Model');
    expect(current.tagName).toBe('SPAN');
  });

  it('should render clickable items with routerLink', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.breadcrumb-link');
    expect(link.tagName).toBe('A');
    expect(link.textContent).toContain('Action Models');
  });

  it('should render separator between items', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const separators = fixture.nativeElement.querySelectorAll('.breadcrumb-separator');
    expect(separators.length).toBe(1);
  });

  it('should handle three-level breadcrumbs', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.items = [
      { label: 'Action Models', route: '/action-models' },
      { label: 'My Model', route: '/action-models/123' },
      { label: 'Edit' },
    ];
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('.breadcrumb-link');
    const separators = fixture.nativeElement.querySelectorAll('.breadcrumb-separator');
    expect(links.length).toBe(2);
    expect(separators.length).toBe(2);
  });
});
