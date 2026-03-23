import { Component, inject, computed, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { CommunityRead } from '@domains/communities/community.models';
import { UserCommunityBrief } from '@domains/users/user.models';
import { UserFacade } from '../user.facade';

@Component({
  selector: 'app-user-communities',
  imports: [FormsModule, RouterLink],
  templateUrl: './user-communities.component.html',
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
