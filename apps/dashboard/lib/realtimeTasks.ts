export function subscribeToTaskUpdates(callback: (payload: unknown) => void) {
  // Supabase realtime subscription hook foundation
  // Production connection will attach to tasks table changes.
  return {
    unsubscribe() {
      callback;
    },
  };
}
