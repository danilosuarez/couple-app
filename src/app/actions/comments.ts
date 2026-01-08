"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getPrimaryGroup, requireGroupMember } from "@/lib/auth-helpers";

// Helper to verify access
// Helper to verify access
async function verifyTransactionAccess(transactionId: string) {
    const primary = await getPrimaryGroup();
    if (!primary) return null;
    const { user, groupId } = primary;

    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: { groupId: true }
    });

    if (!transaction || transaction.groupId !== groupId) return null;

    return user;
}

export async function addComment(transactionId: string, content: string) {
    const user = await verifyTransactionAccess(transactionId);
    if (!user) {
        throw new Error("Unauthorized Access or Transaction not found");
    }

    try {
        const comment = await prisma.comment.create({
            data: {
                content,
                transactionId,
                userId: user.id,
            },
            include: {
                user: true, // Include user to return author info immediately
            },
        });

        revalidatePath("/"); // Revalidate dashboard
        revalidatePath("/transactions");
        return { success: true, comment };
    } catch (error) {
        console.error("Failed to add comment:", error);
        return { error: "Failed to add comment" };
    }
}

export async function getComments(transactionId: string) {
    const user = await verifyTransactionAccess(transactionId);
    if (!user) {
        console.error("Unauthorized access to comments for transaction", transactionId);
        return [];
    }

    try {
        const comments = await prisma.comment.findMany({
            where: { transactionId },
            orderBy: { createdAt: "asc" },
            include: {
                user: true,
            },
        });
        return comments;
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return [];
    }
}
