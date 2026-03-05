import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ApiInspectorComponent } from './api-inspector.component';

@Component({
  standalone: true,
  imports: [ApiInspectorComponent],
  template: `
    <app-api-inspector
      [requestUrl]="requestUrl()"
      [responseBody]="responseBody()"
    />
  `,
})
class TestHostComponent {
  readonly requestUrl = signal<string | null>(null);
  readonly responseBody = signal<unknown>(null);
}

describe('ApiInspectorComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
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
    expect(text).toContain('No API data captured yet');
  });

  it('should display request URL', () => {
    host.requestUrl.set('https://api.example.com/items/1');
    fixture.detectChanges();
    openPanel();
    const text = getPanel().textContent;
    expect(text).toContain('https://api.example.com/items/1');
  });

  it('should display formatted JSON response', () => {
    host.responseBody.set({ id: 1, name: 'Test' });
    fixture.detectChanges();
    openPanel();
    const pre = getPanel().querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre!.textContent).toContain('"id": 1');
    expect(pre!.textContent).toContain('"name": "Test"');
  });

  it('should have a copy button', () => {
    host.responseBody.set({ data: 'test' });
    fixture.detectChanges();
    openPanel();
    const buttons = getPanel().querySelectorAll('button');
    const copyButton = Array.from(buttons).find(b => b.textContent?.includes('Copy'));
    expect(copyButton).toBeTruthy();
  });

  it('should show "Copied!" after clicking copy', async () => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    host.responseBody.set({ data: 'test' });
    fixture.detectChanges();
    openPanel();

    const buttons = getPanel().querySelectorAll('button');
    const copyButton = Array.from(buttons).find(b => b.textContent?.includes('Copy'))!;
    copyButton.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(copyButton.textContent).toContain('Copied!');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(copyButton.textContent).toContain('Copy');

    vi.useRealTimers();
  });

  it('should show "Failed" when clipboard write fails', async () => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    host.responseBody.set({ data: 'test' });
    fixture.detectChanges();
    openPanel();

    const buttons = getPanel().querySelectorAll('button');
    const copyButton = Array.from(buttons).find(b => b.textContent?.includes('Copy'))!;
    copyButton.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(copyButton.textContent).toContain('Failed');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(copyButton.textContent).toContain('Copy');

    vi.useRealTimers();
  });

  it('should display both URL and response when both are set', () => {
    host.requestUrl.set('https://api.example.com/items');
    host.responseBody.set({ items: [1, 2, 3] });
    fixture.detectChanges();
    openPanel();

    const text = getPanel().textContent;
    expect(text).toContain('Request URL');
    expect(text).toContain('Response Body');
    expect(text).toContain('https://api.example.com/items');
  });
});
