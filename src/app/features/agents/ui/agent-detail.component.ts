import { Component, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { AgentFacade } from '../agent.facade';
import { AgentStatus } from '@domains/agents/agent.models';

@Component({
  selector: 'app-agent-detail',
  imports: [MetadataGridComponent, StatusBadgeComponent],
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
          <p class="text-error mb-4">{{ facade.detailError() }}</p>
          <button
            class="text-sm text-text-link hover:text-text-link-hover"
            (click)="router.navigate(['/agents'])"
          >
            &larr; Back to list
          </button>
        </div>
      } @else if (agent()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <button
              class="text-sm text-text-secondary hover:text-text-primary mb-2 inline-flex items-center gap-1"
              (click)="router.navigate(['/agents'])"
            >
              &larr; Back to list
            </button>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-text-primary">{{ displayName() }}</h1>
              <app-status-badge [status]="agent()!.status" />
            </div>
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
              Edit
            </button>
            <button
              class="px-4 py-2 bg-status-invalid text-white rounded-lg hover:opacity-90 transition-opacity"
              (click)="onDelete()"
            >
              Delete
            </button>
          </div>
        </div>

        <app-metadata-grid [fields]="fields()" (navigateToLinked)="router.navigate([$event])" />
      }
    </div>
  `,
})
export class AgentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(AgentFacade);
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

  readonly fields = computed<MetadataField[]>(() => {
    const a = this.agent();
    if (!a) return [];
    return [
      { label: 'Name', value: this.displayName(), type: 'text' as const },
      { label: 'Email', value: a.email ?? '—', type: 'text' as const },
      { label: 'Phone', value: a.phone ?? '—', type: 'text' as const },
      { label: 'Position', value: a.position ?? '—', type: 'text' as const },
      { label: 'Agent Type', value: this.agentTypeLabel(a.agent_type), type: 'text' as const },
      { label: 'Community', value: a.community?.name ?? '—', type: 'linked' as const, linkedRoute: `/communities/${a.community_id}` },
      { label: 'Public Comment', value: a.public_comment ?? '—', type: 'text' as const },
      { label: 'Internal Comment', value: a.internal_comment ?? '—', type: 'text' as const },
      { label: 'Created', value: a.created_at, type: 'text' as const },
      { label: 'Updated', value: a.updated_at, type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
    }
  }

  private readonly agentTypeLabels: Record<string, string> = {
    energy_performance_advisor: 'Energy Performance Advisor',
    other: 'Other',
  };

  agentTypeLabel(type: string): string {
    return this.agentTypeLabels[type] ?? type;
  }

  transitionLabel(status: AgentStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
      title: 'Change Agent Status',
      message: `Change status of '${name}' to '${label}'?`,
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
      title: 'Delete Agent?',
      message: `Are you sure you want to delete '${name}'? This will soft-delete the agent.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    this.facade.delete(a.id);
  }
}
