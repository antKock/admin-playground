import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, LucideIconData, Landmark, Tags, FileText, FolderOpen, Users, User, UserCog, BarChart3, LogOut, HelpCircle, Bell } from 'lucide-angular';

import { AuthService } from '@app/core/auth/auth.service';
import { OpenApiBannerComponent } from '@app/shared/components/openapi-banner/openapi-banner.component';
import { GlobalActivityFeedComponent } from '@features/activity-feed/ui/global-activity-feed.component';


interface NavItem {
  label: string;
  route: string;
  icon: LucideIconData;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, OpenApiBannerComponent, GlobalActivityFeedComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly userEmail = this.authService.userEmail;
  readonly LogOut = LogOut;
  readonly HelpCircle = HelpCircle;
  readonly Bell = Bell;
  readonly activityPanelOpen = signal(false);

  readonly configItems: NavItem[] = [
    { label: 'Programmes', route: '/funding-programs', icon: Landmark },
    { label: 'Thèmes d\'action', route: '/action-themes', icon: Tags },
    { label: 'Modèles d\'action', route: '/action-models', icon: FileText },
    { label: 'Modèles de dossier', route: '/folder-models', icon: FolderOpen },
    { label: 'Modèles d\'indicateur', route: '/indicator-models', icon: BarChart3 },
  ];

  readonly adminItems: NavItem[] = [
    { label: 'Communautés', route: '/communities', icon: Users },
    { label: 'Agents', route: '/agents', icon: UserCog },
    { label: 'Utilisateurs', route: '/users', icon: User },
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
