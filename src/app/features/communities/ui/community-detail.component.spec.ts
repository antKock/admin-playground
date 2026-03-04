import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { CommunityDetailComponent } from './community-detail.component';

describe('CommunityDetailComponent', () => {
  let component: CommunityDetailComponent;
  let fixture: ComponentFixture<CommunityDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'comm-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call facade.select on init with route id', () => {
    const selectSpy = vi.spyOn(component.facade, 'select');
    component.ngOnInit();
    expect(selectSpy).toHaveBeenCalledWith('comm-1');
  });
});
