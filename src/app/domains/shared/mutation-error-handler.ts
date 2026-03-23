import { ToastService } from '@shared/components/toast/toast.service';

interface HttpErrorShape {
  status?: number;
  error?: { detail?: unknown; message?: string };
  message?: string;
}

/**
 * Shared mutation error handler for all facades.
 * Maps HTTP error shapes to user-facing toast messages.
 */
export function handleMutationError(toast: ToastService, error: unknown, prefix?: string): void {
  const httpError = error as HttpErrorShape;
  if (httpError?.status === 409) {
    const reason = httpError.error?.detail || 'lié à d\'autres ressources';
    toast.error(`Conflit — ${typeof reason === 'string' ? reason : 'lié à d\'autres ressources'}`);
  } else if (httpError?.status === 422 && httpError.error?.detail) {
    toast.error('Veuillez corriger les erreurs de validation');
  } else {
    const message = httpError?.error?.detail || httpError?.error?.message || httpError?.message || 'Une erreur est survenue';
    const text = typeof message === 'string' ? message : 'Une erreur est survenue';
    toast.error(prefix ? `${prefix} — ${text}` : text);
  }
}
