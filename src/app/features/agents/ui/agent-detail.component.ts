import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { AgentFacade } from '../agent.facade';
import { AgentStatus } from '@domains/agents/agent.models';
import { getAgentTypeLabel, getAgentDisplayName } from '@shared/utils/agent-labels';

@Component({
  selector: 'app-agent-detail',
  imports: [MetadataGridComponent, StatusBadgeComponent, ActivityListComponent, BreadcrumbComponent, DetailPageLayoutComponent],
  templateUrl: './agent-detail.component.html',
})
export class AgentDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(AgentFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly agent = this.facade.selectedItem;

  readonly displayName = computed(() => getAgentDisplayName(this.agent()));

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
      { label: 'Mis à jour le', value: a.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(a.last_updated_by_id), type: 'text' as const },
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

  agentTypeLabel(type: string): string {
    return getAgentTypeLabel(type);
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
