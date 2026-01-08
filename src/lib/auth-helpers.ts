import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true }
    });

    return user;
}

export async function requireGroupMember(groupId: string) {
    const user = await getAuthenticatedUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const isMember = user.memberships.some(m => m.groupId === groupId);
    if (!isMember) {
        throw new Error("Forbidden: You are not a member of this group");
    }

    return user;
}

export async function getPrimaryGroup() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    // For MVP, we assume 1 group per user primarily, or use the first one.
    if (user.memberships.length === 0) {
        return null; // Handle "No Group" case gracefully or throw
    }

    return { user, groupId: user.memberships[0].groupId };
}
