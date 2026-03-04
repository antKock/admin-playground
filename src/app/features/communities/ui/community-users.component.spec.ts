import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CommunityUsersComponent } from './community-users.component';

describe('CommunityUsersComponent', () => {
  let component: CommunityUsersComponent;
  let fixture: ComponentFixture<CommunityUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityUsersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityUsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with picker hidden', () => {
    expect(component.showPicker()).toBe(false);
  });

  it('should toggle picker visibility', () => {
    component.togglePicker();
    expect(component.showPicker()).toBe(true);

    component.togglePicker();
    expect(component.showPicker()).toBe(false);
  });

  it('should reset search query when opening picker', () => {
    component.onSearch('test');
    expect(component.searchQuery()).toBe('test');

    component.showPicker.set(false);
    component.togglePicker();
    expect(component.searchQuery()).toBe('');
  });

  it('should update search query on search', () => {
    component.onSearch('john');
    expect(component.searchQuery()).toBe('john');
  });
});
