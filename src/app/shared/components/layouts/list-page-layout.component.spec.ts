import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';

import { ListPageLayoutComponent } from './list-page-layout.component';

@Component({
  imports: [ListPageLayoutComponent],
  template: `
    <app-list-page-layout
      [title]="title"
      [createRoute]="createRoute"
      [createLabel]="createLabel"
      [hasLoaded]="hasLoaded"
      [isEmpty]="isEmpty"
      [hasMore]="hasMore"
      [emptyMessage]="emptyMessage"
      (loadMore)="loadMoreCalled = true"
    >
      <div filters>Filter content</div>
      <div table>Table content</div>
    </app-list-page-layout>
  `,
})
class TestHostComponent {
  title = 'Agents';
  createRoute = '/agents/new';
  createLabel = 'Créer un agent';
  hasLoaded = false;
  isEmpty = false;
  hasMore = false;
  emptyMessage = 'Aucun agent trouvé';
  loadMoreCalled = false;
}

describe('ListPageLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render the title', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Agents');
  });

  it('should render create button with route', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href]');
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Créer un agent');
  });

  it('should project filter and table content', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Filter content');
    expect(fixture.nativeElement.textContent).toContain('Table content');
  });

  it('should show empty message when hasLoaded and isEmpty', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.hasLoaded = true;
    fixture.componentInstance.isEmpty = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucun agent trouvé');
  });

  it('should not show empty message when not loaded', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.hasLoaded = false;
    fixture.componentInstance.isEmpty = true;
    fixture.detectChanges();
    const emptyMsg = fixture.nativeElement.querySelector('p.text-center');
    expect(emptyMsg).toBeNull();
  });

  it('should show load more button when hasMore', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.hasMore = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button.btn-secondary');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Charger plus');
  });

  it('should emit loadMore when button clicked', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.hasMore = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button.btn-secondary');
    btn.click();
    expect(fixture.componentInstance.loadMoreCalled).toBe(true);
  });
});
