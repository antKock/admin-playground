import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './core/auth/login.component';
import { AppLayoutComponent } from './core/layout/app-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'funding-programs', pathMatch: 'full' },
      {
        path: 'funding-programs',
        loadChildren: () =>
          import('./pages/funding-programs/funding-programs.routes').then(
            (m) => m.fundingProgramsRoutes,
          ),
      },
      {
        path: 'action-themes',
        loadChildren: () =>
          import('./pages/action-themes/action-themes.routes').then(
            (m) => m.actionThemesRoutes,
          ),
      },
      {
        path: 'action-models',
        loadChildren: () =>
          import('./pages/action-models/action-models.routes').then(
            (m) => m.actionModelsRoutes,
          ),
      },
      {
        path: 'folder-models',
        loadChildren: () =>
          import('./pages/folder-models/folder-models.routes').then(
            (m) => m.folderModelsRoutes,
          ),
      },
      {
        path: 'communities',
        loadChildren: () =>
          import('./pages/communities/communities.routes').then((m) => m.communitiesRoutes),
      },
      {
        path: 'agents',
        loadChildren: () =>
          import('./pages/agents/agents.routes').then((m) => m.agentsRoutes),
      },
      {
        path: 'indicator-models',
        loadChildren: () =>
          import('./pages/indicator-models/indicator-models.routes').then(
            (m) => m.indicatorModelsRoutes,
          ),
      },
    ],
  },
];
