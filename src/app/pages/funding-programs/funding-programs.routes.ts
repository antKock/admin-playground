import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';
import { FundingProgramsPage } from './funding-programs.page';
import { FundingProgramListComponent } from '@features/funding-programs/ui/funding-program-list.component';
import { FundingProgramDetailComponent } from '@features/funding-programs/ui/funding-program-detail.component';
import { FundingProgramFormComponent } from '@features/funding-programs/ui/funding-program-form.component';

export const fundingProgramsRoutes: Routes = [
  {
    path: '',
    component: FundingProgramsPage,
    children: [
      { path: '', component: FundingProgramListComponent },
      { path: 'new', component: FundingProgramFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: FundingProgramDetailComponent },
      { path: ':id/edit', component: FundingProgramFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
