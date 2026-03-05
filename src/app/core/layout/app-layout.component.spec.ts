import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AppLayoutComponent } from './app-layout.component';
import { AuthService } from '@app/core/auth/auth.service';

describe('AppLayoutComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render 7 navigation items', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const navItems = compiled.querySelectorAll('.nav-item');
    expect(navItems.length).toBe(7);
  });

  it('should render section labels for Configuration and Administration', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = compiled.querySelectorAll('.nav-section-label');
    expect(labels.length).toBe(2);
    expect(labels[0].textContent).toContain('Configuration');
    expect(labels[1].textContent).toContain('Administration');
  });

  it('should render user avatar in header', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const avatar = compiled.querySelector('.user-avatar');
    expect(avatar).toBeTruthy();
  });

  it('should render sidebar with navigation landmark', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector('nav[aria-label="Main navigation"]');
    expect(nav).toBeTruthy();
  });

  it('should render logout button', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutBtn = compiled.querySelector('button');
    expect(logoutBtn?.textContent).toContain('Déconnexion');
  });

  it('should render skip-to-content link', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector('.skip-to-content');
    expect(skipLink).toBeTruthy();
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
  });

  it('should render main content area with id', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const main = compiled.querySelector('#main-content');
    expect(main).toBeTruthy();
    expect(main?.tagName.toLowerCase()).toBe('main');
  });

  it('should call AuthService.logout on logout click', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    const authService = TestBed.inject(AuthService);
    const spy = vi.spyOn(authService, 'logout');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutBtn = compiled.querySelector('button') as HTMLButtonElement;
    logoutBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should render navigation items as keyboard-navigable links', async () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-item');
    links.forEach((link) => {
      expect(link.tagName.toLowerCase()).toBe('a');
    });
  });
});
