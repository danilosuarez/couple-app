import { prisma } from "./prisma"

export async function checkRecurringTransactions(groupId: string) {
    const now = new Date()

    // Find active templates where nextRun <= now
    console.log("Checking recurring for group:", groupId, "at", now);
    const templates = await prisma.recurringTemplate.findMany({
        where: {
            groupId,
            active: true,
            nextRun: { lte: now }
        }
    })
    console.log("Found templates due:", templates.length);

    for (const t of templates) {
        // Create PENDING transaction
        await prisma.transaction.create({
            data: {
                amount: t.amount || 0,
                description: `Recurring: ${t.name}`,
                categoryId: t.categoryId,
                payerId: t.payerId,
                date: now,
                type: "EXPENSE",
                status: "PENDING",
                groupId: t.groupId,
                createdBy: "SYSTEM",
                templateId: t.id,
                // Create default split? 
                // We'll leave splits empty for now, user confirms and adds splits? 
                // Or default 50/50?
                // Let's create default splits if possible? 
                // Getting members is hard here without fetching.
                // We will defer split creation to "Confirmation" step or do it if we fetch members.
                // Strategy: Create transaction with NO splits. Dashboard shows "Pending". 
                // User clicks "Confirm" -> Opens modal -> User saves (creates splits).
            }
        })

        // Create Alert
        await prisma.alert.create({
            data: {
                groupId: t.groupId,
                title: "Recurring Payment Due",
                body: `Payment for ${t.name} is due. Please confirm calculated amount.`,
            }
        })

        // Update nextRun (Monthly)
        // Safer logic: Add 1 month, clamp to last day of that month if needed.
        const currentRun = new Date(t.nextRun);
        const targetMonth = currentRun.getMonth() + 1;
        const nextDate = new Date(currentRun.getFullYear(), targetMonth, 1);

        // Original day of month
        // We really should store "preferredDayOfMonth" in the template to stick to it?
        // But for now, we infer from previous nextRun.
        const originalDay = currentRun.getDate();

        // Find last day of the target month
        const daysInTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();

        // Clamp
        nextDate.setDate(Math.min(originalDay, daysInTargetMonth));

        await prisma.recurringTemplate.update({
            where: { id: t.id },
            data: { nextRun: nextDate }
        })
    }
}
