import { Transaction, Split } from "@prisma/client"

type TransactionWithSplits = Transaction & { splits: Split[] }

/**
 * Calculates the balance for a specific user within a group.
 * Positive = User is owed money.
 * Negative = User owes money.
 */
export function calculateBalance(userId: string, transactions: TransactionWithSplits[]) {
    let balance = 0

    for (const t of transactions) {
        if (t.status !== 'COMPLETED') continue

        // If I paid, I am owed the amount I paid MINUS my share
        // If I didn't pay, I owe my share

        const mySplit = t.splits.find(s => s.userId === userId)
        const myShare = mySplit ? mySplit.amount : 0

        if (t.payerId === userId) {
            // I paid the full amount.
            // My contribution is myShare.
            // The rest (amount - myShare) is what I am owed.
            balance += (t.amount - myShare)
        } else {
            // Someone else paid.
            // I owe myShare.
            balance -= myShare
        }
    }

    return balance
}

export function calculateBalanceBreakdown(userId: string, transactions: TransactionWithSplits[]) {
    let balance = 0
    const breakdown: { id: string, description: string, date: Date, amount: number, type: 'OWE' | 'OWED' }[] = []

    for (const t of transactions) {
        if (t.status !== 'COMPLETED') continue
        // Exclude SAVINGS from settlement balance as requested
        if (t.type === 'SAVING') continue

        const mySplit = t.splits.find(s => s.userId === userId)
        const myShare = mySplit ? mySplit.amount : 0

        let impact = 0
        if (t.payerId === userId) {
            impact = (t.amount - myShare) // Positive (Owed to me)
        } else {
            impact = -myShare // Negative (I owe)
        }

        if (impact !== 0) {
            balance += impact
            breakdown.push({
                id: t.id,
                description: t.description,
                date: t.date,
                amount: Math.abs(impact),
                type: impact > 0 ? 'OWED' : 'OWE'
            })
        }
    }

    // Sort by date desc (newest first)
    // Transaction list is usually already sorted, but be safe
    breakdown.sort((a, b) => b.date.getTime() - a.date.getTime())

    return { balance, breakdown }
}
