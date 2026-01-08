import { prisma } from "./prisma"
import { Prisma } from "@prisma/client"

export async function logAudit({
    groupId,
    entityType,
    entityId,
    action,
    before,
    after,
    userId
}: {
    groupId: string
    entityType: string
    entityId: string
    action: 'CREATE' | 'UPDATE' | 'DELETE'
    before?: Prisma.JsonValue
    after?: Prisma.JsonValue
    userId: string
}) {
    await prisma.auditLog.create({
        data: {
            groupId,
            entityType,
            entityId,
            action,
            beforeJson: before ?? undefined,
            afterJson: after ?? undefined,
            changedById: userId
        }
    })
}
