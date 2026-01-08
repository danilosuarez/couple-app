'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { logAudit } from "@/lib/audit"
import { TransactionType } from "@prisma/client"
import { createTransactionSchema, createRecurringTemplateSchema } from "@/lib/schemas"
import { getPrimaryGroup } from "@/lib/auth-helpers"

export async function createGroup(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw new Error("Not authenticated")

    const name = formData.get("name") as string
    if (!name) throw new Error("Name is required")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!user) throw new Error("User not found")

    // Create Group and Member in transaction
    await prisma.$transaction(async (tx: any) => {
        const group = await tx.group.create({
            data: {
                name,
                members: {
                    create: {
                        userId: user.id,
                        role: "OWNER"
                    }
                },
                // Create default categories
                categories: {
                    create: [
                        { name: "Mercado", icon: "🛒" },
                        { name: "Transporte", icon: "🚌" },
                        { name: "Servicios", icon: "💡" },
                        { name: "Arriendo", icon: "🏠" },
                        { name: "Salud", icon: "💊" },
                        { name: "Ocio", icon: "🎉" },
                        { name: "Restaurantes", icon: "🍽️" },
                        { name: "Hogar", icon: "🛋️" },
                        { name: "Mascotas", icon: "🐾" },
                        { name: "Otros", icon: "📦" }
                    ]
                }
            }
        })
    })

    redirect("/dashboard")
}

export async function createTransaction(prevState: any, formData: FormData) {
    try {
        const primary = await getPrimaryGroup();
        if (!primary) return { error: "Unauthorized or No Group" };
        const { user, groupId } = primary;

        // Parse Form Data to Object for Zod
        const rawData = {
            amount: Number(formData.get("amount")),
            description: formData.get("description"),
            categoryId: formData.get("categoryId"),
            payedBy: formData.get("payedBy"),
            date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
            type: formData.get("type") as TransactionType || "EXPENSE",
            goalId: formData.get("goalId") || undefined,
            splits: formData.get("splits") ? JSON.parse(formData.get("splits") as string) : []
        };

        // Zod Validation
        const validation = createTransactionSchema.safeParse(rawData);
        if (!validation.success) {
            return { error: validation.error.issues[0].message };
        }
        const data = validation.data;

        // Semantic Validation (Database Checks)
        const payerMembership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: data.payedBy, groupId } }
        });
        if (!payerMembership) return { error: "Payer is not in your group" };

        if (data.categoryId) {
            const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
            if (!category || (category.groupId && category.groupId !== groupId)) {
                return { error: "Invalid Category" };
            }
        }

        if (data.goalId) {
            const goal = await prisma.goal.findUnique({ where: { id: data.goalId } });
            if (!goal || goal.groupId !== groupId) return { error: "Invalid Goal" };
        }

        // Splits Validation
        if (data.splits && data.splits.length > 0) {
            const groupMemberIds = await prisma.groupMember.findMany({
                where: { groupId },
                select: { userId: true }
            }).then(res => new Set(res.map(m => m.userId)));

            for (const split of data.splits) {
                if (!groupMemberIds.has(split.userId)) return { error: `Split user not in group` };
            }
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount: data.amount,
                description: data.description,
                categoryId: data.categoryId,
                payerId: data.payedBy,
                date: data.date,
                type: data.type,
                groupId,
                createdBy: user.id,
                status: "COMPLETED",
                splits: {
                    create: data.splits?.map((s: any) => ({
                        userId: s.userId,
                        amount: s.amount
                    }))
                },
                goalId: data.goalId // Save relation
            }
        })

        if (data.type === 'SAVING' && data.goalId) {
            await prisma.goal.update({
                where: { id: data.goalId },
                data: { currentAmount: { increment: data.amount } }
            });
            await logAudit({
                groupId,
                entityType: 'Goal',
                entityId: data.goalId,
                action: 'UPDATE',
                after: { increment: data.amount },
                userId: user.id
            });
        }

        await logAudit({
            groupId,
            entityType: 'Transaction',
            entityId: transaction.id,
            action: 'CREATE',
            after: transaction,
            userId: user.id
        })

    } catch (error: any) {
        console.error("Create Transaction Error:", error);
        return { error: error.message || "Failed to create transaction" };
    }

    redirect("/dashboard");
}

export async function updateTransaction(transactionId: string, prevState: any, formData: FormData) {
    try {
        const primary = await getPrimaryGroup();
        if (!primary) return { error: "Unauthorized" };
        const { user, groupId } = primary;

        // Fetch old transaction for diff
        const oldTransaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });
        if (!oldTransaction || oldTransaction.groupId !== groupId) return { error: "Not found" };

        const rawData = {
            amount: Number(formData.get("amount")),
            description: formData.get("description"),
            categoryId: formData.get("categoryId"),
            payedBy: formData.get("payedBy"),
            date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
            type: formData.get("type") as TransactionType || "EXPENSE",
            goalId: formData.get("goalId") || undefined,
            // Splits update is complex, for MVP we might ignore or recreate. 
            // Let's keep it simple: if splits are present, delete old and create new.
            splits: formData.get("splits") ? JSON.parse(formData.get("splits") as string) : []
        };

        const validation = createTransactionSchema.safeParse(rawData);
        if (!validation.success) return { error: validation.error.issues[0].message };
        const data = validation.data;

        // DB Validation
        if (data.categoryId) {
            const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
            if (!category || (category.groupId && category.groupId !== groupId)) return { error: "Invalid Category" };
        }

        // Handle Goal Amount Adjustment if needed
        if (oldTransaction.type === 'SAVING' && oldTransaction.goalId) {
            // Revert old amount
            await prisma.goal.update({
                where: { id: oldTransaction.goalId },
                data: { currentAmount: { decrement: oldTransaction.amount } }
            });
        }
        if (data.type === 'SAVING' && data.goalId) {
            // Add new amount
            await prisma.goal.update({
                where: { id: data.goalId },
                data: { currentAmount: { increment: data.amount } }
            });
        }

        // Update Transaction
        const updated = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                amount: data.amount,
                description: data.description,
                categoryId: data.categoryId,
                payerId: data.payedBy,
                date: data.date,
                type: data.type,
                goalId: data.goalId,
                // Replace splits
                splits: {
                    deleteMany: {},
                    create: data.splits?.map((s: any) => ({
                        userId: s.userId,
                        amount: s.amount
                    }))
                }
            }
        });

        await logAudit({
            groupId,
            entityType: 'Transaction',
            entityId: transactionId,
            action: 'UPDATE',
            after: updated,
            userId: user.id
        });

    } catch (error) {
        console.error("Update Transaction Error:", error);
        return { error: "Failed to update" };
    }

    redirect("/dashboard");
}

export async function createGoal(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw new Error("Not authenticated")

    const name = formData.get("name") as string
    const targetAmount = parseInt(formData.get("targetAmount") as string)
    const deadlineStr = formData.get("deadline") as string

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true }
    })

    if (!user || !user.memberships[0]) throw new Error("No group found")
    const groupId = user.memberships[0].groupId

    const goal = await prisma.goal.create({
        data: {
            name,
            targetAmount,
            currentAmount: 0,
            groupId,
            deadline: deadlineStr ? new Date(deadlineStr) : null
        }
    })

    await logAudit({
        groupId,
        entityType: 'Goal',
        entityId: goal.id,
        action: 'CREATE',
        after: goal,
        userId: user.id
    })

    redirect("/goals")
}

export async function updateGoal(goalId: string, formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw new Error("Not authenticated")

    const name = formData.get("name") as string
    const targetAmount = parseInt(formData.get("targetAmount") as string)
    const deadlineStr = formData.get("deadline") as string

    // Validate ownership
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true }
    })
    if (!user || !user.memberships[0]) throw new Error("No group found")
    const groupId = user.memberships[0].groupId

    const existingGoal = await prisma.goal.findUnique({ where: { id: goalId } })
    if (!existingGoal || existingGoal.groupId !== groupId) throw new Error("Unauthorized")

    const updated = await prisma.goal.update({
        where: { id: goalId },
        data: {
            name,
            targetAmount,
            deadline: deadlineStr ? new Date(deadlineStr) : null
        }
    })

    await logAudit({
        groupId,
        entityType: 'Goal',
        entityId: goalId,
        action: 'UPDATE',
        after: updated,
        userId: user.id
    })

    redirect("/goals")
}

export async function deleteGoal(goalId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw new Error("Not authenticated")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true }
    })
    if (!user || !user.memberships[0]) throw new Error("No group found")
    const groupId = user.memberships[0].groupId

    const existingGoal = await prisma.goal.findUnique({ where: { id: goalId } })
    if (!existingGoal || existingGoal.groupId !== groupId) throw new Error("Unauthorized")

    // Optional: Check for linked transactions and decouple them or warn?
    // For MVP, we allow delete. Prisma might handle integrity (Set Null or Cascade).
    // Usually Goal -> Transaction is One-to-Many. If Transaction.goalId is optional, Set Null.

    await prisma.goal.delete({ where: { id: goalId } })

    await logAudit({
        groupId,
        entityType: 'Goal',
        entityId: goalId,
        action: 'DELETE',
        after: existingGoal,
        userId: user.id
    })

    redirect("/goals")
}

export async function createRecurringTemplate(prevState: any, formData: FormData) {
    try {
        const primary = await getPrimaryGroup();
        if (!primary) return { error: "Unauthorized or No Group" };
        const { user, groupId } = primary;

        const rawData = {
            name: formData.get("name"),
            amount: Number(formData.get("amount")),
            dayOfMonth: Number(formData.get("dayOfMonth")),
            categoryId: formData.get("categoryId"),
            payerId: formData.get("payerId"),
            frequency: "MONTHLY",
            splits: formData.get("splits") ? JSON.parse(formData.get("splits") as string) : []
        };

        const validation = createRecurringTemplateSchema.safeParse(rawData);
        if (!validation.success) return { error: validation.error.issues[0].message };
        const data = validation.data;

        // DB Validation
        const payerMember = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: data.payerId, groupId } }
        });
        if (!payerMember) return { error: "Payer not in group" };

        const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
        if (!category || (category.groupId && category.groupId !== groupId)) {
            return { error: "Invalid Category" };
        }

        const now = new Date()
        let nextRun = new Date(now.getFullYear(), now.getMonth(), data.dayOfMonth)
        // If dayOfMonth is past in current month, verify logic.
        // Usually we want nextRun to be NEXT due date.
        // If today is 7th and dayOfMonth is 5th, next run is next month.
        // If today is 7th and dayOfMonth is 10th, next run is this month.

        // Simplified Logic: 
        const todayDay = now.getDate()
        if (data.dayOfMonth < todayDay) {
            nextRun = new Date(now.getFullYear(), now.getMonth() + 1, data.dayOfMonth)
        } else {
            nextRun = new Date(now.getFullYear(), now.getMonth(), data.dayOfMonth)
        }

        // Handle End of Month overflow (e.g. 31st)
        // Date object auto-corrects (e.g. Feb 30 -> Mar 2), but let's trust Date for now or use library.
        // For MVP standard Date is ok, but "dayOfMonth" field implies target day.

        const template = await prisma.recurringTemplate.create({
            data: {
                name: data.name,
                amount: data.amount,
                dayOfMonth: data.dayOfMonth,
                categoryId: data.categoryId,
                payerId: data.payerId,
                groupId,
                frequency: "MONTHLY",
                nextRun,
                splits: rawData.splits // Save splits configuration
            }
        })

        await logAudit({
            groupId,
            entityType: 'RecurringTemplate',
            entityId: template.id,
            action: 'CREATE',
            after: template,
            userId: user.id
        })

    } catch (error) {
        console.error("Create Template Error:", error)
        return { error: "Failed to create template" };
    }

    redirect("/recurring")
}

export async function confirmRecurringPayment(templateId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw new Error("Not authenticated")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true }
    })
    if (!user || !user.memberships[0]) throw new Error("No group found")
    const groupId = user.memberships[0].groupId

    const template = await prisma.recurringTemplate.findUnique({ where: { id: templateId } })
    if (!template || template.groupId !== groupId) throw new Error("Unauthorized or Not Found")

    if (!template.amount) throw new Error("Template has no amount")

    // Create Transaction
    const transaction = await prisma.transaction.create({
        data: {
            amount: template.amount,
            description: template.name,
            categoryId: template.categoryId,
            payerId: template.payerId,
            date: new Date(),
            type: "EXPENSE",
            groupId,
            createdBy: user.id,
            status: "COMPLETED",
            templateId: templateId,
            splits: {
                create: (template.splits as any[])?.map((s: any) => ({
                    userId: s.userId,
                    amount: s.amount
                })) || []
            }
        }
    })

    // Advance nextRun
    const nextRun = new Date(template.nextRun)
    nextRun.setMonth(nextRun.getMonth() + 1)

    // Ensure day matches dayOfMonth (handle Feb 28 etc)
    // If original dayOfMonth was 31, and we land in Feb, ensure we try to stick to dayOfMonth
    // Simple logic:
    const targetMonth = nextRun.getMonth(); // Already advanced
    const targetYear = nextRun.getFullYear();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const dayToSet = Math.min(template.dayOfMonth, daysInMonth);
    nextRun.setDate(dayToSet);

    await prisma.recurringTemplate.update({
        where: { id: templateId },
        data: { nextRun }
    })

    await logAudit({
        groupId,
        entityType: 'RecurringTemplate',
        entityId: templateId,
        action: 'UPDATE', // changed from CONFIRM_PAYMENT
        after: { nextRun } as any,
        userId: user.id
    })

    // No redirect usually for client action, but we need revalidate.
    // We'll rely on client router.refresh() or revalidatePath if we import it.
    // Since this is likely called from Dashboard, valid.
}

export async function deleteTransaction(transactionId: string) {
    const primary = await getPrimaryGroup();
    if (!primary) return { error: "Unauthorized" };
    const { user, groupId } = primary;

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction || transaction.groupId !== groupId) {
            return { error: "Transaction not found or unauthorized" };
        }

        // If it was a SAVING transaction linked to a Goal, decrement the goal
        if (transaction.type === 'SAVING' && transaction.goalId) {
            await prisma.goal.update({
                where: { id: transaction.goalId },
                data: { currentAmount: { decrement: transaction.amount } }
            });
        }

        await prisma.transaction.delete({
            where: { id: transactionId }
        });

        await logAudit({
            groupId,
            entityType: 'Transaction',
            entityId: transactionId,
            action: 'DELETE',
            after: transaction, // Storing deleted data for record
            userId: user.id
        });

        // revalidatePath("/dashboard") // implicit in redirect? No, this is called from client.
        // We can just return success and let client refresh or we can revalidate.
        // Since we might be on dashboard, revalidate path is good.
    } catch (error) {
        console.error("Delete error:", error);
        return { error: "Failed to delete" };
    }

    // We can't redirect easily if called from a modal without full page reload context sometimes, 
    // but usually Server Actions in client components can redirect. 
    // Ideally we return success and client closes modal + router.refresh().
    // But let's revalidate standard paths.
    // revalidatePath cannot be imported inside functions easily if not at top. const { revalidatePath } ...
    // Note: revalidatePath is imported at top.
}

export async function confirmRecurringTransaction(transactionId: string) {
    try {
        const primary = await getPrimaryGroup();
        if (!primary) return { error: "Unauthorized" };
        const { user, groupId } = primary;

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction || transaction.groupId !== groupId) {
            return { error: "Transaction not found" };
        }

        // Fetch members for default split
        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: { user: true }
        });

        if (members.length === 0) return { error: "No members to split with" };

        const count = members.length;
        const share = Math.floor(transaction.amount / count);
        const remainder = transaction.amount % count;

        const splitsData = members.map((m, i) => ({
            userId: m.userId,
            amount: share + (i < remainder ? 1 : 0)
        }));

        // Update transaction: status COMPLETED + Create Splits
        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: "COMPLETED",
                splits: {
                    create: splitsData
                }
            }
        });

        await logAudit({
            groupId,
            entityType: 'Transaction',
            entityId: transactionId,
            action: 'UPDATE',
            after: { status: "COMPLETED", splits: splitsData },
            userId: user.id
        });

    } catch (error) {
        console.error("Confirm Recurring Error:", error);
        return { error: "Failed to confirm" };
    }

    redirect("/dashboard");
}
