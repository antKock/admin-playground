import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-agents-page',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
})
export class AgentsPage {}
