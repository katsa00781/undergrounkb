export type DataRefreshScope = 'all' | 'workouts' | 'appointments' | 'weights' | 'fms';

export const DATA_REFRESH_EVENT = 'app:data-refresh';

export function notifyDataChanged(scope: DataRefreshScope) {
  window.dispatchEvent(new CustomEvent(DATA_REFRESH_EVENT, { detail: { scope } }));
}

export function shouldHandleDataRefresh(requestedScopes: DataRefreshScope[], changedScope: DataRefreshScope) {
  return requestedScopes.includes('all') || changedScope === 'all' || requestedScopes.includes(changedScope);
}