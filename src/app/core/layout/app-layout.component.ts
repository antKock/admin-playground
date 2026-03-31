import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, LucideIconData, Landmark, Tags, FileText, FolderOpen, Users, User, BarChart3, LogOut, HelpCircle, Activity, MapPin, Building2, Layers } from 'lucide-angular';

import { AuthStore } from '@domains/auth/auth.store';
import { OpenApiBannerComponent } from '@app/shared/components/openapi-banner/openapi-banner.component';

interface NavItem {
  label: string;
  route: string;
  icon: LucideIconData;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, OpenApiBannerComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent {
  private readonly authStore = inject(AuthStore);

  readonly userEmail = this.authStore.userEmail;
  readonly LogOut = LogOut;
  readonly HelpCircle = HelpCircle;

  readonly objetItems: NavItem[] = [
    { label: 'Programmes', route: '/funding-programs', icon: Landmark },
    { label: 'Thèmes d\'action', route: '/action-themes', icon: Tags },
    { label: 'Utilisateurs', route: '/users', icon: User },
  ];

  readonly modelItems: NavItem[] = [
    { label: 'Indicateurs', route: '/indicator-models', icon: BarChart3 },
    { label: 'Actions', route: '/action-models', icon: FileText },
    { label: 'Dossiers', route: '/folder-models', icon: FolderOpen },
    { label: 'Entités', route: '/entity-models', icon: Layers },
  ];

  readonly debugItems: NavItem[] = [
    { label: 'Sites', route: '/sites', icon: MapPin },
    { label: 'Bâtiments', route: '/buildings', icon: Building2 },
    { label: 'Communautés', route: '/communities', icon: Users },
    { label: 'Activité', route: '/activity', icon: Activity },
  ];

  onLogout(): void {
    this.authStore.logout();
  }
}
