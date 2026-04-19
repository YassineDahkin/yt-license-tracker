export default function AlertsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-24 bg-gray-200 rounded" />
      <div className="border rounded-lg divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-6 py-4">
            <div className="h-5 w-5 bg-gray-200 rounded-full mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
            <div className="h-3 w-12 bg-gray-100 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
