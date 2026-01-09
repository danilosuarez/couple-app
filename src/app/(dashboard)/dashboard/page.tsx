import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGoals, getTransactions, getUserGroup } from "@/lib/data"
import { getAccounts } from "@/app/actions/accounts"
import { calculateBalanceBreakdown } from "@/lib/finance"
import Link from "next/link"
import { Plus, Wallet, TrendingUp } from "lucide-react"
import { redirect } from "next/navigation"
import DashboardClient from "@/components/DashboardClient"
import BalanceCard from "@/components/BalanceCard"
import RecurringDueCard from "@/components/RecurringDueCard"
import PendingRecurring from "@/components/PendingRecurring"
import { labels } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    const userName = session?.user?.name || "User";

    if (!userId) redirect("/")

    const group = await getUserGroup(userId)
    if (!group) redirect("/onboarding")

    const transactions = await getTransactions(group.id)
    const goals = await getGoals(group.id)
    const accounts = await getAccounts() // Fetch user's accounts

    const { balance, breakdown } = calculateBalanceBreakdown(userId, transactions)

    // Calculate Net Worth (Sum of all account balances)
    const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    // Recent transactions (top 5)
    const recentTransactions = transactions.slice(0, 5)

    // Total spent this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const totalSpent = transactions
        .filter(t => t.type === 'EXPENSE' && t.date >= startOfMonth && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0)

    // Pending Transactions (Drafts/Pending)
    const pendingTransactions = await prisma.transaction.findMany({
        where: {
            groupId: group.id,
            status: "PENDING"
        },
        include: { category: true },
        orderBy: { date: 'asc' }
    })

    // Pending Recurring Transactions (Templates due today or past)
    const dueRecurring = await prisma.recurringTemplate.findMany({
        where: {
            groupId: group.id,
            active: true,
            nextRun: { lte: new Date() }
        },
        include: { category: true }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {labels.dashboard.summary}
                </h1>
                <div className="flex gap-2">
                    <Link
                        href="/accounts"
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors border border-gray-700"
                    >
                        <Wallet className="w-4 h-4" />
                        {labels.dashboard.accounts}
                    </Link>
                    <Link
                        href="/transactions/new"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {labels.dashboard.addTransaction}
                    </Link>
                </div>
            </div>

            {/* Recurring Due Card */}
            <RecurringDueCard templates={dueRecurring} />

            {/* Pending Transactions (Drafts/Pending) */}
            {pendingTransactions.length > 0 && <PendingRecurring transactions={pendingTransactions} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Net Worth Card (NEW) */}
                <div className="bg-gradient-to-br from-emerald-900/50 to-gray-900 p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <TrendingUp className="w-24 h-24 text-emerald-400" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-emerald-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> {labels.dashboard.netWorth}
                        </h3>
                        <div className="mt-2 text-3xl font-bold text-white">
                            ${netWorth.toLocaleString()} <span className="text-sm font-normal text-gray-400">COP</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Total en {accounts.length} cuentas conectadas</p>
                    </div>
                </div>

                {/* Balance Card (Splitwise Style) */}
                <BalanceCard balance={balance} breakdown={breakdown} />

                {/* Total Spent Card */}
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{labels.dashboard.totalSpentMonth}</h3>
                    <div className="mt-2 text-3xl font-bold text-white">
                        ${totalSpent.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Gastos compartidos en {now.toLocaleString('es-ES', { month: 'long' })}</p>
                </div>
            </div>

            {/* Goals Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">{labels.dashboard.activeGoals}</h3>
                    <div className="space-y-4">
                        {goals.length === 0 ? (
                            <p className="text-gray-500 text-sm">Aún no hay metas activas.</p>
                        ) : (
                            goals.slice(0, 3).map(g => (
                                <div key={g.id}>
                                    <div className="flex justify-between text-sm mb-1 text-gray-300">
                                        <span>{g.name}</span>
                                        <span>{Math.round((g.currentAmount / g.targetAmount) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div
                                            className="bg-purple-500 h-2 rounded-full"
                                            style={{ width: `${Math.min(100, (g.currentAmount / g.targetAmount) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                        {goals.length > 3 && <p className="text-xs text-center text-gray-500">+{goals.length - 3} metas más</p>}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">{labels.dashboard.recentActivity}</h2>
                <DashboardClient
                    transactions={recentTransactions}
                    userId={userId}
                    userName={userName}
                />
            </div>
        </div>
    )
}
