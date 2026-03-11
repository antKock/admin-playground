import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';

import { MetadataGridComponent, MetadataField } from './metadata-grid.component';

@Component({
  imports: [MetadataGridComponent],
  template: `<app-metadata-grid [fields]="fields" />`,
})
class TestHostComponent {
  fields: MetadataField[] = [
    { label: 'Name', value: 'Test Program' },
    { label: 'ID', value: 'abc-123', type: 'mono' },
    { label: 'Related', value: 'Theme A', type: 'linked', linkedRoute: '/action-themes/1' },
  ];
}

describe('MetadataGridComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.metadata-grid');
    expect(grid).toBeTruthy();
  });

  it('should render fields', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const fields = fixture.nativeElement.querySelectorAll('.metadata-field');
    expect(fields.length).toBe(3);
  });

  it('should apply mono class for mono type', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const monoDd = fixture.nativeElement.querySelectorAll('dd')[1];
    expect(monoDd.classList.contains('font-mono')).toBe(true);
  });

  it('should render linked field as routerLink anchor', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const linkedAnchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.metadata-field:last-child a');
    expect(linkedAnchor).toBeTruthy();
    expect(linkedAnchor.textContent).toContain('Theme A');
    expect(linkedAnchor.getAttribute('href')).toBe('/action-themes/1');
  });

  it('should render labels with correct styling class', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('dt');
    expect(label.classList.contains('text-xs')).toBe(true);
    expect(label.classList.contains('text-text-secondary')).toBe(true);
  });

  it('should render status badge for status type', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.fields = [
      { label: 'Statut', value: 'Actif', type: 'status' },
    ];
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.rounded-full');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Actif');
  });
});
