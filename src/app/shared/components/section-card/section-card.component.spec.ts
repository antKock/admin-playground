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

  it('should show "Paramètres" hint when collapsed', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Paramètres');
    expect(fixture.nativeElement.textContent).not.toContain('Masquer');
  });

  it('should show "Masquer" when expanded', () => {
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Masquer');
    expect(fixture.nativeElement.textContent).not.toContain('Paramètres');
  });

  it('should toggle collapse on header click', () => {
    fixture.detectChanges();

    let toggled = false;
    component.toggleCollapse.subscribe(() => (toggled = true));

    const header = fixture.nativeElement.querySelector('.cursor-pointer');
    header.click();
    fixture.detectChanges();

    expect(toggled).toBe(true);
  });

  it('should expand when collapsed and header is clicked', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();

    // "Paramètres" hint visible when collapsed
    expect(fixture.nativeElement.textContent).toContain('Paramètres');

    const header = fixture.nativeElement.querySelector('.cursor-pointer');
    header.click();
    fixture.detectChanges();

    // "Masquer" shown after expanding
    expect(fixture.nativeElement.textContent).toContain('Masquer');
    expect(fixture.nativeElement.textContent).not.toContain('Paramètres');
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

  it('should project content when expanded', () => {
    // Default is collapsed — expand by clicking header
    const header = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    header.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.projected-content')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Projected content');
  });
});
