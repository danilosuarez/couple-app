"use client"

import { useState } from "react"
import { confirmRecurringPayment } from "@/app/actions"
import { CheckCircle, Calendar, RefreshCw } from "lucide-react"

type RecurringTemplate = {
    id: string
    name: string
    amount: number | null
    nextRun: Date
    category: { name: string }
    payerId: string
    active: boolean
}

export default function RecurringDueCard({ templates }: { templates: RecurringTemplate[] }) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

    const handleConfirm = async (id: string, name: string) => {
        if (!confirm(`¿Confirmar pago de: ${name}?`)) return

        setLoadingMap(prev => ({ ...prev, [id]: true }))
        try {
            await confirmRecurringPayment(id)
            // Router refresh happens silently via revalidatePath usually, 
            // but we might need explicit refresh if using simple server actions.
            // For now assume server action revalidates.
        } catch (e) {
            alert("Error al confirmar pago")
            console.error(e)
        } finally {
            setLoadingMap(prev => ({ ...prev, [id]: false }))
        }
    }

    if (templates.length === 0) return null

    return (
        <div className="bg-gradient-to-br from-indigo-900/50 to-gray-900 p-6 rounded-2xl border border-indigo-500/30">
            <h3 className="text-indigo-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Pagos Frecuentes Pendientes
            </h3>
            <div className="space-y-4">
                {templates.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                        <div>
                            <p className="text-white font-medium">{t.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{t.category.name}</span>
                                <span>•</span>
                                <span className="text-indigo-300 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {new Date(t.nextRun).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-white font-bold">
                                ${t.amount?.toLocaleString()}
                            </span>
                            <button
                                onClick={() => handleConfirm(t.id, t.name)}
                                disabled={loadingMap[t.id]}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                                title="Confirmar Pago"
                            >
                                <CheckCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
