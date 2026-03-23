import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { SaveBarComponent } from '@app/shared/components/save-bar/save-bar.component';

@Component({
  selector: 'app-form-page-layout',
  imports: [BreadcrumbComponent, SaveBarComponent],
  templateUrl: './form-page-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
})
export class FormPageLayoutComponent {
  readonly breadcrumbs = input.required<BreadcrumbItem[]>();
  readonly isSaving = input(false);
  readonly isDirty = input(false);
  readonly title = input.required<string>();

  readonly save = output<void>();
  readonly cancelClick = output<void>();

  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.isDirty()) {
        this.save.emit();
      }
      return;
    }
    if (event.key === 'Escape' && !this.isDirty()) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return;
      }
      this.cancelClick.emit();
    }
  }
}
