import { prisma } from "@/lib/prisma"

export async function getUserGroup(userId: string) {
    const membership = await prisma.groupMember.findFirst({
        where: { userId },
        include: { group: true },
    })

    if (!membership) return null
    return membership.group
}

export async function getGroupMembers(groupId: string) {
    return prisma.groupMember.findMany({
        where: { groupId },
        include: { user: true }
    })
}

export async function getCategories(groupId: string) {
    return prisma.category.findMany({
        where: {
            OR: [
                { groupId: groupId },
                { groupId: null }
            ]
        }
    })
}

export async function getTransactions(groupId: string) {
    return prisma.transaction.findMany({
        where: { groupId },
        include: {
            payer: true,
            category: true,
            splits: true
        },
        orderBy: { date: 'desc' }
    })
}

export async function getGoals(groupId: string) {
    return prisma.goal.findMany({
        where: { groupId }
    })
}

export async function getRecurringTemplates(groupId: string) {
    return prisma.recurringTemplate.findMany({
        where: { groupId },
        include: { category: true, group: true } // group usually not needed but include for completeness if needed
    })
}

export async function getAuditLogs(groupId: string) {
    return prisma.auditLog.findMany({
        where: { groupId },
        orderBy: { changedAt: 'desc' },
        take: 50
    })
}

export async function getAlerts(groupId: string) {
    return prisma.alert.findMany({
        where: { groupId, isRead: false },
        orderBy: { createdAt: 'desc' }
    })
}
