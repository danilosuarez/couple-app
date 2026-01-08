"use client";

import { useTransition } from "react";
import { confirmRecurringTransaction } from "@/app/actions";
import { CalendarClock, CheckCircle2, Loader2 } from "lucide-react";
import { labels } from "@/lib/i18n";

type PendingTransaction = {
    id: string;
    description: string;
    amount: number;
    date: Date;
    category: { name: string };
};

export default function PendingRecurring({ transactions }: { transactions: PendingTransaction[] }) {
    const [isPending, startTransition] = useTransition();

    if (transactions.length === 0) return null;

    const handleConfirm = (id: string) => {
        startTransition(async () => {
            await confirmRecurringTransaction(id);
        });
    };

    return (
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-6 rounded-2xl border border-indigo-500/30 relative overflow-hidden mb-6 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <CalendarClock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-indigo-200 font-bold">{labels.dashboard.recurringDue}</h3>
                    <p className="text-xs text-indigo-400/80">Confirma para agregar al balance (Se dividirá 50/50)</p>
                </div>
            </div>

            <div className="space-y-3">
                {transactions.map(t => (
                    <div key={t.id} className="bg-gray-900/60 p-4 rounded-xl flex items-center justify-between border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                        <div>
                            <p className="text-white font-medium">{t.description}</p>
                            <p className="text-xs text-gray-400">
                                {new Date(t.date).toLocaleDateString()} • {t.category.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-white">
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(t.amount)}
                            </span>
                            <button
                                onClick={() => handleConfirm(t.id)}
                                disabled={isPending}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                                title="Confirmar y Dividir"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
