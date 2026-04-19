import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export async function Header() {
  const session = await auth()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        {session?.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <span className="text-sm text-gray-700">{session?.user?.name}</span>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  )
}
