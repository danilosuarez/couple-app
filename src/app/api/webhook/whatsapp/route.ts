import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTransaction } from "@/lib/ai";
import { revalidatePath } from "next/cache";

// Define your Verify Token here (must match what you enter in Meta)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "couple-finance-secret";

// 1. Verification Step (Meta calls this when you configure the Webhook)
export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
}

// 2. Receiving Messages
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Check if it's a WhatsApp status update or message
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            const from = message.from; // Sender phone number
            const text = message.text?.body; // Message text
            const name = value.contacts?.[0]?.profile?.name || "WhatsApp User";

            if (text) {
                console.log(`Received message from ${name} (${from}): ${text}`);

                // 1. Find the default group (MVP: just grab the first one)
                // In production, we would map 'from' (phone number) to a specific user/group
                // 1. Find "Test Group" specifically as requested
                const group = await prisma.group.findFirst({
                    where: { name: "Test Group" },
                    include: {
                        members: { include: { user: true } },
                        categories: true
                    }
                });

                if (group) {
                    // 2. Prepare data for AI
                    const categories = group.categories.map(c => c.name);
                    const memberMap = group.members.map(m => ({
                        name: m.user.name || m.user.email || "Unknown",
                        id: m.user.id
                    }));
                    const memberNames = memberMap.map(m => m.name);

                    // Find "Invitado" specifically
                    const invitadoMember = memberMap.find(m => m.name.includes("Invitado")) || memberMap[0];

                    try {
                        // 3. Parse with AI
                        // Import parseTransaction from @/lib/ai locally if not imported, 
                        // but it is already imported at top of file.
                        const parsed = await parseTransaction(text, categories, memberNames);
                        console.log("AI Parsed:", parsed);

                        // 4. Resolve Category ID (Default to first if not found)
                        const category = group.categories.find(c => c.name.toLowerCase() === parsed.categoryName?.toLowerCase())
                            || group.categories[0];

                        // 5. Resolve Payer (Default to "Invitado" if valid, otherwise AI or first member)
                        let payerId = invitadoMember.id;

                        // If AI explicitly detected a different name, try to use that
                        if (parsed.payerName) {
                            const found = memberMap.find(m => m.name.toLowerCase().includes(parsed.payerName!.toLowerCase()));
                            if (found) payerId = found.id;
                        }

                        if (parsed.amount && parsed.amount > 0) {
                            // 6. Create Transaction
                            await prisma.transaction.create({
                                data: {
                                    amount: parsed.amount,
                                    description: parsed.description || "WhatsApp Transaction",
                                    date: parsed.date ? new Date(parsed.date) : new Date(),
                                    type: (parsed.type as any) || "EXPENSE",
                                    categoryId: category.id,
                                    payerId: payerId,
                                    groupId: group.id,
                                    createdBy: "WhatsApp Bot",
                                    // Dynamic split logic based on AI parsing
                                    splits: {
                                        create: (() => {
                                            // 1. Case: One Person (Debt / Assigned to specific person)
                                            if (parsed.split?.type === 'ONE_PERSON' && parsed.split.assigneeName) {
                                                const assignee = memberMap.find(m => m.name.toLowerCase().includes(parsed.split!.assigneeName!.toLowerCase()));
                                                if (assignee) {
                                                    return [{ userId: assignee.id, amount: parsed.amount!, percentage: 100 }];
                                                }
                                            }

                                            // 2. Case: Custom Percentages
                                            if (parsed.split?.type === 'CUSTOM' && parsed.split.percentages) {
                                                const splits = [];
                                                let totalAmount = 0;

                                                // Iterate over members to find their percentage in the recognized map
                                                for (const member of group.members) {
                                                    const memberName = member.user.name || member.user.email || "Unknown";
                                                    // Try to match exact name or partial
                                                    const matchedKey = Object.keys(parsed.split.percentages).find(key =>
                                                        memberName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(memberName.toLowerCase())
                                                    );

                                                    if (matchedKey) {
                                                        const pct = parsed.split.percentages[matchedKey];
                                                        const amount = Math.round(parsed.amount! * (pct / 100));
                                                        splits.push({ userId: member.user.id, amount, percentage: pct });
                                                        totalAmount += amount;
                                                    }
                                                }

                                                // If we successfully matched splits, return them. 
                                                // (Ideally we would balance rounding errors here, but MVP is fine)
                                                if (splits.length > 0) return splits;
                                            }

                                            // 3. Default: Equal Split (ALL)
                                            return group.members.map(m => ({
                                                userId: m.user.id,
                                                amount: Math.round(parsed.amount! / group.members.length),
                                                percentage: Math.round(100 / group.members.length) // Approx
                                            }));
                                        })()
                                    }
                                }
                            });
                            console.log("Transaction successfully created via WhatsApp!");
                            // Revalidate dashboard to show new transaction immediately
                            revalidatePath('/dashboard');
                        }
                    } catch (err) {
                        console.error("Failed to parse/create transaction:", err);
                    }
                }
            }
        }

        return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } catch (error) {
        console.error("Error processing webhook:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
