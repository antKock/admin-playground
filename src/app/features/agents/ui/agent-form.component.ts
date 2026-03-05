import { Component, inject, OnInit, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createAgentForm } from '@domains/agents/forms/agent.form';
import { AgentFacade } from '../agent.facade';

@Component({
  selector: 'app-agent-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  template: `
    <div class="p-6 max-w-2xl">
      @if (isEditMode) {
        <app-breadcrumb [items]="[
          { label: 'Agents', route: '/agents' },
          { label: agentDisplayName() || '...', route: '/agents/' + editId },
          { label: 'Modifier' }
        ]" />
      } @else {
        <app-breadcrumb [items]="[
          { label: 'Agents', route: '/agents' },
          { label: 'Nouvel agent' }
        ]" />
      }
      <h1 class="text-2xl font-bold text-text-primary mb-6">
        {{ formTitle }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="first_name" class="block text-sm font-medium text-text-primary mb-1">Prénom</label>
            <input
              id="first_name"
              formControlName="first_name"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label for="last_name" class="block text-sm font-medium text-text-primary mb-1">Nom de famille</label>
            <input
              id="last_name"
              formControlName="last_name"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="email" class="block text-sm font-medium text-text-primary mb-1">E-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
              [class.border-error]="showError('email')"
            />
            @if (showError('email')) {
              <p class="mt-1 text-sm text-error">Veuillez saisir une adresse e-mail valide.</p>
            }
          </div>
          <div>
            <label for="phone" class="block text-sm font-medium text-text-primary mb-1">Téléphone</label>
            <input
              id="phone"
              formControlName="phone"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div>
          <label for="position" class="block text-sm font-medium text-text-primary mb-1">Poste</label>
          <input
            id="position"
            formControlName="position"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="agent_type" class="block text-sm font-medium text-text-primary mb-1">Type d'agent *</label>
            <select
              id="agent_type"
              formControlName="agent_type"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
              [class.border-error]="showError('agent_type')"
            >
              <option value="">Sélectionner un type d'agent...</option>
              <option value="energy_performance_advisor">Conseiller en performance énergétique</option>
              <option value="other">Autre</option>
            </select>
            @if (showError('agent_type')) {
              <p class="mt-1 text-sm text-error">Le type d'agent est obligatoire.</p>
            }
          </div>
          <div>
            <label for="community_id" class="block text-sm font-medium text-text-primary mb-1">Communauté *</label>
            @if (facade.communityLoading()) {
              <div class="w-full px-3 py-2 border border-border rounded-lg bg-surface-muted animate-pulse">
                <span class="text-text-secondary text-sm">Chargement des communautés...</span>
              </div>
            } @else {
              <select
                id="community_id"
                formControlName="community_id"
                class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
                [class.border-error]="showError('community_id')"
              >
                <option value="">Sélectionner une communauté...</option>
                @for (opt of facade.communityOptions(); track opt.id) {
                  <option [value]="opt.id">{{ opt.label }}</option>
                }
              </select>
            }
            @if (showError('community_id')) {
              <p class="mt-1 text-sm text-error">La communauté est obligatoire.</p>
            }
          </div>
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
export class AgentFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(AgentFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;

  get formTitle(): string {
    return this.isEditMode ? 'Modifier l\'agent' : 'Créer un agent';
  }

  readonly agentDisplayName = computed(() => {
    const a = this.facade.selectedItem();
    if (!a) return '';
    return [a.first_name, a.last_name].filter(Boolean).join(' ') || '—';
  });
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createAgentForm(this.fb);

  // effect() watches selectedItem signal — patches form when item loads in edit mode (formPatched guards against re-runs).
  private formPatched = false;

  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          first_name: item.first_name ?? null,
          last_name: item.last_name ?? null,
          email: item.email ?? null,
          phone: item.phone ?? null,
          position: item.position ?? null,
          agent_type: item.agent_type,
          community_id: item.community_id,
          public_comment: item.public_comment ?? null,
          internal_comment: item.internal_comment ?? null,
        });
      }
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editId;

    // Load communities for the selector
    this.facade.loadAssociationData();

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
      this.router.navigate(['/agents', this.editId]);
    } else {
      this.router.navigate(['/agents']);
    }
  }
}
