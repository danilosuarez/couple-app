"use client";
import React, { useState } from 'react';
import { labels } from "@/lib/i18n";

type BreakdownItem = {
    id: string,
    description: string,
    date: Date,
    amount: number,
    type: 'OWE' | 'OWED'
}

export default function BalanceCard({ balance, breakdown }: { balance: number, breakdown: BreakdownItem[] }) {
    const [isOpen, setIsOpen] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(val);
    }

    return (
        <>
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 relative group transition-all hover:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{labels.dashboard.settlementBalance}</h3>
                    {breakdown.length > 0 && balance !== 0 && (
                        <button
                            onClick={() => setIsOpen(true)}
                            className="text-xs bg-gray-800 hover:bg-gray-700 text-emerald-400 font-medium px-3 py-1 rounded-full transition-colors border border-gray-700"
                        >
                            {labels.dashboard.viewDetails}
                        </button>
                    )}
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                    {balance > 0 ? (
                        <span className="text-emerald-400">{labels.dashboard.youAreOwed} {formatCurrency(balance)}</span>
                    ) : balance < 0 ? (
                        <span className="text-rose-400">{labels.dashboard.youOwe} {formatCurrency(Math.abs(balance))}</span>
                    ) : (
                        <span className="text-gray-200">{labels.dashboard.settled}</span>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Liquidación pendiente con pareja</p>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-800 p-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl shadow-black">
                        <div className="flex justify-between items-center sticky top-0 bg-gray-900 pb-2 border-b border-gray-800">
                            <h3 className="text-lg font-bold text-white">{labels.dashboard.settlementBalance}</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-2">✕</button>
                        </div>
                        <div className="space-y-3">
                            {breakdown.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">Sin detalles disponibles.</p>
                            ) : breakdown.map(item => (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0 border-dashed">
                                    <div className="flex-1 pr-4">
                                        <p className="text-sm text-white font-medium truncate">{item.description}</p>
                                        <p className="text-xs text-gray-500 capitalize">{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    <div className={`text-sm font-bold whitespace-nowrap ${item.type === 'OWED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {item.type === 'OWED' ? '+' : '-'} {formatCurrency(item.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-gray-800 flex justify-between items-center bg-gray-900 sticky bottom-0">
                            <span className="text-gray-400 text-sm">{labels.dashboard.totalBalance}:</span>
                            <span className={`text-lg font-bold ${balance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(Math.abs(balance))} {balance > 0 ? '(A favor)' : '(En contra)'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
