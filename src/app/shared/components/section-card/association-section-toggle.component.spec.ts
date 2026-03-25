import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssociationSectionToggleComponent } from './association-section-toggle.component';

describe('AssociationSectionToggleComponent', () => {
  let component: AssociationSectionToggleComponent;
  let fixture: ComponentFixture<AssociationSectionToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssociationSectionToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssociationSectionToggleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should emit toggle on click', () => {
    fixture.detectChanges();
    let toggled = false;
    component.toggled.subscribe(() => (toggled = true));

    const btn = fixture.nativeElement.querySelector('button');
    btn.click();

    expect(toggled).toBe(true);
  });

  it('should disable button when isPending', () => {
    fixture.componentRef.setInput('isPending', true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should have aria-checked matching enabled state', () => {
    fixture.componentRef.setInput('enabled', true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-checked')).toBe('true');
  });
});
