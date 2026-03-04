import { Component, inject, computed, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { UserRead } from '@domains/communities/community.models';
import { CommunityFacade } from '../community.facade';

@Component({
  selector: 'app-community-users',
  imports: [FormsModule],
  template: `
    <div class="mt-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-text-primary">Users</h2>
        <button
          class="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="togglePicker()"
        >
          {{ showPicker() ? 'Close' : '+ Assign User' }}
        </button>
      </div>

      @if (showPicker()) {
        <div class="mb-4 p-4 border border-border rounded-lg bg-surface-base">
          <input
            type="text"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand mb-3"
            placeholder="Search users by name or email..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearch($event)"
          />
          @if (facade.isLoadingUsers()) {
            <p class="text-sm text-text-secondary">Loading users...</p>
          } @else if (filteredUsers().length === 0) {
            <p class="text-sm text-text-secondary">No users found.</p>
          } @else {
            <div class="max-h-48 overflow-y-auto space-y-1">
              @for (user of filteredUsers(); track user.id) {
                <div
                  class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-muted"
                  [class.opacity-50]="isAssigned(user)"
                >
                  <div>
                    <span class="text-sm text-text-primary">{{ user.first_name }} {{ user.last_name }}</span>
                    <span class="text-xs text-text-secondary ml-2">{{ user.email }}</span>
                    @if (isAssigned(user)) {
                      <span class="ml-2 text-xs px-1.5 py-0.5 bg-surface-muted rounded text-text-secondary">Already assigned</span>
                    }
                  </div>
                  @if (!isAssigned(user)) {
                    <button
                      class="text-xs px-2 py-1 bg-brand text-white rounded hover:bg-brand-hover transition-colors disabled:opacity-50"
                      [disabled]="facade.assignIsPending()"
                      (click)="onAssign(user)"
                    >
                      Assign
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      @if (assignedUsers().length === 0) {
        <p class="text-sm text-text-secondary">No users assigned to this community.</p>
      } @else {
        <div class="space-y-1">
          @for (user of assignedUsers(); track user.id) {
            <div class="flex items-center justify-between px-3 py-2 border border-border rounded-lg">
              <div>
                <span class="text-sm text-text-primary">{{ user.first_name }} {{ user.last_name }}</span>
                <span class="text-xs text-text-secondary ml-2">{{ user.email }}</span>
              </div>
              <button
                class="text-text-secondary hover:text-status-invalid transition-colors disabled:opacity-50"
                [disabled]="facade.removeIsPending()"
                (click)="onRemove(user)"
                title="Remove user"
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
      title: 'Remove user?',
      message: `This will remove <strong>${user.first_name} ${user.last_name}</strong> from this Community.`,
      confirmLabel: 'Remove',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    this.facade.removeUser(community.id, user.id);
  }
}
