import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUserGroup } from "@/lib/data"
import { Sidebar } from "@/components/Sidebar"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        redirect("/")
    }

    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session.user.id

    if (!userId) {
        redirect("/")
    }

    const group = await getUserGroup(userId)

    if (!group) {
        redirect("/onboarding")
    }

    // Check for recurring transactions logic
    const { checkRecurringTransactions } = await import("@/lib/recurring")
    await checkRecurringTransactions(group.id)

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
