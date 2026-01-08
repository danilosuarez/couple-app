import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGoals, getUserGroup } from "@/lib/data"
import { createGoal } from "@/app/actions"
import { redirect } from "next/navigation"
import GoalCard from "@/components/GoalCard"

export default async function GoalsPage() {
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    if (!userId) redirect("/")

    const group = await getUserGroup(userId)
    if (!group) redirect("/onboarding")

    const goals = await getGoals(group.id)

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Ahorros y Metas</h1>
                {/* Create Goal Form (inline for MVP) */}
            </div>

            {/* Create Goal Section */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h2 className="text-lg font-medium text-emerald-400 mb-4">Crear Nueva Meta</h2>
                <form action={createGoal} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nombre de la Meta</label>
                        <input name="name" required placeholder="ej. Viaje" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
                    </div>
                    <div className="w-full">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Monto Objetivo</label>
                        <input name="targetAmount" type="number" required placeholder="1000000" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
                    </div>
                    <div className="w-full">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Fecha Límite (Opcional)</label>
                        <input name="deadline" type="date" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
                    </div>
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded min-w-fit">
                        Agregar Meta
                    </button>
                </form>
            </div>

            {/* Goals List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                ))}
            </div>
        </div>
    )
}
