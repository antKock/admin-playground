import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

import { AgentsPage } from './agents.page';
import { AgentListComponent } from '@features/agents/ui/agent-list.component';
import { AgentDetailComponent } from '@features/agents/ui/agent-detail.component';
import { AgentFormComponent } from '@features/agents/ui/agent-form.component';

export const agentsRoutes: Routes = [
  {
    path: '',
    component: AgentsPage,
    children: [
      { path: '', component: AgentListComponent },
      { path: 'new', component: AgentFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: AgentDetailComponent },
      { path: ':id/edit', component: AgentFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
