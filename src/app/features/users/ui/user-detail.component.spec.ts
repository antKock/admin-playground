import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { UserDetailComponent } from './user-detail.component';

describe('UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'user-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call facade.select on init with route id', () => {
    const selectSpy = vi.spyOn(component.facade, 'select');
    component.ngOnInit();
    expect(selectSpy).toHaveBeenCalledWith('user-1');
  });

  it('should call facade.clearSelection on destroy', () => {
    const clearSpy = vi.spyOn(component.facade, 'clearSelection');
    component.ngOnDestroy();
    expect(clearSpy).toHaveBeenCalled();
  });
});
