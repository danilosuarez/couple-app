import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { User, Users, Shield, AlertTriangle } from "lucide-react"
import { GroupRole } from "@prisma/client"
import SettingsClient from "./client"

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    if (!userId) redirect("/")

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            memberships: {
                include: {
                    group: true
                }
            }
        }
    })

    if (!user || !user.memberships[0]) redirect("/")

    const groupId = user.memberships[0].groupId
    const groupName = user.memberships[0].group.name
    const userRole = user.memberships[0].role
    const isOwner = userRole === GroupRole.OWNER

    // Get group members (for all users now)
    const members = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
            user: {
                select: { id: true, name: true, email: true, image: true, isActive: true }
            }
        },
        orderBy: { joinedAt: 'asc' }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Configuración
            </h1>

            {/* Profile Section */}
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-emerald-400" />
                    Tu Perfil
                </h2>
                <div className="flex items-center gap-4">
                    <img
                        src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        alt={user.name || "Avatar"}
                        className="w-16 h-16 rounded-full border-2 border-emerald-500"
                    />
                    <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                            {userRole === "OWNER" ? "Propietario" : userRole === "ADMIN" ? "Administrador" : "Miembro"}
                        </span>
                    </div>
                </div>
            </section>

            {/* Members Section */}
            <SettingsClient members={members} currentUserId={userId} groupName={groupName} userRole={userRole} />

            {/* Security Section (Placeholder) */}
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6 opacity-60">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-gray-400" />
                    Seguridad
                </h2>
                <p className="text-gray-500 text-sm">Próximamente: Cambiar contraseña, autenticación de dos factores.</p>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-950/30 rounded-xl border border-red-900/50 p-6">
                <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    Zona de Peligro
                </h2>
                <p className="text-gray-400 text-sm mb-4">Acciones irreversibles. Procede con cuidado.</p>
                <div className="flex gap-4">
                    <button className="px-4 py-2 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/30" disabled>
                        Abandonar Grupo
                    </button>
                    <button className="px-4 py-2 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/30" disabled>
                        Eliminar Cuenta
                    </button>
                </div>
            </section>
        </div>
    )
}
