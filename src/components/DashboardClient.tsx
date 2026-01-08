"use client";

import { useState } from "react";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import { labels } from "@/lib/i18n";

type Transaction = {
    id: string;
    amount: number;
    description: string;
    date: Date;
    category: { name: string; icon?: string | null };
    payer: { id: string; name: string | null };
    type: string;
    comments?: any[]; // Optional if we preload
};

export default function DashboardClient({
    transactions,
    userId,
    userName
}: {
    transactions: Transaction[];
    userId: string;
    userName: string;
}) {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(val);
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'EXPENSE': return labels.transactions.expense;
            case 'SAVING': return labels.transactions.saving;
            case 'INCOME': return labels.transactions.income;
            case 'TRANSFER': return labels.transactions.transfer;
            default: return type;
        }
    }

    return (
        <>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">{labels.transactions.empty}</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-950 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">{labels.transactions.table.date}</th>
                                <th className="px-6 py-3">{labels.transactions.table.description}</th>
                                <th className="px-6 py-3">{labels.transactions.table.payer}</th>
                                <th className="px-6 py-3">{labels.transactions.table.amount}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {transactions.map(t => (
                                <tr
                                    key={t.id}
                                    className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedTransaction(t)}
                                >
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {new Date(t.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white font-medium">
                                        {t.description}
                                        <span className="block text-xs text-gray-500">
                                            {getTypeLabel(t.type)} • {t.category.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {t.payer?.name?.split(' ')[0]}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-400">
                                        {formatCurrency(t.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    currentUser={{ id: userId, name: userName }}
                />
            )}
        </>
    );
}
