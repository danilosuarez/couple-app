import { NextRequest, NextResponse } from "next/server";
import { parseTransaction } from "@/lib/ai";
import { prisma } from "@/lib/prisma"; // Direct prisma access? Or data.ts?
// Need to fetch categories to pass to AI context.

// Secure Endpoint
// Secure Endpoint
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text, groupId } = await req.json();

        if (!text || !groupId) {
            return NextResponse.json({ error: "Missing text or groupId" }, { status: 400 });
        }

        // Validate Membership
        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId: groupId,
                user: { email: session.user.email }
            }
        });

        if (!membership) {
            return NextResponse.json({ error: "Forbidden: Not a member of this group" }, { status: 403 });
        }

        // Fetch categories for context
        const categories = await prisma.category.findMany({
            where: {
                OR: [{ groupId }, { groupId: null }]
            }
        });

        const categoryNames = categories.map(c => c.name);

        // Fetch members for context
        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: { user: true }
        });
        const memberNames = members.map(m => m.user.name || "Usuario");

        const result = await parseTransaction(text, categoryNames, memberNames);

        // Find category ID if name matches
        let categoryId = null;
        if (result.categoryName) {
            const match = categories.find(c => c.name.toLowerCase() === result.categoryName?.toLowerCase());
            categoryId = match ? match.id : null;
        }

        return NextResponse.json({ ...result, categoryId });

    } catch (error: any) {
        console.error("AI Parse Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
