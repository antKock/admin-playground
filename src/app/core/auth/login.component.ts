import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
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
        this.router.navigateByUrl(returnUrl).then((navigated) => {
          if (!navigated) {
            this.router.navigateByUrl('/');
          }
          this.isSubmitting.set(false);
        });
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
