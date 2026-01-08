const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mocking the recurring logic here since we can't easily import TS lib in JS script without ts-node
async function checkRecurringTransactions(groupId) {
    const now = new Date();
    console.log("Checking recurring for group:", groupId, "at", now);

    const templates = await prisma.recurringTemplate.findMany({
        where: {
            groupId,
            active: true,
            nextRun: { lte: now }
        }
    });

    console.log("Found templates due:", templates.length);

    for (const t of templates) {
        console.log("Processing:", t.name, t.nextRun);

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
            }
        });

        // Update Next Run
        const currentRun = new Date(t.nextRun);
        const targetMonth = currentRun.getMonth() + 1;
        const nextDate = new Date(currentRun.getFullYear(), targetMonth, 1);
        const originalDay = currentRun.getDate();
        const daysInTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(originalDay, daysInTargetMonth));

        await prisma.recurringTemplate.update({
            where: { id: t.id },
            data: { nextRun: nextDate }
        });

        console.log("Created PENDING for:", t.name, "New nextRun:", nextDate);
    }
}

async function main() {
    const membership = await prisma.groupMember.findFirst({
        include: { group: true }
    });

    if (!membership) {
        console.log("No memberships found");
        return;
    }

    await checkRecurringTransactions(membership.groupId);
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
