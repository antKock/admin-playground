import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ListPageLayoutComponent } from '@shared/components/layouts/list-page-layout.component';
import { EntityModelFacade } from '../entity-model.facade';
import { EntityModelCardData } from '../entity-model.store';

@Component({
  selector: 'app-entity-model-list',
  imports: [ListPageLayoutComponent],
  template: `
    <app-list-page-layout
      title="Modèles d'entités"
      [hasLoaded]="hasLoaded()"
      [isEmpty]="facade.items().length === 0"
      emptyMessage="Aucun modèle d'entité trouvé"
    >
      <div table class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (card of facade.entityModelCards(); track card.entityType) {
          <div
            role="button"
            tabindex="0"
            class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center gap-3"
            (click)="onCardClick(card)"
            (keydown.enter)="onCardClick(card)"
          >
            <span class="text-4xl">{{ card.icon }}</span>
            <span class="text-lg font-semibold text-gray-900">{{ card.label }}</span>
            <span class="text-sm text-gray-500">
              {{ card.indicatorCount }} indicateur{{ card.indicatorCount !== 1 ? 's' : '' }}
            </span>
          </div>
        }
      </div>
    </app-list-page-layout>
  `,
})
export class EntityModelListComponent implements OnInit {
  protected readonly facade = inject(EntityModelFacade);
  private readonly router = inject(Router);

  readonly hasLoaded = signal(false);

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  ngOnInit(): void {
    this.facade.loadAll();
  }

  onCardClick(card: EntityModelCardData): void {
    this.router.navigate(['/entity-models', card.entityType]);
  }
}
