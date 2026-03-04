import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveBarComponent } from './save-bar.component';

describe('SaveBarComponent', () => {
  let component: SaveBarComponent;
  let fixture: ComponentFixture<SaveBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('count', 0);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when count is 0', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fixed')).toBeFalsy();
  });

  it('should render when count > 0', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('3 unsaved changes');
  });

  it('should show singular when count is 1', () => {
    fixture.componentRef.setInput('count', 1);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 unsaved change');
    expect(fixture.nativeElement.textContent).not.toContain('changes');
  });

  it('should emit save event on save click', () => {
    fixture.componentRef.setInput('count', 1);
    fixture.detectChanges();

    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click(); // Save is second button

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should emit discard event on discard click', () => {
    fixture.componentRef.setInput('count', 1);
    fixture.detectChanges();

    const discardSpy = vi.fn();
    component.discard.subscribe(discardSpy);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click(); // Discard is first button

    expect(discardSpy).toHaveBeenCalled();
  });
});
