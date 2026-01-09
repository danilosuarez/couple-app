
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

    // Logic to determine initial split state
    let assignedTo = "ALL";
    let customPercentages: Record<string, number> = {};

    if (transaction.splits.length > 0) {
        // Check if equal split
        const totalAmount = transaction.amount;
        const memberCount = transaction.splits.length;
        const equalShare = Math.round(totalAmount / memberCount);

        // Allow a small margin of error for rounding (e.g. +/- 5 pesos)
        const isRoughlyEqual = transaction.splits.every(s => Math.abs(s.amount - equalShare) < 10);

        if (isRoughlyEqual && memberCount === members.length) {
            assignedTo = "ALL";
        } else {
            // Check if 100% assigned to one person
            const fullPayer = transaction.splits.find(s => s.amount === totalAmount);
            if (fullPayer) {
                assignedTo = fullPayer.userId;
            } else {
                // Must be Custom
                assignedTo = "CUSTOM";
                transaction.splits.forEach(s => {
                    // Calculate percentage back from amount (or use stored percentage if available?)
                    // The schema has percentage Int?, so let's check if it's there
                    if (s.percentage) {
                        customPercentages[s.userId] = s.percentage;
                    } else {
                        // Infer
                        customPercentages[s.userId] = parseFloat(((s.amount / totalAmount) * 100).toFixed(1));
                    }
                });
            }
        }
    }

    const initialValues = {
        amount: transaction.amount,
        description: transaction.description,
        categoryId: transaction.categoryId,
        date: transaction.date.toISOString().split('T')[0],
        payerId: transaction.payerId,
        type: transaction.type,
        goalId: transaction.goalId || undefined,
        assignedTo,
        customPercentages
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
