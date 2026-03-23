import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-save-bar',
  templateUrl: './save-bar.component.html',
})
export class SaveBarComponent {
  readonly count = input.required<number>();
  readonly saving = input(false);
  readonly save = output<void>();
  readonly discard = output<void>();
}
