import { Component, input, output } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'app-toggle-row',
  imports: [LucideAngularModule],
  template: `
    <div class="toggle-row">
      <div class="toggle-row-left">
        @if (icon()) {
          <span class="toggle-icon">
            <lucide-icon [img]="icon()!" [size]="16" />
          </span>
        }
        <span class="toggle-label">{{ label() }}</span>
      </div>
      <div class="toggle-row-right">
        <button
          type="button"
          class="toggle"
          [class.on]="enabled()"
          (click)="toggle.emit(!enabled())"
        >
          <span class="toggle-knob"></span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toggle-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
    }
    .toggle-row-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toggle-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-icon-secondary, #8e8ea0);
    }
    .toggle-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }
    .toggle-row-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
      background: var(--color-stroke-medium, #d1d1d8);
      border-radius: 9999px;
      cursor: pointer;
      transition: background 0.2s;
      flex-shrink: 0;
      border: none;
      padding: 0;
    }
    .toggle.on {
      background: var(--color-brand, #1400cc);
    }
    .toggle-knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .toggle.on .toggle-knob {
      transform: translateX(20px);
    }
  `],
})
export class ToggleRowComponent {
  readonly label = input.required<string>();
  readonly icon = input<LucideIconData | null>(null);
  readonly enabled = input(false);
  readonly toggle = output<boolean>();
}
