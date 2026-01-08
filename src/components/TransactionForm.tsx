'use client'

import { useState, useEffect, useActionState } from "react"
import { createTransaction } from "@/app/actions"
import { useRouter } from "next/navigation"
import { labels } from "@/lib/i18n"

type Member = { id: string, name: string | null }
type Category = { id: string, name: string }
type Goal = { id: string, name: string }

type InitialValues = {
    amount?: number
    description?: string
    categoryId?: string
    date?: string
    payerId?: string
    type?: string
    assignedTo?: string
    customPercentages?: Record<string, number>
}

export default function TransactionForm({
    members,
    categories,
    userId,
    goals,
    initialValues,
    action = createTransaction
}: {
    members: Member[],
    categories: Category[],
    userId: string,
    goals: Goal[],
    initialValues?: InitialValues,
    action?: (prevState: any, formData: FormData) => Promise<any>
}) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(action, null)

    // State
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState(0)
    const [categoryId, setCategoryId] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [payedBy, setPayedBy] = useState(userId)
    const [type, setType] = useState("EXPENSE")
    const [goalId, setGoalId] = useState("")
    const [assignedTo, setAssignedTo] = useState("ALL")

    const [splits, setSplits] = useState<{ userId: string, amount: number }[]>([])
    const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({})

    // Effect to apply initialValues
    useEffect(() => {
        if (initialValues) {
            if (initialValues.description) setDescription(initialValues.description)
            if (initialValues.categoryId) setCategoryId(initialValues.categoryId)
            if (initialValues.date) setDate(initialValues.date)
            if (initialValues.payerId) setPayedBy(initialValues.payerId)
            if (initialValues.type) setType(initialValues.type)

            // Handle Splits
            const newAssignedTo = initialValues.assignedTo || "ALL"
            setAssignedTo(newAssignedTo)

            if (initialValues.customPercentages) {
                setCustomPercentages(initialValues.customPercentages)
            }

            if (initialValues.amount) {
                setAmount(initialValues.amount)
                // We need to wait for state updates or pass directly? 
                // calculateSplits uses state 'customPercentages' if not passed explicitly.
                // We should pass explicitly here.
                calculateSplits(initialValues.amount, newAssignedTo, initialValues.customPercentages)
            }
        }
    }, [initialValues])

    const calculateSplits = (val: number, assignee: string, currentPercentages?: Record<string, number>) => {
        if (members.length === 0) return

        let newSplits: { userId: string, amount: number }[] = []

        if (assignee === "ALL") {
            // Even split
            const count = members.length
            const share = Math.floor(val / count)
            const remainder = val % count
            newSplits = members.map((m, i) => ({
                userId: m.id,
                amount: share + (i < remainder ? 1 : 0)
            }))
        } else if (assignee === "CUSTOM") {
            // Custom percentages
            const percs = currentPercentages || customPercentages
            // If empty, init with equal
            const activePercs = Object.keys(percs).length > 0 ? percs :
                members.reduce((acc, m) => ({ ...acc, [m.id]: 100 / members.length }), {} as Record<string, number>)

            if (Object.keys(percs).length === 0) setCustomPercentages(activePercs)

            let currentTotal = 0
            newSplits = members.map((m, i) => {
                const p = activePercs[m.id] || 0
                // For last member, take the remainder to ensure exact sum
                if (i === members.length - 1) {
                    return { userId: m.id, amount: val - currentTotal }
                }
                const share = Math.round(val * (p / 100))
                currentTotal += share
                return { userId: m.id, amount: share }
            })
        } else {
            // Assigned to specific user (100%)
            newSplits = members.map(m => ({
                userId: m.id,
                amount: m.id === assignee ? val : 0
            }))
        }
        setSplits(newSplits)
    }

    const handleAssignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newAssignee = e.target.value
        setAssignedTo(newAssignee)

        // When switching to CUSTOM, init percentages if needed
        if (newAssignee === "CUSTOM" && Object.keys(customPercentages).length === 0) {
            const initialPercs = members.reduce((acc, m) => ({ ...acc, [m.id]: 100 / members.length }), {})
            setCustomPercentages(initialPercs)
            calculateSplits(amount, newAssignee, initialPercs)
        } else {
            calculateSplits(amount, newAssignee)
        }
    }

    const handlePercentageChange = (userId: string, rawValue: string) => {
        let val = parseFloat(rawValue)
        // Clamp and sanitize
        if (isNaN(val)) val = 0
        if (val > 100) val = 100
        if (val < 0) val = 0

        const newPercs = { ...customPercentages, [userId]: val }

        // Auto-balance if exactly 2 members (Couple logic)
        if (members.length === 2) {
            const otherMember = members.find(m => m.id !== userId)
            if (otherMember) {
                // Formatting ensures clean decimals (e.g. 33.3 -> 66.7)
                const remainder = Math.max(0, 100 - val)
                newPercs[otherMember.id] = parseFloat(remainder.toFixed(2))
            }
        }

        setCustomPercentages(newPercs)
        calculateSplits(amount, "CUSTOM", newPercs)
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(val);
    }

    const [displayAmount, setDisplayAmount] = useState("")

    useEffect(() => {
        if (amount) {
            setDisplayAmount(formatCurrency(amount))
        }
    }, [amount])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "")
        const val = parseInt(rawValue) || 0
        setAmount(val)
        setDisplayAmount(formatCurrency(val))
        calculateSplits(val, assignedTo)
    }

    return (
        <form action={formAction} className="space-y-6 max-w-lg bg-gray-900 p-8 rounded-xl border border-gray-800">
            {state?.error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm mb-4">
                    {state.error}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-300">{labels.transactions.form.type}</label>
                <select
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-950 border-gray-700 text-white px-4 py-2"
                >
                    <option value="EXPENSE">{labels.transactions.expense}</option>
                    <option value="SAVING">{labels.transactions.saving}</option>
                    <option value="INCOME">{labels.transactions.income}</option>
                    <option value="TRANSFER">{labels.transactions.transfer}</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300">{labels.transactions.form.description}</label>
                <input
                    name="description"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-950 border-gray-700 text-white px-4 py-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300">{labels.transactions.form.amount}</label>
                <div className="relative mt-1">
                    <input
                        type="text"
                        value={displayAmount}
                        onChange={handleAmountChange}
                        placeholder="$ 0"
                        className="block w-full rounded-md bg-gray-950 border-gray-700 text-white px-4 py-2 font-mono text-lg"
                    />
                    <input
                        type="hidden"
                        name="amount"
                        value={amount}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300">{labels.transactions.form.category}</label>
                <select
                    name="categoryId"
                    required
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-950 border-gray-700 text-white px-4 py-2"
                >
                    <option value="" disabled>{labels.transactions.form.selectCategory}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {type === 'SAVING' && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 text-emerald-400">{labels.transactions.form.assignGoal}</label>
                    <select
                        name="goalId"
                        value={goalId}
                        onChange={e => setGoalId(e.target.value)}
                        className="mt-1 block w-full rounded-md bg-gray-950 border-gray-700 text-white px-4 py-2"
                    >
                        <option value="">{labels.transactions.form.none}</option>
                        {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-300">{labels.transactions.form.date}</label>
                <input
                    type="date"
                    name="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-950 border-gray-700 text-white px-4 py-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300">{labels.transactions.form.payer}</label>
                <select
                    name="payedBy"
                    value={payedBy}
                    onChange={e => setPayedBy(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-950 border-gray-700 text-white px-4 py-2"
                >
                    {members.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300">{labels.transactions.form.assignTo}</label>
                <select
                    value={assignedTo}
                    onChange={handleAssignChange}
                    className="mt-1 block w-full rounded-md bg-gray-950 border-gray-700 text-white px-4 py-2"
                >
                    <option value="ALL">{labels.transactions.form.splitAll}</option>
                    <option value="CUSTOM">{labels.transactions.form.splitCustom}</option>
                    {members.map(m => (
                        <option key={m.id} value={m.id}>
                            Solo para {m.name || "Usuario"} (100%)
                        </option>
                    ))}
                </select>
            </div>

            {assignedTo === "CUSTOM" && (
                <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-3">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Distribución de Porcentajes
                    </label>
                    {members.map(m => {
                        const split = splits.find(s => s.userId === m.id)
                        const amountVal = split ? split.amount : 0

                        return (
                            <div key={m.id} className="flex items-center gap-3">
                                <div className="flex-1 text-sm text-gray-300 truncate">
                                    {m.name || m.id}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={customPercentages[m.id] ?? 0}
                                        onChange={(e) => handlePercentageChange(m.id, e.target.value)}
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
                    <div className="text-right text-xs text-gray-500 pt-1 border-t border-gray-800">
                        Total: {Object.values(customPercentages).reduce((a, b) => a + b, 0).toFixed(1)}%
                    </div>
                </div>
            )}

            {/* Hidden Splits Field */}
            <input type="hidden" name="splits" value={JSON.stringify(splits)} />

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? "Guardando..." : labels.transactions.form.submit}
                </button>
            </div>
        </form>
    )
}
