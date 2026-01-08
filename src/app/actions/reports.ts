"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBalanceBreakdown } from "@/lib/finance";
import { generateFinancialInsight } from "@/lib/ai";
import { getUserGroup } from "@/lib/data";

export async function generateReport() {
    const session = await getServerSession(authOptions);
    // @ts-expect-error
    const userId = session?.user?.id;
    if (!userId) return { error: "No autorizado" };

    const group = await getUserGroup(userId);
    if (!group) return { error: "No tienes un grupo asignado" };

    // Fetch ALL transactions for accurate balance calculation
    const allTransactions = await prisma.transaction.findMany({
        where: {
            groupId: group.id,
        },
        include: {
            category: true,
            splits: true
        }
    });

    // Calculate Settlement Balance
    const { balance } = calculateBalanceBreakdown(userId, allTransactions);
    const balanceStatus = balance > 0 ? "Te deben dinero" : balance < 0 ? "Debes dinero" : "Están a mano";
    const balanceInfo = { balance, status: balanceStatus };

    // Filter for current period analysis (Last 30 days, Expenses only)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = allTransactions.filter(t =>
        new Date(t.date) >= thirtyDaysAgo &&
        t.type === "EXPENSE" &&
        t.status === "COMPLETED"
    );

    if (transactions.length === 0) {
        return { report: "No hay suficientes gastos recientes para un análisis, pero tu balance actual es: " + balanceStatus + " ($" + Math.abs(balance) + ")" };
    }

    // 1. Total Spent
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    // 2. Category Breakdown
    const categoryMap = new Map<string, number>();
    transactions.forEach(t => {
        const cat = t.category.name;
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
    });

    const categorySummary = Array.from(categoryMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Top 5 categories

    // 3. Largest Transactions
    const recentLargeTransactions = transactions
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map(t => ({
            description: t.description,
            amount: t.amount,
            date: t.date.toISOString().split('T')[0]
        }));

    // Fetch Goals
    const goalsList = await prisma.goal.findMany({
        where: { groupId: group.id },
        select: { name: true, currentAmount: true, targetAmount: true }
    });

    const goalsData = goalsList.map(g => ({
        name: g.name,
        current: g.currentAmount,
        target: g.targetAmount
    }));

    try {
        const report = await generateFinancialInsight(totalSpent, categorySummary, recentLargeTransactions, balanceInfo, goalsData);
        return { report };
    } catch (e: any) {
        console.error("AI Report Error:", e);
        return { error: "Error generando el reporte: " + e.message };
    }
}
