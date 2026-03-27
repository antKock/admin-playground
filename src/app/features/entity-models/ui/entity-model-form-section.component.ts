import { Component, inject, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { EntityModelFacade } from '../entity-model.facade';

@Component({
  selector: 'app-entity-model-form-section',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-text-secondary mb-1">Nom</label>
        <input
          id="name"
          formControlName="name"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-text-secondary mb-1">Description</label>
        <textarea
          id="description"
          formControlName="description"
          rows="3"
          class="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        ></textarea>
      </div>
      <div class="flex justify-end">
        <button
          type="submit"
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
          [disabled]="form.invalid || form.pristine || facade.updateIsPending()"
        >
          {{ facade.updateIsPending() ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  `,
})
export class EntityModelFormSectionComponent implements HasUnsavedChanges {
  readonly facade = inject(EntityModelFacade);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (item) {
        this.form.patchValue({
          name: item.name,
          description: item.description ?? '',
        }, { emitEvent: false });
        this.form.markAsPristine();
      }
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  onSubmit(): void {
    if (this.form.invalid || this.form.pristine) return;
    const m = this.facade.selectedItem();
    if (!m) return;
    this.facade.update(m.entity_type, {
      name: this.form.value.name ?? undefined,
      description: this.form.value.description || null,
    });
  }
}
