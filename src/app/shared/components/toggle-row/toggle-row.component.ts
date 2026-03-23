import { Component, input, output } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'app-toggle-row',
  imports: [LucideAngularModule],
  templateUrl: './toggle-row.component.html',
  styleUrl: './toggle-row.component.css',
})
export class ToggleRowComponent {
  readonly label = input.required<string>();
  readonly icon = input<LucideIconData | null>(null);
  readonly enabled = input(false);
  readonly toggled = output<boolean>();
}
