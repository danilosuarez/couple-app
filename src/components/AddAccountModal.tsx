"use client";

import { useState } from "react";
import { createAccount } from "@/app/actions/accounts";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { labels } from "@/lib/i18n";

export function AddAccountModal() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        const res = await createAccount(formData);
        if (res?.error) {
            setError(typeof res.error === 'string' ? res.error : "Validation error");
        } else {
            setIsOpen(false);
            router.refresh();
            // Reset form if needed, but native form action handles a lot
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
                <Plus className="w-4 h-4" />
                {labels.dashboard.addAccount}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">{labels.accounts.createTitle}</h2>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            {labels.accounts.name}
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            placeholder="ej. Bancolombia, Efectivo"
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                {labels.accounts.type}
                            </label>
                            <select
                                name="type"
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="CHECKING">Corriente</option>
                                <option value="SAVINGS">Ahorros</option>
                                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                                <option value="INVESTMENT">Inversión</option>
                                <option value="CASH">Efectivo</option>
                                <option value="LOAN">Préstamo</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Moneda
                            </label>
                            <select
                                name="currency"
                                defaultValue="COP"
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="COP">COP</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            {labels.accounts.balance}
                        </label>
                        <input
                            name="balance"
                            type="number"
                            step="1"
                            defaultValue={0}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Usa valores negativos para deudas (ej. Tarjetas)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            {labels.accounts.privacy.label}
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 bg-gray-950 cursor-pointer hover:border-gray-700">
                                <input type="radio" name="privacyLevel" value="SHARED" className="mt-1" defaultChecked />
                                <div>
                                    <div className="font-medium text-white">{labels.accounts.privacy.shared.title}</div>
                                    <div className="text-xs text-gray-500">{labels.accounts.privacy.shared.description}</div>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 bg-gray-950 cursor-pointer hover:border-gray-700">
                                <input type="radio" name="privacyLevel" value="PERSONAL" className="mt-1" />
                                <div>
                                    <div className="font-medium text-white">{labels.accounts.privacy.personal.title}</div>
                                    <div className="text-xs text-gray-500">{labels.accounts.privacy.personal.description}</div>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 bg-gray-950 cursor-pointer hover:border-gray-700">
                                <input type="radio" name="privacyLevel" value="PRIVATE" className="mt-1" />
                                <div>
                                    <div className="font-medium text-white">{labels.accounts.privacy.private.title}</div>
                                    <div className="text-xs text-gray-500">{labels.accounts.privacy.private.description}</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors mt-2"
                    >
                        {labels.common.create}
                    </button>
                </form>
            </div>
        </div>
    );
}
