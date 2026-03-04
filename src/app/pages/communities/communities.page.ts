import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-communities-page',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
})
export class CommunitiesPage {}
