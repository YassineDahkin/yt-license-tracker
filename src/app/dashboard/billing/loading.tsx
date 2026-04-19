export default function BillingLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl">
      <div className="h-8 w-24 bg-gray-200 rounded" />
      <div className="border rounded-lg p-6 space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-xl p-6 space-y-3">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-3 bg-gray-100 rounded w-3/4" />
              ))}
            </div>
            <div className="h-9 w-full bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
