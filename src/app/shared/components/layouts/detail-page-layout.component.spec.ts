import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';

import { DetailPageLayoutComponent } from './detail-page-layout.component';
import { BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';

@Component({
  imports: [DetailPageLayoutComponent],
  template: `
    <app-detail-page-layout
      [breadcrumbs]="breadcrumbs"
      [isLoading]="isLoading"
    >
      <div metadata>Metadata content</div>
      <div sections>Sections content</div>
      <div actions>Actions content</div>
    </app-detail-page-layout>
  `,
})
class TestHostComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Agents', route: '/agents' },
    { label: 'Agent 1' },
  ];
  isLoading = false;
}

describe('DetailPageLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render breadcrumbs', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const breadcrumb = fixture.nativeElement.querySelector('app-breadcrumb');
    expect(breadcrumb).toBeTruthy();
  });

  it('should show skeleton when loading', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isLoading = true;
    fixture.detectChanges();
    const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Metadata content');
  });

  it('should project content when not loading', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Metadata content');
    expect(fixture.nativeElement.textContent).toContain('Sections content');
    expect(fixture.nativeElement.textContent).toContain('Actions content');
  });
});
