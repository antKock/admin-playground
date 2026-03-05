import { Router } from '@angular/router';

export function navigateToLink(router: Router, event: { route: string; id: string }): void {
  router.navigate([event.route, event.id]);
}
