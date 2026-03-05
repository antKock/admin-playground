import { Component, inject, OnInit, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createCommunityForm } from '@domains/communities/forms/community.form';
import { CommunityFacade } from '../community.facade';

@Component({
  selector: 'app-community-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  template: `
    <div class="p-6 max-w-2xl">
      @if (isEditMode) {
        <app-breadcrumb [items]="[
          { label: 'Communautés', route: '/communities' },
          { label: itemName() ?? '...', route: '/communities/' + editId },
          { label: 'Modifier' }
        ]" />
      } @else {
        <app-breadcrumb [items]="[
          { label: 'Communautés', route: '/communities' },
          { label: 'Nouvelle communauté' }
        ]" />
      }
      <h1 class="text-2xl font-bold text-text-primary mb-6">
        {{ isEditMode ? 'Modifier la communauté' : 'Créer une communauté' }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-text-primary mb-1">Nom *</label>
          <input
            id="name"
            formControlName="name"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('name')"
          />
          @if (showError('name')) {
            <p class="mt-1 text-sm text-error">Le nom est obligatoire.</p>
          }
        </div>

        <div>
          <label for="siret" class="block text-sm font-medium text-text-primary mb-1">SIRET *</label>
          <input
            id="siret"
            formControlName="siret"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('siret')"
          />
          @if (showError('siret')) {
            <p class="mt-1 text-sm text-error">Le SIRET doit contenir exactement 14 chiffres.</p>
          }
        </div>

        <div>
          <label for="public_comment" class="block text-sm font-medium text-text-primary mb-1">Commentaire public</label>
          <textarea
            id="public_comment"
            formControlName="public_comment"
            rows="3"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          ></textarea>
        </div>

        <div>
          <label for="internal_comment" class="block text-sm font-medium text-text-primary mb-1">Commentaire interne</label>
          <textarea
            id="internal_comment"
            formControlName="internal_comment"
            rows="3"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          ></textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="submit"
            class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
            (click)="goBack()"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CommunityFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(CommunityFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;
  readonly itemName = computed(() => this.facade.selectedItem()?.name);
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createCommunityForm(this.fb);

  // effect() watches selectedItem signal — patches form when item loads in edit mode (formPatched guards against re-runs).
  private formPatched = false;

  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          name: item.name,
          siret: item.siret,
          public_comment: item.public_comment ?? null,
          internal_comment: item.internal_comment ?? null,
        });
      }
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editId;

    if (this.isEditMode && this.editId) {
      this.facade.select(this.editId);
    }
  }

  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    const raw = this.form.getRawValue();

    if (this.isEditMode && this.editId) {
      this.facade.update(this.editId, raw);
    } else {
      this.facade.create(raw);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitting();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.form.dirty && !this.form.invalid && !this.submitting()) {
        this.onSubmit();
      }
    }
    if (event.key === 'Escape' && !this.isFormControlActive()) {
      this.goBack();
    }
  }

  private isFormControlActive(): boolean {
    const tag = document.activeElement?.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/communities', this.editId]);
    } else {
      this.router.navigate(['/communities']);
    }
  }
}
