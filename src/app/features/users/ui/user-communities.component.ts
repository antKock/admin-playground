import { Component, inject, computed, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { CommunityRead } from '@domains/communities/community.models';
import { UserCommunityBrief } from '@domains/users/user.models';
import { UserFacade } from '../user.facade';

@Component({
  selector: 'app-user-communities',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mt-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-text-primary">Communautés</h2>
        <button
          class="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="togglePicker()"
        >
          {{ showPicker() ? 'Fermer' : '+ Assigner une communauté' }}
        </button>
      </div>

      @if (showPicker()) {
        <div class="mb-4 p-4 border border-border rounded-lg bg-surface-base">
          <input
            type="text"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand mb-3"
            placeholder="Rechercher des communautés par nom..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearch($event)"
          />
          @if (facade.isLoadingCommunities()) {
            <p class="text-sm text-text-secondary">Chargement des communautés...</p>
          } @else if (facade.communitiesError()) {
            <p class="text-sm text-error">{{ facade.communitiesError() }}</p>
          } @else if (filteredCommunities().length === 0) {
            <p class="text-sm text-text-secondary">Aucune communauté trouvée.</p>
          } @else {
            <div class="max-h-48 overflow-y-auto space-y-1">
              @for (community of filteredCommunities(); track community.id) {
                <div
                  class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-muted"
                  [class.opacity-50]="isAssigned(community)"
                >
                  <div>
                    <span class="text-sm text-text-primary">{{ community.name }}</span>
                    @if (isAssigned(community)) {
                      <span class="ml-2 text-xs px-1.5 py-0.5 bg-surface-muted rounded text-text-secondary">Déjà assignée</span>
                    }
                  </div>
                  @if (!isAssigned(community)) {
                    <button
                      class="text-xs px-2 py-1 bg-brand text-white rounded hover:bg-brand-hover transition-colors disabled:opacity-50"
                      [disabled]="facade.assignCommunityIsPending()"
                      (click)="onAssign(community)"
                    >
                      Assigner
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      @if (assignedCommunities().length === 0) {
        <p class="text-sm text-text-secondary">Aucune communauté assignée à cet utilisateur.</p>
      } @else {
        <div class="space-y-1">
          @for (community of assignedCommunities(); track community.id) {
            <div class="flex items-center justify-between px-3 py-2 border border-border rounded-lg">
              <a [routerLink]="['/communities', community.id]" target="_blank" rel="noopener noreferrer" class="text-sm text-brand hover:underline">{{ community.name }}</a>
              <button
                class="text-text-secondary hover:text-status-invalid transition-colors disabled:opacity-50"
                [disabled]="facade.removeCommunityIsPending()"
                (click)="onRemove(community)"
                title="Retirer la communauté"
              >
                &times;
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class UserCommunitiesComponent {
  readonly facade = inject(UserFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly el = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showPicker() && !this.el.nativeElement.contains(event.target)) {
      this.showPicker.set(false);
    }
  }

  readonly showPicker = signal(false);
  readonly searchQuery = signal('');

  readonly assignedCommunities = computed(() => {
    const user = this.facade.selectedItem();
    return user?.communities ?? [];
  });

  readonly filteredCommunities = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const communities = this.facade.allCommunities();
    if (!query) return communities;
    return communities.filter(c => c.name.toLowerCase().includes(query));
  });

  togglePicker(): void {
    const next = !this.showPicker();
    this.showPicker.set(next);
    if (next) {
      this.searchQuery.set('');
      this.facade.loadCommunities();
    }
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  isAssigned(community: CommunityRead): boolean {
    const user = this.facade.selectedItem();
    if (!user) return false;
    return user.communities?.some(c => c.id === community.id) ?? false;
  }

  onAssign(community: CommunityRead): void {
    const user = this.facade.selectedItem();
    if (!user) return;
    this.facade.assignCommunity(community.id, user.id);
  }

  async onRemove(community: UserCommunityBrief): Promise<void> {
    const user = this.facade.selectedItem();
    if (!user) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Retirer la communauté ?',
      message: `Ceci retirera <strong>${community.name}</strong> de cet utilisateur.`,
      confirmLabel: 'Retirer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    this.facade.removeCommunity(community.id, user.id);
  }
}
