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
  private readonly authService = inject(AuthService);

  readonly userName = this.authService.userName;
  readonly userInitials = this.authService.userInitials;
  readonly LogOut = LogOut;

  readonly configItems: NavItem[] = [
    { label: 'Programmes de financement', route: '/funding-programs', icon: Landmark },
    { label: 'Thèmes d\'action', route: '/action-themes', icon: Tags },
    { label: 'Modèles d\'action', route: '/action-models', icon: FileText },
    { label: 'Modèles de dossier', route: '/folder-models', icon: FolderOpen },
    { label: 'Modèles d\'indicateur', route: '/indicator-models', icon: BarChart3 },
  ];

  readonly adminItems: NavItem[] = [
    { label: 'Communautés', route: '/communities', icon: Users },
    { label: 'Agents', route: '/agents', icon: UserCog },
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
