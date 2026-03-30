import { Component, input, output, computed, linkedSignal } from '@angular/core';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';
import { SectionKey, SECTION_TYPE_MAP } from './section-card.models';

@Component({
  selector: 'app-section-card',
  imports: [LucideAngularModule],
  templateUrl: './section-card.component.html',
})
export class SectionCardComponent {
  readonly sectionName = input.required<string>();
  readonly sectionType = input.required<SectionKey>();
  readonly indicatorCount = input(0);
  readonly collapsed = input(true);

  readonly toggleCollapse = output<void>();

  protected readonly isCollapsed = linkedSignal(() => this.collapsed());
  protected readonly typeConfig = computed(() => SECTION_TYPE_MAP[this.sectionType()]);

  protected readonly ChevronDown = ChevronDown;

  onToggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
    this.toggleCollapse.emit();
  }
}
