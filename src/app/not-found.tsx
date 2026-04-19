import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <h2 className="text-xl font-semibold text-gray-900">Page not found</h2>
        <p className="text-sm text-gray-500">The page you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
