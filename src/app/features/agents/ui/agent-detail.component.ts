import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { AgentFacade } from '../agent.facade';
import { AgentStatus } from '@domains/agents/agent.models';

@Component({
  selector: 'app-agent-detail',
  imports: [MetadataGridComponent, StatusBadgeComponent, ApiInspectorComponent, ActivityListComponent, BreadcrumbComponent],
  template: `
    <div class="p-6">
      @if (facade.isLoadingDetail()) {
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-surface-muted rounded w-1/3"></div>
          <div class="h-4 bg-surface-muted rounded w-1/4"></div>
          <div class="grid grid-cols-2 gap-4 mt-6">
            @for (i of skeletonFields; track $index) {
              <div class="space-y-2">
                <div class="h-3 bg-surface-muted rounded w-20"></div>
                <div class="h-4 bg-surface-muted rounded w-32"></div>
              </div>
            }
          </div>
        </div>
      } @else if (facade.detailError()) {
        <div class="text-center py-16">
          <app-breadcrumb [items]="[{ label: 'Agents', route: '/agents' }, { label: 'Erreur' }]" />
          <p class="text-error mb-4">{{ facade.detailError() }}</p>
        </div>
      } @else if (agent()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-text-primary">{{ displayName() }}</h1>
              <app-status-badge [status]="agent()!.status" />
            </div>
            <p class="text-xs text-text-tertiary mt-1">Mis à jour le {{ formatDate(agent()!.updated_at) }} · ID: {{ agent()!.id }}</p>
          </div>
          <div class="flex gap-2">
            @for (transition of allowedTransitions(); track transition.status) {
              <button
                class="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                [class]="transitionButtonClass(transition.status)"
                [disabled]="facade.changeStatusIsPending()"
                (click)="onChangeStatus(transition.status)"
              >
                {{ transitionLabel(transition.status) }}
              </button>
            }
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/agents', agent()!.id, 'edit'])"
            >
              Modifier
            </button>
            <button
              class="px-4 py-2 bg-status-invalid text-white rounded-lg hover:opacity-90 transition-opacity"
              (click)="onDelete()"
            >
              Supprimer
            </button>
          </div>
        </div>

        <app-metadata-grid [fields]="fields()" />

        <app-activity-list entityType="Agent" [entityId]="agent()!.id" />

        <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
      }
    </div>
  `,
})
export class AgentDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(AgentFacade);
  readonly inspectorService = inject(ApiInspectorService);
  readonly router = inject(Router);

  readonly agent = this.facade.selectedItem;

  readonly skeletonFields = Array(10).fill(0);

  readonly displayName = computed(() => {
    const a = this.agent();
    if (!a) return '';
    return [a.first_name, a.last_name].filter(Boolean).join(' ') || '—';
  });

  // Only show transitions where is_allowed === true (AC #14: hidden, not disabled)
  readonly allowedTransitions = computed(() =>
    (this.agent()?.next_possible_statuses ?? []).filter(t => t.is_allowed),
  );

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Agents', route: '/agents' },
    { label: this.displayName() || '...' },
  ]);

  readonly fields = computed<MetadataField[]>(() => {
    const a = this.agent();
    if (!a) return [];
    return [
      { label: 'Nom', value: this.displayName(), type: 'text' as const },
      { label: 'E-mail', value: a.email ?? '—', type: 'text' as const },
      { label: 'Téléphone', value: a.phone ?? '—', type: 'text' as const },
      { label: 'Poste', value: a.position ?? '—', type: 'text' as const },
      { label: 'Type d\'agent', value: this.agentTypeLabel(a.agent_type), type: 'text' as const },
      { label: 'Communauté', value: a.community?.name ?? '—', type: 'linked' as const, linkedRoute: `/communities/${a.community_id}` },
      { label: 'Commentaire public', value: a.public_comment ?? '—', type: 'text' as const },
      { label: 'Commentaire interne', value: a.internal_comment ?? '—', type: 'text' as const },
      { label: 'Créé le', value: a.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: a.updated_at, type: 'date' as const },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
    }
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  private readonly agentTypeLabels: Record<string, string> = {
    energy_performance_advisor: 'Conseiller en performance énergétique',
    other: 'Autre',
  };

  agentTypeLabel(type: string): string {
    return this.agentTypeLabels[type] ?? type;
  }

  private readonly statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    completed: 'Complété',
    deleted: 'Supprimé',
  };

  transitionLabel(status: AgentStatus): string {
    return this.statusLabels[status] ?? status;
  }

  transitionButtonClass(status: AgentStatus): string {
    if (status === 'deleted') return 'bg-status-invalid text-white hover:opacity-90';
    if (status === 'completed') return 'bg-brand text-white hover:bg-brand-hover';
    return 'border border-border text-text-primary hover:bg-surface-muted';
  }

  async onChangeStatus(newStatus: AgentStatus): Promise<void> {
    const a = this.agent();
    if (!a) return;

    const name = this.displayName();
    const label = this.transitionLabel(newStatus);
    const confirmed = await this.confirmDialog.confirm({
      title: 'Changer le statut de l\'agent',
      message: `Changer le statut de '${name}' en '${label}' ?`,
      confirmLabel: label,
      confirmVariant: newStatus === 'deleted' ? 'danger' : 'primary',
    });

    if (!confirmed) return;

    this.facade.changeStatus(a.id, newStatus);
  }

  async onDelete(): Promise<void> {
    const a = this.agent();
    if (!a) return;

    const name = this.displayName();
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer l\'agent ?',
      message: `Êtes-vous sûr de vouloir supprimer '${name}' ? L'agent sera supprimé (suppression douce).`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(a.id);
  }
}
