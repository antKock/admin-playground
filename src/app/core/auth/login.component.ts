import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-surface-subtle">
      <div class="w-full max-w-md rounded-lg border border-stroke-standard bg-surface-base p-8 shadow-sm">
        <h1 class="mb-6 text-2xl font-semibold text-text-primary">Lauréat Admin</h1>

        @if (errorMessage()) {
          <div
            class="mb-4 rounded border border-stroke-error bg-surface-error px-4 py-3 text-sm text-text-error"
          >
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label for="email" class="mb-1 block text-sm font-medium text-text-primary">E-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full rounded border border-stroke-standard px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
              placeholder="E-mail"
            />
          </div>

          <div class="mb-6">
            <label for="password" class="mb-1 block text-sm font-medium text-text-primary"
              >Mot de passe</label
            >
            <input
              id="password"
              type="password"
              formControlName="password"
              class="w-full rounded border border-stroke-standard px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
              placeholder="Mot de passe"
            />
          </div>

          <button
            type="submit"
            [disabled]="loginForm.invalid || isSubmitting()"
            class="w-full rounded bg-surface-button-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-surface-button-hover disabled:bg-surface-button-primary-disabled disabled:text-text-disabled"
          >
            {{ isSubmitting() ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  errorMessage = signal<string | null>(null);
  isSubmitting = signal(false);

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.loginForm.controls.password.reset();

        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set('E-mail ou mot de passe invalide. Veuillez réessayer.');
        } else if (err.status === 422) {
          this.errorMessage.set('Veuillez saisir une adresse e-mail valide.');
        } else if (err.status === 0) {
          this.errorMessage.set('Impossible de se connecter au serveur. Vérifiez votre connexion.');
        } else {
          this.errorMessage.set('Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
        }
      },
    });
  }
}
