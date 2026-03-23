import { Component, inject, OnInit, OnDestroy, computed, effect, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { FormPageLayoutComponent } from '@app/shared/components/layouts/form-page-layout.component';
import { BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createAgentForm } from '@domains/agents/forms/agent.form';
import { getAgentDisplayName } from '@shared/utils/agent-labels';
import { AgentFacade } from '../agent.facade';

@Component({
  selector: 'app-agent-form',
  imports: [ReactiveFormsModule, FormFieldComponent, FormPageLayoutComponent],
  templateUrl: './agent-form.component.html',
})
export class AgentFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
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

  readonly agentDisplayName = computed(() => getAgentDisplayName(this.facade.selectedItem()));
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createAgentForm(this.fb);

  readonly formBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (this.isEditMode) {
      return [
        { label: 'Agents', route: '/agents' },
        { label: this.agentDisplayName() || '...', route: '/agents/' + this.editId },
        { label: 'Modifier' },
      ];
    }
    return [
      { label: 'Agents', route: '/agents' },
      { label: 'Nouvel agent' },
    ];
  });

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

  ngOnDestroy(): void {
    this.facade.clearSelection();
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


  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    this.form.markAsPristine();

    if (this.isEditMode && this.editId) {
      this.facade.update(this.editId, raw);
    } else {
      this.facade.create(raw);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitting();
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/agents', this.editId]);
    } else {
      this.router.navigate(['/agents']);
    }
  }
}
