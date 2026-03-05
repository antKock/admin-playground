import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, LucideIconData, Landmark, Tags, FileText, FolderOpen, Users, UserCog, BarChart3, LogOut } from 'lucide-angular';

import { AuthService } from '@app/core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: LucideIconData;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent {
  readonly authService = inject(AuthService);

  readonly LogOut = LogOut;

  readonly configItems: NavItem[] = [
    { label: 'Funding Programs', route: '/funding-programs', icon: Landmark },
    { label: 'Action Themes', route: '/action-themes', icon: Tags },
    { label: 'Action Models', route: '/action-models', icon: FileText },
    { label: 'Folder Models', route: '/folder-models', icon: FolderOpen },
    { label: 'Indicator Models', route: '/indicator-models', icon: BarChart3 },
  ];

  readonly adminItems: NavItem[] = [
    { label: 'Communities', route: '/communities', icon: Users },
    { label: 'Agents', route: '/agents', icon: UserCog },
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
