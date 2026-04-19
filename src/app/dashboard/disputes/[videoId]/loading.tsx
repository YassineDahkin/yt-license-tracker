export default function DisputeLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-64 bg-gray-100 rounded" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-3 bg-gray-100 rounded w-4/6" />
            </div>
            <div className="h-9 w-28 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
