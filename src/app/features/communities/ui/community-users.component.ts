import { Component, inject, computed, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserRead } from '@domains/communities/community.models';
import { CommunityFacade } from '../community.facade';

@Component({
  selector: 'app-community-users',
  imports: [FormsModule],
  templateUrl: './community-users.component.html',
})
export class CommunityUsersComponent {
  readonly facade = inject(CommunityFacade);
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

  readonly assignedUsers = this.facade.communityUsers;

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const users = this.facade.allUsers();
    if (!query) return users;
    return users.filter(u =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query),
    );
  });

  togglePicker(): void {
    const next = !this.showPicker();
    this.showPicker.set(next);
    if (next) {
      this.searchQuery.set('');
      this.facade.loadUsers();
    }
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  isAssigned(user: UserRead): boolean {
    const community = this.facade.selectedItem();
    if (!community) return false;
    return user.communities?.some(c => c.id === community.id) ?? false;
  }

  onAssign(user: UserRead): void {
    const community = this.facade.selectedItem();
    if (!community) return;
    this.facade.assignUser(community.id, user.id);
  }

  async onRemove(user: UserRead): Promise<void> {
    const community = this.facade.selectedItem();
    if (!community) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Retirer l\'utilisateur ?',
      message: `Ceci retirera <strong>${user.first_name} ${user.last_name}</strong> de cette communauté.`,
      confirmLabel: 'Retirer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    this.facade.removeUser(community.id, user.id);
  }
}
