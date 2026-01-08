import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTransactions, getUserGroup } from "@/lib/data"
import { redirect } from "next/navigation"
import DashboardClient from "@/components/DashboardClient"
import Link from "next/link"
import { Plus } from "lucide-react"
import { labels } from "@/lib/i18n"

export default async function TransactionsPage() {
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    const userName = session?.user?.name || "User";

    if (!userId) redirect("/")

    const group = await getUserGroup(userId)
    if (!group) redirect("/onboarding")

    // Fetch ALL transactions (or limit to something reasonable like 50 for now)
    // The getTransactions function likely returns recent ones first.
    const transactions = await getTransactions(group.id)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">
                    {labels.dashboard.seeAll} {labels.dashboard.accounts} ({transactions.length})
                </h1>
                <Link
                    href="/transactions/new"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {labels.dashboard.addTransaction}
                </Link>
            </div>

            <DashboardClient
                transactions={transactions}
                userId={userId}
                userName={userName}
            />
        </div>
    )
}
