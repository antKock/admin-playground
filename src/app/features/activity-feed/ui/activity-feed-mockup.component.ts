import { Component, signal, computed } from '@angular/core';
import { LucideAngularModule, Eye, GitCompareArrows, ChevronDown, ChevronUp } from 'lucide-angular';

/**
 * STATIC MOCKUP — Design reference for the Activity page redesign.
 * Route: /activity/mockup
 * No API calls, no stores. Pure HTML/Tailwind with hardcoded French sample data.
 * Dev should wire up real data following this exact visual structure.
 */

type ObjectScope = 'admin' | 'user';

interface MockActivity {
  id: string;
  userName: string;
  time: string;
  action: 'create' | 'update' | 'delete';
  entityName: string;
  entityType: string;
  changesSummary?: string;
  children?: { label: string; count: number }[];
  isOwnAction?: boolean;
}

interface MockDayGroup {
  label: string;
  activities: MockActivity[];
}

const ADMIN_DATA: MockDayGroup[] = [
  {
    label: "Aujourd'hui",
    activities: [
      {
        id: '1',
        userName: 'Marie Lefèvre',
        time: '14:32',
        action: 'update',
        entityType: 'Programme',
        entityName: 'Programme Azur Rénovation',
        changesSummary: 'description, date_fin modifiés',
      },
      {
        id: '2',
        userName: 'Pierre Martin',
        time: '14:10',
        action: 'create',
        entityType: 'Thème',
        entityName: 'Mobilité Durable',
      },
      {
        id: '3',
        userName: 'Vous',
        time: '12:45',
        action: 'update',
        entityType: 'Modèle d\'indicateur',
        entityName: 'Consommation énergétique (kWh/m²)',
        changesSummary: 'unité, description modifiés',
        isOwnAction: true,
      },
      {
        id: '4',
        userName: 'Marie Lefèvre',
        time: '10:20',
        action: 'update',
        entityType: 'Modèle d\'action',
        entityName: 'Isolation Thermique Extérieure',
        changesSummary: 'nom modifié',
      },
      {
        id: '5',
        userName: 'Pierre Martin',
        time: '09:55',
        action: 'create',
        entityType: 'Communauté',
        entityName: 'CC du Pays de Bray',
      },
    ],
  },
  {
    label: 'Hier',
    activities: [
      {
        id: '6',
        userName: 'Marie Lefèvre',
        time: '16:30',
        action: 'update',
        entityType: 'Modèle de dossier',
        entityName: 'Dossier Rénovation Globale',
        changesSummary: 'description modifiée',
      },
      {
        id: '7',
        userName: 'Vous',
        time: '15:00',
        action: 'delete',
        entityType: 'Utilisateur',
        entityName: 'Jean Dupont',
        isOwnAction: true,
      },
    ],
  },
  {
    label: 'Lundi 10 mars',
    activities: [
      {
        id: '8',
        userName: 'Pierre Martin',
        time: '11:15',
        action: 'create',
        entityType: 'Programme',
        entityName: 'Programme Transition Écologique 2026',
      },
      {
        id: '9',
        userName: 'Marie Lefèvre',
        time: '09:45',
        action: 'update',
        entityType: 'Thème',
        entityName: 'Biodiversité',
        changesSummary: 'statut publié',
      },
    ],
  },
];

const USER_DATA: MockDayGroup[] = [
  {
    label: "Aujourd'hui",
    activities: [
      {
        id: 'u1',
        userName: 'Agent Dupont',
        time: '11:20',
        action: 'update',
        entityType: 'Action',
        entityName: 'Rénovation Bâtiment A — Lycée Voltaire',
        children: [
          { label: 'indicateurs modifiés', count: 3 },
          { label: 'commentaire ajouté', count: 1 },
        ],
      },
      {
        id: 'u2',
        userName: 'Agent Bernard',
        time: '10:45',
        action: 'create',
        entityType: 'Dossier',
        entityName: 'Dossier Rénovation — CC du Pays de Bray',
      },
      {
        id: 'u3',
        userName: 'Agent Dupont',
        time: '09:30',
        action: 'update',
        entityType: 'Action',
        entityName: 'Installation Panneaux Solaires — École Pasteur',
        children: [
          { label: 'indicateur modifié', count: 1 },
        ],
      },
    ],
  },
  {
    label: 'Hier',
    activities: [
      {
        id: 'u4',
        userName: 'Agent Moreau',
        time: '14:15',
        action: 'update',
        entityType: 'Bâtiment',
        entityName: 'Mairie de Forges-les-Eaux',
        changesSummary: 'adresse corrigée',
      },
      {
        id: 'u5',
        userName: 'Agent Bernard',
        time: '11:00',
        action: 'create',
        entityType: 'Agent',
        entityName: 'Sophie Leclerc',
      },
    ],
  },
];

// "Last visit" separator is placed after activity id '2' in admin, after 'u1' in user
const LAST_VISIT_AFTER_ADMIN = '2';
const LAST_VISIT_AFTER_USER = 'u1';
const LAST_VISIT_LABEL = '10 mars à 16:45';

@Component({
  selector: 'app-activity-feed-mockup',
  imports: [LucideAngularModule],
  template: `
    <div class="p-6 max-w-4xl">
      <h1 class="text-2xl font-bold text-text-primary mb-6">Activité</h1>

      <!-- Controls bar -->
      <div class="flex items-center justify-between mb-6">
        <!-- Scope pill toggle -->
        <div class="flex gap-1 bg-surface-muted rounded-lg p-1">
          <button
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
            [class]="scope() === 'admin'
              ? 'bg-surface-base text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'"
            (click)="scope.set('admin')"
          >
            Administration
          </button>
          <button
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
            [class]="scope() === 'user'
              ? 'bg-surface-base text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'"
            (click)="scope.set('user')"
          >
            Utilisateurs
          </button>
        </div>

        <!-- Hide my actions toggle -->
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <div
            class="relative w-9 h-5 rounded-full transition-colors"
            [class]="hideOwnActions() ? 'bg-brand' : 'bg-surface-mid'"
            (click)="hideOwnActions.set(!hideOwnActions())"
          >
            <div
              class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              [class]="hideOwnActions() ? 'translate-x-4' : 'translate-x-0.5'"
            ></div>
          </div>
          <span class="text-sm text-text-secondary">Masquer mes actions</span>
        </label>
      </div>

      <!-- Timeline -->
      <div class="space-y-6">
        @for (group of visibleData(); track group.label) {
          <!-- Day header -->
          <div>
            <h2 class="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
              {{ group.label }}
            </h2>

            <div class="space-y-2">
              @for (activity of group.activities; track activity.id) {
                <!-- Activity card -->
                <div
                  class="group relative border rounded-lg px-4 py-3 transition-colors"
                  [class]="activity.isOwnAction
                    ? 'border-border/50 bg-surface-subtle opacity-60'
                    : 'border-border bg-surface-base hover:bg-surface-table-row-hover'"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <!-- Top line: user + time -->
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-semibold text-text-primary">
                          {{ activity.userName }}
                        </span>
                        <span class="text-xs text-text-tertiary">
                          {{ activity.time }}
                        </span>
                      </div>

                      <!-- Action + entity -->
                      <div class="flex items-center gap-2">
                        <span
                          class="inline-flex px-1.5 py-0.5 text-xs font-medium rounded"
                          [class]="actionBadgeClass(activity.action)"
                        >
                          {{ actionLabel(activity.action) }}
                        </span>
                        <span class="text-xs text-text-tertiary">
                          {{ activity.entityType }}
                        </span>
                        <span class="text-sm text-text-primary font-medium truncate">
                          {{ activity.entityName }}
                        </span>
                      </div>

                      <!-- Changes summary -->
                      @if (activity.changesSummary) {
                        <p class="text-xs text-text-secondary mt-1 ml-0.5">
                          {{ activity.changesSummary }}
                        </p>
                      }

                      <!-- Child rollups (indicator instances, etc.) -->
                      @if (activity.children?.length) {
                        <div class="mt-1.5 ml-3 border-l-2 border-border/60 pl-3 space-y-0.5">
                          @for (child of activity.children; track child.label) {
                            <p class="text-xs text-text-secondary">
                              <span class="text-text-tertiary">└</span>
                              {{ child.count }} {{ child.label }}
                            </p>
                          }
                        </div>
                      }
                    </div>

                    <!-- Quick actions (visible on hover) -->
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                      <button
                        class="p-1.5 rounded-md hover:bg-surface-muted text-icon-secondary hover:text-icon-primary"
                        title="Voir l'état"
                      >
                        <lucide-icon [img]="Eye" [size]="15"></lucide-icon>
                      </button>
                      <button
                        class="p-1.5 rounded-md hover:bg-surface-muted text-icon-secondary hover:text-icon-primary"
                        title="Comparer"
                      >
                        <lucide-icon [img]="GitCompareArrows" [size]="15"></lucide-icon>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Last visit separator -->
                @if (isLastVisitAfter(activity.id)) {
                  <div class="flex items-center gap-3 py-3">
                    <div class="flex-1 border-t border-dashed border-brand/40"></div>
                    <span class="text-xs font-medium text-brand whitespace-nowrap">
                      Dernière visite · {{ lastVisitLabel }}
                    </span>
                    <div class="flex-1 border-t border-dashed border-brand/40"></div>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>

      <!-- Load more -->
      <div class="mt-6">
        <button
          class="px-4 py-2 text-sm border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
        >
          Charger plus
        </button>
      </div>
    </div>
  `,
})
export class ActivityFeedMockupComponent {
  readonly Eye = Eye;
  readonly GitCompareArrows = GitCompareArrows;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  readonly scope = signal<ObjectScope>('admin');
  readonly hideOwnActions = signal(false);
  readonly lastVisitLabel = LAST_VISIT_LABEL;

  readonly visibleData = computed(() => {
    const data = this.scope() === 'admin' ? ADMIN_DATA : USER_DATA;
    if (!this.hideOwnActions()) return data;

    return data
      .map((group) => ({
        ...group,
        activities: group.activities.filter((a) => !a.isOwnAction),
      }))
      .filter((group) => group.activities.length > 0);
  });

  isLastVisitAfter(activityId: string): boolean {
    const targetId = this.scope() === 'admin' ? LAST_VISIT_AFTER_ADMIN : LAST_VISIT_AFTER_USER;
    return activityId === targetId;
  }

  actionLabel(action: string): string {
    switch (action) {
      case 'create': return 'Création';
      case 'update': return 'Modification';
      case 'delete': return 'Suppression';
      default: return action;
    }
  }

  actionBadgeClass(action: string): string {
    switch (action) {
      case 'create': return 'bg-status-done/10 text-status-done';
      case 'update': return 'bg-brand/10 text-brand';
      case 'delete': return 'bg-status-invalid/10 text-status-invalid';
      default: return 'bg-surface-muted text-text-secondary';
    }
  }
}
