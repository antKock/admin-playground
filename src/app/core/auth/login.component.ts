import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthStore } from '@domains/auth/auth.store';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  errorMessage = signal<string | null>(null);
  isSubmitting = signal(false);

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    try {
      await this.authStore.login(email, password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
      const navigated = await this.router.navigateByUrl(returnUrl);
      if (!navigated) {
        await this.router.navigateByUrl('/');
      }
      this.isSubmitting.set(false);
    } catch (err: unknown) {
      this.isSubmitting.set(false);
      this.loginForm.controls.password.reset();

      const httpErr = err as { status?: number };
      if (httpErr.status === 401 || httpErr.status === 403) {
        this.errorMessage.set('E-mail ou mot de passe invalide. Veuillez réessayer.');
      } else if (httpErr.status === 422) {
        this.errorMessage.set('Veuillez saisir une adresse e-mail valide.');
      } else if (httpErr.status === 0) {
        this.errorMessage.set('Impossible de se connecter au serveur. Vérifiez votre connexion.');
      } else {
        this.errorMessage.set('Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
      }
    }
  }
}
