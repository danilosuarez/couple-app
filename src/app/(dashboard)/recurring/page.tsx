import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRecurringTemplates, getUserGroup, getCategories, getGroupMembers } from "@/lib/data"

import { redirect } from "next/navigation"
import RecurringForm from "@/components/RecurringForm"

export default async function RecurringPage() {
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    if (!userId) redirect("/")

    const group = await getUserGroup(userId)
    if (!group) redirect("/onboarding")

    const templates = await getRecurringTemplates(group.id)
    const categories = await getCategories(group.id)
    const members = await getGroupMembers(group.id)

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">Pagos Recurrentes</h1>

            {/* Create Form */}
            <RecurringForm categories={categories} members={members} />

            {/* List */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-950 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Monto</th>
                            <th className="px-6 py-3">Día</th>
                            <th className="px-6 py-3">Próximo Cobro</th>
                            <th className="px-6 py-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {templates.map(t => (
                            <tr key={t.id} className="hover:bg-gray-800/50">
                                <td className="px-6 py-4 text-sm text-white font-medium">
                                    {t.name}
                                    <span className="block text-xs text-gray-500">{t.category.name}</span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-white">
                                    {t.amount?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">
                                    {t.dayOfMonth}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">
                                    {new Date(t.nextRun).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {t.active ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
