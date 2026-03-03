import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { SectionAnchorsComponent, SectionDef } from './section-anchors.component';

@Component({
  imports: [SectionAnchorsComponent],
  template: `<app-section-anchors [sections]="sections" [activeSection]="activeSection" (anchorClicked)="onAnchorClick($event)" />`,
})
class TestHostComponent {
  sections: SectionDef[] = [
    { label: 'General', targetId: 'general' },
    { label: 'Indicators', count: 5, targetId: 'indicators' },
    { label: 'Settings', targetId: 'settings' },
  ];
  activeSection = '';
  clickedTarget: string | null = null;

  onAnchorClick(targetId: string): void {
    this.clickedTarget = targetId;
  }
}

describe('SectionAnchorsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav[aria-label="Page sections"]');
    expect(nav).toBeTruthy();
  });

  it('should render section pills', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const pills = fixture.nativeElement.querySelectorAll('.anchor-pill');
    expect(pills.length).toBe(3);
  });

  it('should display count when provided', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const pills = fixture.nativeElement.querySelectorAll('.anchor-pill');
    expect(pills[1].textContent).toContain('(5)');
  });

  it('should not display count when not provided', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const pills = fixture.nativeElement.querySelectorAll('.anchor-pill');
    expect(pills[0].textContent).not.toContain('(');
  });

  it('should emit anchorClicked on pill click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const pills = fixture.nativeElement.querySelectorAll('.anchor-pill');
    pills[1].click();
    expect(fixture.componentInstance.clickedTarget).toBe('indicators');
  });

  it('should apply active class to matching section', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.activeSection = 'indicators';
    fixture.detectChanges();
    // Allow effect to run
    TestBed.flushEffects();
    fixture.detectChanges();
    const activePill = fixture.nativeElement.querySelector('.anchor-pill-active');
    expect(activePill).toBeTruthy();
    expect(activePill.textContent).toContain('Indicators');
  });

  it('should have role="navigation" for accessibility', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('[role="navigation"]');
    expect(nav).toBeTruthy();
  });
});
