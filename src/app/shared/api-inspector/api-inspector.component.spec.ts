import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApiInspectorComponent } from './api-inspector.component';
import { ApiInspectorService } from './api-inspector.service';

describe('ApiInspectorComponent', () => {
  let fixture: ComponentFixture<ApiInspectorComponent>;
  let service: ApiInspectorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiInspectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApiInspectorComponent);
    service = TestBed.inject(ApiInspectorService);
    fixture.detectChanges();
  });

  function getPanel(): HTMLElement {
    return fixture.nativeElement.querySelector('.mt-8');
  }

  function getToggleButton(): HTMLButtonElement {
    return getPanel().querySelector('button')!;
  }

  function openPanel(): void {
    getToggleButton().click();
    fixture.detectChanges();
  }

  it('should be collapsed by default', () => {
    const content = getPanel().querySelector('.border-t');
    expect(content).toBeNull();
  });

  it('should toggle open on click', () => {
    openPanel();
    const content = getPanel().querySelector('.border-t');
    expect(content).toBeTruthy();
  });

  it('should toggle closed on second click', () => {
    openPanel();
    getToggleButton().click();
    fixture.detectChanges();
    const content = getPanel().querySelector('.border-t');
    expect(content).toBeNull();
  });

  it('should show empty state when no data', () => {
    openPanel();
    const text = getPanel().textContent;
    expect(text).toContain('Aucune donnée API capturée');
  });

  it('should display request URL', () => {
    service.capture('https://api.example.com/items/1', {});
    fixture.detectChanges();
    openPanel();
    const text = getPanel().textContent;
    expect(text).toContain('https://api.example.com/items/1');
  });

  it('should display formatted JSON response', () => {
    service.capture('/api/test', { id: 1, name: 'Test' });
    fixture.detectChanges();
    openPanel();
    const pre = getPanel().querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre!.textContent).toContain('"id": 1');
    expect(pre!.textContent).toContain('"name": "Test"');
  });

  it('should have a copy button', () => {
    service.capture('/api/test', { data: 'test' });
    fixture.detectChanges();
    openPanel();
    const buttons = getPanel().querySelectorAll('button');
    const copyButton = Array.from(buttons).find(b => b.textContent?.includes('Copier'));
    expect(copyButton).toBeTruthy();
  });

  it('should display both URL and response when both are set', () => {
    service.capture('https://api.example.com/items', { items: [1, 2, 3] });
    fixture.detectChanges();
    openPanel();

    const text = getPanel().textContent;
    expect(text).toContain('URL de la requête');
    expect(text).toContain('Corps de la réponse');
    expect(text).toContain('https://api.example.com/items');
  });
});
