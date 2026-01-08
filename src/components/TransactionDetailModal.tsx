"use client";

import { X, Calendar, User, Tag, CreditCard, Trash2, Pencil, Loader2, AlertTriangle } from "lucide-react";
import { TransactionComments } from "./TransactionComments";
import { useState, useEffect } from "react";
import { getComments } from "@/app/actions/comments";
import { deleteTransaction } from "@/app/actions";
import { labels } from "@/lib/i18n";
import { useRouter } from "next/navigation";

type Transaction = {
    id: string;
    amount: number;
    description: string;
    date: Date;
    category: { name: string; icon?: string | null };
    payer: { id: string; name: string | null };
    type: string;
};

type Comment = {
    id: string;
    content: string;
    createdAt: Date;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
};

export function TransactionDetailModal({
    transaction,
    onClose,
    currentUser
}: {
    transaction: Transaction;
    onClose: () => void;
    currentUser: { id: string; name: string | null };
}) {
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (transaction?.id) {
            getComments(transaction.id).then((data) => {
                setComments(data);
                setLoadingComments(false);
            });
        }
    }, [transaction]);

    const handleDelete = async () => {
        setIsDeleting(true);
        const res = await deleteTransaction(transaction.id);

        if (res?.error) {
            alert(res.error);
            setIsDeleting(false);
        } else {
            onClose();
            router.refresh();
        }
    };

    if (!transaction) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-gray-800 relative flex justify-between items-start">

                    {showDeleteConfirm ? (
                        <div className="flex items-center gap-2 w-full justify-between animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>¿Eliminar?</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                    disabled={isDeleting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1"
                                    disabled={isDeleting}
                                >
                                    {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-2">
                                <a
                                    href={`/transactions/${transaction.id}/edit`}
                                    className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
                                    title={labels.common.edit}
                                >
                                    <Pencil className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                                    title={labels.common.delete}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>

                <div className="text-center px-6 pb-6 border-b border-gray-800">
                    <div className="inline-flex p-3 rounded-full bg-gray-800 mb-3 text-2xl">
                        {labels.transactions.receipt}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{transaction.description}</h2>
                    <h1 className="text-4xl font-bold text-emerald-400">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(transaction.amount)}
                    </h1>
                </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg"><Calendar className="w-4 h-4 text-gray-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500">{labels.transactions.table.date}</p>
                            <p className="text-sm text-white">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg"><Tag className="w-4 h-4 text-gray-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500">{labels.transactions.category}</p>
                            <p className="text-sm text-white">{transaction.category.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg"><User className="w-4 h-4 text-gray-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500">{labels.transactions.paidBy}</p>
                            <p className="text-sm text-white">{transaction.payer.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg"><CreditCard className="w-4 h-4 text-gray-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500">Tipo</p>
                            <p className="text-sm text-white capitalize">
                                {transaction.type === 'EXPENSE' ? labels.transactions.expense :
                                    transaction.type === 'SAVING' ? labels.transactions.saving :
                                        transaction.type === 'INCOME' ? labels.transactions.income :
                                            transaction.type === 'TRANSFER' ? labels.transactions.transfer : transaction.type}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Section */}
            {loadingComments ? (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                    {labels.common.loading}
                </div>
            ) : (
                <TransactionComments
                    transactionId={transaction.id}
                    initialComments={comments}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}
