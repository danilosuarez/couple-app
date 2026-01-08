"use client"

import { useActionState, useState } from "react"
import { createRecurringTemplate } from "@/app/actions"

type Props = {
    categories: any[]
    members: any[]
}

export default function RecurringForm({ categories, members }: Props) {
    const [state, formAction, isPending] = useActionState(createRecurringTemplate, null)

    const [amount, setAmount] = useState(0)
    const [displayAmount, setDisplayAmount] = useState("")

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(val);
    }
    const [assignedTo, setAssignedTo] = useState("ALL")
    const [splits, setSplits] = useState<{ userId: string, amount: number }[]>([])
    const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({})

    const calculateSplits = (val: number, assignee: string, currentPercentages?: Record<string, number>) => {
        if (members.length === 0) return

        let newSplits: { userId: string, amount: number }[] = []

        if (assignee === "ALL") {
            const count = members.length
            const share = Math.floor(val / count)
            const remainder = val % count
            newSplits = members.map((m, i) => ({
                userId: m.userId,
                amount: share + (i < remainder ? 1 : 0)
            }))
        } else if (assignee === "CUSTOM") {
            const percs = currentPercentages || customPercentages
            const activePercs = Object.keys(percs).length > 0 ? percs :
                members.reduce((acc, m) => ({ ...acc, [m.userId]: 100 / members.length }), {} as Record<string, number>)

            if (Object.keys(percs).length === 0) setCustomPercentages(activePercs)

            let currentTotal = 0
            newSplits = members.map((m, i) => {
                const p = activePercs[m.userId] || 0
                if (i === members.length - 1) {
                    return { userId: m.userId, amount: val - currentTotal }
                }
                const share = Math.round(val * (p / 100))
                currentTotal += share
                return { userId: m.userId, amount: share }
            })
        } else {
            newSplits = members.map(m => ({
                userId: m.userId,
                amount: m.userId === assignee ? val : 0
            }))
        }
        setSplits(newSplits)
    }

    const handleAssignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newAssignee = e.target.value
        setAssignedTo(newAssignee)
        if (newAssignee === "CUSTOM" && Object.keys(customPercentages).length === 0) {
            const initialPercs = members.reduce((acc, m) => ({ ...acc, [m.userId]: 100 / members.length }), {})
            setCustomPercentages(initialPercs)
            calculateSplits(amount, newAssignee, initialPercs)
        } else {
            calculateSplits(amount, newAssignee)
        }
    }

    const handlePercentageChange = (userId: string, rawValue: string) => {
        let val = parseFloat(rawValue)
        if (isNaN(val)) val = 0
        if (val > 100) val = 100
        if (val < 0) val = 0

        const newPercs = { ...customPercentages, [userId]: val }
        if (members.length === 2) {
            const otherMember = members.find(m => m.userId !== userId)
            if (otherMember) {
                const remainder = Math.max(0, 100 - val)
                newPercs[otherMember.userId] = parseFloat(remainder.toFixed(2))
            }
        }
        setCustomPercentages(newPercs)
        calculateSplits(amount, "CUSTOM", newPercs)
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "")
        const val = parseInt(rawValue) || 0
        setAmount(val)
        setDisplayAmount(formatCurrency(val))
        calculateSplits(val, assignedTo)
    }

    return (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h2 className="text-lg font-medium text-emerald-400 mb-4">Configurar Pago Recurrente</h2>

            {state?.error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm mb-4">
                    {state.error}
                </div>
            )}

            <form action={formAction} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nombre</label>
                        <input name="name" required placeholder="e.g. Rent" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Monto</label>
                        <div className="relative">
                            <input
                                value={displayAmount}
                                onChange={handleAmountChange}
                                placeholder="$ 0"
                                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white font-mono"
                            />
                            <input type="hidden" name="amount" value={amount} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Día del Mes</label>
                        <input name="dayOfMonth" type="number" min="1" max="31" required placeholder="5" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Categoría</label>
                        <select name="categoryId" required className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Responsable</label>
                        <select name="payerId" required className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
                            {members.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
                        </select>
                    </div>


                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1">División del Gasto</label>
                        <select
                            value={assignedTo}
                            onChange={handleAssignChange}
                            className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white mb-2"
                        >
                            <option value="ALL">Todos (50/50)</option>
                            <option value="CUSTOM">Personalizado (%)</option>
                            {members.map(m => (
                                <option key={m.userId} value={m.userId}>Solo para {m.user.name} (100%)</option>
                            ))}
                        </select>

                        {assignedTo === "CUSTOM" && (
                            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-3">
                                {members.map(m => {
                                    const split = splits.find(s => s.userId === m.userId)
                                    const amountVal = split ? split.amount : 0
                                    return (
                                        <div key={m.userId} className="flex items-center gap-3">
                                            <div className="flex-1 text-sm text-gray-300 truncate">
                                                {m.user.name}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={customPercentages[m.userId] ?? 0}
                                                    onChange={(e) => handlePercentageChange(m.userId, e.target.value)}
                                                    className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-right text-white text-sm"
                                                />
                                                <span className="text-gray-500 text-sm">%</span>
                                            </div>
                                            <div className="w-24 text-right text-sm text-emerald-400 font-mono">
                                                {formatCurrency(amountVal)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <input type="hidden" name="splits" value={JSON.stringify(splits)} />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? "Agregando..." : "Agregar Recurrente"}
                </button>
            </form>
        </div>
    )
}
