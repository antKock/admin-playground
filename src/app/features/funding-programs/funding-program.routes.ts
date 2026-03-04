import { Routes } from '@angular/router';

import { FundingProgramListComponent } from './funding-program-list.component';
import { FundingProgramDetailComponent } from './funding-program-detail.component';
import { FundingProgramFormComponent } from './funding-program-form.component';

export const fundingProgramRoutes: Routes = [
  { path: '', component: FundingProgramListComponent },
  { path: 'new', component: FundingProgramFormComponent },
  { path: ':id', component: FundingProgramDetailComponent },
  { path: ':id/edit', component: FundingProgramFormComponent },
];
