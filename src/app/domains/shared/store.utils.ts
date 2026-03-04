import { patchState, WritableStateSource } from '@ngrx/signals';

/** Centralizes the `as never` cast required by patchState's strict typing on signalStoreFeature stores. */
export function patch(store: WritableStateSource<object>, state: Record<string, unknown>): void {
  patchState(store, state as never);
}
