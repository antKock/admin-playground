import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-page-layout',
  imports: [RouterLink],
  templateUrl: './list-page-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageLayoutComponent {
  readonly title = input.required<string>();
  readonly createLabel = input('Créer');
  readonly createRoute = input<string>();
  readonly hasLoaded = input(false);
  readonly isEmpty = input(false);
  readonly hasMore = input(false);
  readonly emptyMessage = input('Aucun élément trouvé');

  readonly loadMore = output<void>();
}
