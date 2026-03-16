import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CommunityListComponent } from './community-list.component';

describe('CommunityListComponent', () => {
  let component: CommunityListComponent;
  let fixture: ComponentFixture<CommunityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should define expected columns', () => {
    expect(component.columns.map(c => c.key)).toEqual([
      'name', 'siret', 'public_comment', 'last_updated_at',
    ]);
  });

  it('should call facade.load on init', () => {
    const loadSpy = vi.spyOn(component.facade, 'load');
    component.ngOnInit();
    expect(loadSpy).toHaveBeenCalled();
  });
});
