import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-detail-page-layout',
  imports: [BreadcrumbComponent],
  templateUrl: './detail-page-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPageLayoutComponent {
  readonly breadcrumbs = input.required<BreadcrumbItem[]>();
  readonly isLoading = input(false);
}
