"use client"

import { useState } from "react"
import { updateGoal, deleteGoal } from "@/app/actions"
import { Pencil, Trash2, X, Save, TrendingUp } from "lucide-react"

type Goal = {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline: Date | null
}

export default function GoalCard({ goal }: { goal: Goal }) {
    const [isEditing, setIsEditing] = useState(false)

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(val);
    }

    const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)

    if (isEditing) {
        return (
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Editar Meta</h3>
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form action={async (formData) => {
                    await updateGoal(goal.id, formData)
                    setIsEditing(false)
                }} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nombre</label>
                        <input
                            name="name"
                            defaultValue={goal.name}
                            required
                            className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Monto Objetivo</label>
                        <input
                            name="targetAmount"
                            type="number"
                            defaultValue={goal.targetAmount}
                            required
                            className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Fecha Límite</label>
                        <input
                            name="deadline"
                            type="date"
                            defaultValue={goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ""}
                            className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Guardar
                        </button>
                    </div>
                    {/* Delete logic could be separate or here with formAction? But formAction overrides onSubmit usually. */}
                </form>
                <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                    <form action={async () => {
                        if (confirm("¿Estás seguro de eliminar esta meta?")) {
                            await deleteGoal(goal.id)
                        }
                    }}>
                        <button type="submit" className="text-red-500 hover:text-red-400 text-xs flex items-center justify-center gap-1 w-full">
                            <Trash2 className="w-3 h-3" /> Eliminar Meta
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {goal.name}
                    </h3>
                    {goal.deadline && (
                        <p className="text-xs text-gray-500">Objetivo: {new Date(goal.deadline).toLocaleDateString("es-ES")}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Ahorrado</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(goal.currentAmount)}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
                <span>{Math.round(progress)}%</span>
                <span>Meta: {formatCurrency(goal.targetAmount)}</span>
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 border border-gray-700"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
