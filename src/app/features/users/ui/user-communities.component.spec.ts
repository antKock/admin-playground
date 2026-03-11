import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { UserCommunitiesComponent } from './user-communities.component';

describe('UserCommunitiesComponent', () => {
  let component: UserCommunitiesComponent;
  let fixture: ComponentFixture<UserCommunitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCommunitiesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCommunitiesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with picker closed', () => {
    expect(component.showPicker()).toBe(false);
  });

  it('should toggle picker and load communities', () => {
    const loadSpy = vi.spyOn(component.facade, 'loadCommunities');
    component.togglePicker();
    expect(component.showPicker()).toBe(true);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should close picker on second toggle', () => {
    component.togglePicker();
    component.togglePicker();
    expect(component.showPicker()).toBe(false);
  });
});
