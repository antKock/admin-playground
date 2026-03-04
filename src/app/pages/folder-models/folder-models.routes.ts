import { Routes } from '@angular/router';

import { FolderModelsPage } from './folder-models.page';
import { FolderModelListComponent } from '@features/folder-models/ui/folder-model-list.component';
import { FolderModelDetailComponent } from '@features/folder-models/ui/folder-model-detail.component';
import { FolderModelFormComponent } from '@features/folder-models/ui/folder-model-form.component';

export const folderModelsRoutes: Routes = [
  {
    path: '',
    component: FolderModelsPage,
    children: [
      { path: '', component: FolderModelListComponent },
      { path: 'new', component: FolderModelFormComponent },
      { path: ':id', component: FolderModelDetailComponent },
      { path: ':id/edit', component: FolderModelFormComponent },
    ],
  },
];
