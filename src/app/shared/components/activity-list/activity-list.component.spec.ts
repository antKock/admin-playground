import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';

import { ActivityListComponent } from './activity-list.component';

@Component({
  imports: [ActivityListComponent],
  template: '<app-activity-list entityType="ActionModel" [entityId]="entityId" />',
})
class TestHost {
  entityId = 'test-123';
}

describe('ActivityListComponent', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
  });

  it('should create', () => {
    fixture.detectChanges();
    const activityList = fixture.nativeElement.querySelector('app-activity-list');
    expect(activityList).toBeTruthy();
  });

  it('should display section header with beta badge', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading.textContent).toContain('Activité');
    const badge = heading.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('bêta');
  });
});
