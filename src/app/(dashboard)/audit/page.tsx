import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAuditLogs, getUserGroup } from "@/lib/data"
import { redirect } from "next/navigation"

export default async function AuditPage() {
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    if (!userId) redirect("/")

    const group = await getUserGroup(userId)
    if (!group) redirect("/onboarding")

    const logs = await getAuditLogs(group.id)

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Registro de Auditoría</h1>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-950 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Hora</th>
                            <th className="px-6 py-3">Acción</th>
                            <th className="px-6 py-3">Entidad</th>
                            <th className="px-6 py-3">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-800/50">
                                <td className="px-6 py-4 text-sm text-gray-300">
                                    {new Date(log.changedAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-white font-bold">
                                    {log.action}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">
                                    {log.entityType} ({log.entityId.slice(0, 8)}...)
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-gray-400 truncate max-w-xs">
                                    User: {log.changedById}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
