
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCategories, getGroupMembers, getGoals, getUserGroup } from "@/lib/data"
import { redirect } from "next/navigation"
import TransactionForm from "@/components/TransactionForm"
import { updateTransaction } from "@/app/actions"
import { labels } from "@/lib/i18n"

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    if (!userId) redirect("/")

    const group = await getUserGroup(userId)
    if (!group) redirect("/onboarding")

    const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
            splits: true
        }
    })

    if (!transaction || transaction.groupId !== group.id) {
        redirect("/dashboard")
    }

    const categories = await getCategories(group.id)
    const members = (await getGroupMembers(group.id)).map(m => ({
        id: m.userId,
        name: m.user.name
    }))
    const goals = await getGoals(group.id)

    const initialValues = {
        amount: transaction.amount,
        description: transaction.description,
        categoryId: transaction.categoryId,
        date: transaction.date.toISOString().split('T')[0],
        payerId: transaction.payerId,
        type: transaction.type,
        goalId: transaction.goalId || undefined
        // Splits handling is implicit in form via amount changes usually, but we haven't mapped splits back perfectly 
        // to `initialValues` in the form yet. 
        // `TransactionForm` applies initialValues to state on mount. 
        // It calls `updateSplits(initialValues.amount)` which resets splits to even. 
        // For MVP, resetting splits on edit is acceptable or we'd need deeper changes.
    }

    // Bind ID to action
    const updateAction = updateTransaction.bind(null, transaction.id)

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-white">Editar Transacción</h1>

            <TransactionForm
                members={members}
                categories={categories}
                userId={userId}
                goals={goals}
                initialValues={initialValues}
                action={updateAction}
            />
        </div>
    )
}
