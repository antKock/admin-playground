import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-buildings-page',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
})
export class BuildingsPage {}
