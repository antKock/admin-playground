import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { MetadataGridComponent, MetadataField } from './metadata-grid.component';

@Component({
  imports: [MetadataGridComponent],
  template: `<app-metadata-grid [fields]="fields" (navigateToLinked)="onNavigate($event)" />`,
})
class TestHostComponent {
  fields: MetadataField[] = [
    { label: 'Name', value: 'Test Program' },
    { label: 'ID', value: 'abc-123', type: 'mono' },
    { label: 'Related', value: 'Theme A', type: 'linked', linkedRoute: '/action-themes/1' },
  ];
  navigatedTo: string | null = null;

  onNavigate(route: string): void {
    this.navigatedTo = route;
  }
}

describe('MetadataGridComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
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

  it('should render linked field with button', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const linkedButton = fixture.nativeElement.querySelector('.metadata-field:last-child button');
    expect(linkedButton).toBeTruthy();
    expect(linkedButton.textContent).toContain('Theme A');
  });

  it('should emit navigateToLinked when linked field clicked', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const linkedButton = fixture.nativeElement.querySelector('.metadata-field:last-child button');
    linkedButton.click();
    expect(fixture.componentInstance.navigatedTo).toBe('/action-themes/1');
  });

  it('should render labels with correct styling class', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('dt');
    expect(label.classList.contains('text-xs')).toBe(true);
    expect(label.classList.contains('text-text-secondary')).toBe(true);
  });
});
