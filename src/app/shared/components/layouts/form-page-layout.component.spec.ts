import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';

import { FormPageLayoutComponent } from './form-page-layout.component';
import { BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';

@Component({
  imports: [FormPageLayoutComponent],
  template: `
    <app-form-page-layout
      [breadcrumbs]="breadcrumbs"
      [isSaving]="isSaving"
      [isDirty]="isDirty"
      [title]="title"
      (save)="saveCalled = true"
      (cancelClick)="cancelCalled = true"
    >
      <div>Form content</div>
    </app-form-page-layout>
  `,
})
class TestHostComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Agents', route: '/agents' },
    { label: 'Nouvel agent' },
  ];
  isSaving = false;
  isDirty = false;
  title = 'Créer un agent';
  saveCalled = false;
  cancelCalled = false;
}

describe('FormPageLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render title and breadcrumbs', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Créer un agent');
    expect(fixture.nativeElement.querySelector('app-breadcrumb')).toBeTruthy();
  });

  it('should project form content', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Form content');
  });

  it('should show save bar when dirty', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isDirty = true;
    fixture.detectChanges();
    const saveBar = fixture.nativeElement.querySelector('app-save-bar');
    expect(saveBar).toBeTruthy();
  });

  it('should not show save bar when not dirty', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isDirty = false;
    fixture.detectChanges();
    const saveBar = fixture.nativeElement.querySelector('app-save-bar');
    expect(saveBar).toBeNull();
  });

  it('should emit save on Cmd+S when dirty', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isDirty = true;
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));

    expect(fixture.componentInstance.saveCalled).toBe(true);
  });

  it('should not emit save on Cmd+S when not dirty', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isDirty = false;
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));

    expect(fixture.componentInstance.saveCalled).toBe(false);
  });

  it('should emit cancel on Escape when not dirty', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isDirty = false;
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(fixture.componentInstance.cancelCalled).toBe(true);
  });

  it('should not emit cancel on Escape when dirty', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isDirty = true;
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(fixture.componentInstance.cancelCalled).toBe(false);
  });
});
