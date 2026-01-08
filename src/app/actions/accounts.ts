"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming this exists, verify path if needed
import { redirect } from "next/navigation";

// Define schema for account creation
const createAccountSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum([
        "CHECKING",
        "SAVINGS",
        "CREDIT_CARD",
        "INVESTMENT",
        "LOAN",
        "CASH",
        "OTHER",
    ]),
    balance: z.number().default(0),
    currency: z.string().default("COP"),
    privacyLevel: z.enum(["SHARED", "PERSONAL", "PRIVATE"]),
});

export async function createAccount(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const rawData = {
        name: formData.get("name"),
        type: formData.get("type"),
        balance: Number(formData.get("balance")),
        currency: formData.get("currency"),
        privacyLevel: formData.get("privacyLevel"),
    };

    const validation = createAccountSchema.safeParse(rawData);

    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    try {
        await prisma.financialAccount.create({
            data: {
                ...validation.data,
                userId: user.id,
            },
        });

        revalidatePath("/accounts");
        return { success: true };
    } catch (error) {
        console.error("Failed to create account:", error);
        return { error: "Failed to create account" };
    }
}

export async function getAccounts() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return []; // Or throw specific error to handle in UI
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            memberships: {
                include: {
                    group: {
                        include: {
                            members: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!user) return [];

    // For now, let's just get the user's own accounts
    // In a real scenario, we might want to fetch partner's SHARED accounts too if they are in the same group
    // But strictly speaking, the user asks for "Account Management" which usually implies managing MY accounts.
    // The Dashboard is where we Aggregate.
    // However, listing accounts might want to show "Shared with me" accounts.

    // Let's fetch the current user's accounts
    const myAccounts = await prisma.financialAccount.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return myAccounts;
}
