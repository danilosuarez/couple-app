import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAlerts, getUserGroup } from "@/lib/data"
import { redirect } from "next/navigation"

export default async function AlertsPage() {
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    if (!userId) redirect("/")

    const group = await getUserGroup(userId)
    if (!group) redirect("/onboarding")

    const alerts = await getAlerts(group.id)

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
            <div className="space-y-4">
                {alerts.length === 0 ? (
                    <p className="text-gray-500">Sin notificaciones nuevas.</p>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-start">
                            <div>
                                <h3 className="text-white font-bold">{alert.title}</h3>
                                <p className="text-gray-400 text-sm mt-1">{alert.body}</p>
                                <p className="text-gray-600 text-xs mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                {/* Mark as read action could go here */}
                                <button className="text-xs text-emerald-400 font-medium hover:text-emerald-300">
                                    Marcar como Leído
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
