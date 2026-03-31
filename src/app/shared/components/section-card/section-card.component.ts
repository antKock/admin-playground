import { Component, input, output, computed, linkedSignal } from '@angular/core';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';
import { ParamHintIconsComponent, ParamHints } from '../param-hint-icons/param-hint-icons.component';
import { SectionKey, SECTION_TYPE_MAP } from './section-card.models';

@Component({
  selector: 'app-section-card',
  imports: [LucideAngularModule, ParamHintIconsComponent],
  templateUrl: './section-card.component.html',
})
export class SectionCardComponent {
  readonly sectionName = input.required<string>();
  readonly sectionType = input.required<SectionKey>();
  readonly indicatorCount = input(0);
  readonly collapsed = input(true);
  readonly paramHints = input<ParamHints>();
  readonly disabled = input(false);

  readonly toggleCollapse = output<void>();

  protected readonly isCollapsed = linkedSignal(() => this.collapsed());
  protected readonly typeConfig = computed(() => SECTION_TYPE_MAP[this.sectionType()]);

  protected readonly ChevronDown = ChevronDown;

  onToggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
    this.toggleCollapse.emit();
  }
}
