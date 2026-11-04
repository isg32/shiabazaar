/**
 * Instant feedback for /admin, /desk and /dashboard navigations: shown inside
 * the staff shell the moment a sidebar link is clicked, while the server renders
 * the page. Each area's `loading.tsx` renders this.
 */
export default function StaffLoading() {
  return (
    <div className="px-8 py-8" role="status" aria-label="Loading">
      <div className="h-7 w-48 rounded-md bg-surface-dark-elevated animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-dark-elevated animate-pulse" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-surface-dark-elevated animate-pulse" />
    </div>
  );
}
