import { Routes } from '@angular/router';

import { AgentsPage } from './agents.page';
import { AgentListComponent } from '@features/agents/agent-list.component';

export const agentsRoutes: Routes = [
  {
    path: '',
    component: AgentsPage,
    children: [
      { path: '', component: AgentListComponent },
    ],
  },
];
