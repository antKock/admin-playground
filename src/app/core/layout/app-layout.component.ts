import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, LucideIconData, Landmark, Tags, FileText, FolderOpen, Users, User, UserCog, BarChart3, LogOut, HelpCircle, Activity, MapPin, Building2 } from 'lucide-angular';

import { AuthStore } from '@domains/auth/auth.store';
import { OpenApiBannerComponent } from '@app/shared/components/openapi-banner/openapi-banner.component';
import { ApiInspectorComponent } from '@shared/api-inspector/api-inspector.component';


interface NavItem {
  label: string;
  route: string;
  icon: LucideIconData;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, OpenApiBannerComponent, ApiInspectorComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent {
  private readonly authStore = inject(AuthStore);

  readonly userEmail = this.authStore.userEmail;
  readonly LogOut = LogOut;
  readonly HelpCircle = HelpCircle;

  readonly configItems: NavItem[] = [
    { label: 'Programmes', route: '/funding-programs', icon: Landmark },
    { label: 'Thèmes d\'action', route: '/action-themes', icon: Tags },
    { label: 'Modèles d\'action', route: '/action-models', icon: FileText },
    { label: 'Modèles de dossier', route: '/folder-models', icon: FolderOpen },
    { label: 'Modèles d\'indicateur', route: '/indicator-models', icon: BarChart3 },
  ];

  readonly adminItems: NavItem[] = [
    { label: 'Sites', route: '/sites', icon: MapPin },
    { label: 'Bâtiments', route: '/buildings', icon: Building2 },
    { label: 'Communautés', route: '/communities', icon: Users },
    { label: 'Agents', route: '/agents', icon: UserCog },
    { label: 'Utilisateurs', route: '/users', icon: User },
    { label: 'Activité', route: '/activity', icon: Activity },
  ];

  onLogout(): void {
    this.authStore.logout();
  }
}
