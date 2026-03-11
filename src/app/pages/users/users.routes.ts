import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';
import { UsersPage } from './users.page';
import { UserListComponent } from '@features/users/ui/user-list.component';
import { UserDetailComponent } from '@features/users/ui/user-detail.component';
import { UserFormComponent } from '@features/users/ui/user-form.component';

export const usersRoutes: Routes = [
  {
    path: '',
    component: UsersPage,
    children: [
      { path: '', component: UserListComponent },
      { path: 'new', component: UserFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: UserDetailComponent },
      { path: ':id/edit', component: UserFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
