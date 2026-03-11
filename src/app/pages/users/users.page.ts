import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-users-page',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
})
export class UsersPage {}
