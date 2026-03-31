import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SectionCardComponent } from './section-card.component';
import { SectionKey } from './section-card.models';

describe('SectionCardComponent', () => {
  let component: SectionCardComponent;
  let fixture: ComponentFixture<SectionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sectionName', 'Candidature');
    fixture.componentRef.setInput('sectionType', 'application' as SectionKey);
    fixture.componentRef.setInput('indicatorCount', 3);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display section name', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Candidature');
  });

  it('should display type icon', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('📋');
  });

  it('should not show "Paramètres" or "Masquer" labels (removed in 23.2)', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Paramètres');
    expect(fixture.nativeElement.textContent).not.toContain('Masquer');
  });

  it('should toggle collapse when header row is clicked', () => {
    fixture.detectChanges();

    let toggled = false;
    component.toggleCollapse.subscribe(() => (toggled = true));

    const header = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    header.click();
    fixture.detectChanges();

    expect(toggled).toBe(true);
  });

  it('should start collapsed by default', () => {
    fixture.detectChanges();
    expect(component['isCollapsed']()).toBe(true);
  });

  it('should expand when header is clicked while collapsed', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    header.click();
    fixture.detectChanges();

    expect(component['isCollapsed']()).toBe(false);
  });

  it('should render param-hint-icons when paramHints is provided', () => {
    fixture.componentRef.setInput('paramHints', {
      visibility: 'on',
      required: 'off',
      editable: 'off',
      defaultValue: 'off',
      occurrence: 'off',
      constrained: 'off',
    });
    fixture.detectChanges();

    const hintIcons = fixture.nativeElement.querySelector('app-param-hint-icons');
    expect(hintIcons).toBeTruthy();
  });

  it('should not render param-hint-icons when paramHints is not provided', () => {
    fixture.detectChanges();

    const hintIcons = fixture.nativeElement.querySelector('app-param-hint-icons');
    expect(hintIcons).toBeFalsy();
  });

  it('should apply border-gray-300 when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.border-gray-300');
    expect(card).toBeTruthy();
  });
});

@Component({
  imports: [SectionCardComponent],
  template: `
    <app-section-card sectionName="Test" sectionType="application" [indicatorCount]="0">
      <p class="projected-content">Projected content</p>
    </app-section-card>
  `,
})
class TestHostComponent {}

describe('SectionCardComponent (content projection)', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should project default content (always visible indicators area)', () => {
    // Default content is in the always-visible area
    expect(fixture.nativeElement.querySelector('.projected-content')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Projected content');
  });
});

@Component({
  imports: [SectionCardComponent],
  template: `
    <app-section-card sectionName="Toggle Test" sectionType="application" [indicatorCount]="0" (toggleCollapse)="collapseCount = collapseCount + 1">
      <button toggle class="test-toggle" (click)="toggleCount = toggleCount + 1">Toggle</button>
    </app-section-card>
  `,
})
class ToggleHostComponent {
  toggleCount = 0;
  collapseCount = 0;
}

describe('SectionCardComponent (toggle keyboard isolation)', () => {
  let fixture: ComponentFixture<ToggleHostComponent>;
  let host: ToggleHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not trigger expand/collapse when Enter is pressed on projected toggle', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.test-toggle') as HTMLElement;
    toggleBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.collapseCount).toBe(0);
  });

  it('should not trigger expand/collapse when Space is pressed on projected toggle', () => {
    const toggleBtn = fixture.nativeElement.querySelector('.test-toggle') as HTMLElement;
    toggleBtn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(host.collapseCount).toBe(0);
  });
});
