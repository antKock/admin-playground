import { Routes } from '@angular/router';

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
      { path: 'new', component: AgentFormComponent },
      { path: ':id', component: AgentDetailComponent },
      { path: ':id/edit', component: AgentFormComponent },
    ],
  },
];
