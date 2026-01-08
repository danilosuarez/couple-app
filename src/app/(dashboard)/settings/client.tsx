"use client"

import { useState, useActionState } from "react"
import { Users, Plus, Trash2, Loader2, X } from "lucide-react"
import { createUser, removeUserFromGroup } from "@/app/actions/users"

interface Member {
    id: string
    role: string
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
        isActive: boolean
    }
}

export default function SettingsClient({
    members,
    currentUserId,
    groupName,
    userRole
}: {
    members: Member[]
    currentUserId: string
    groupName: string
    userRole: string
}) {
    const [showAddModal, setShowAddModal] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Check if user is admin or owner for management actions
    const canManage = userRole === "OWNER" || userRole === "ADMIN"

    const handleRemove = async (userId: string) => {
        if (!confirm("¿Estás seguro de eliminar este usuario del grupo?")) return
        setDeletingId(userId)
        await removeUserFromGroup(userId)
        setDeletingId(null)
    }

    return (
        <>
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" />
                        {groupName} - Miembros
                    </h2>
                    {canManage && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Usuario
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-xs text-gray-400 uppercase border-b border-gray-800">
                            <tr>
                                <th className="text-left py-3 px-2">Usuario</th>
                                <th className="text-left py-3 px-2">Email</th>
                                <th className="text-left py-3 px-2">Rol</th>
                                <th className="text-right py-3 px-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {members.map(member => (
                                <tr key={member.id} className="hover:bg-gray-800/50">
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={member.user.image || `https://ui-avatars.com/api/?name=${member.user.name}&background=random`}
                                                alt={member.user.name || "Avatar"}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <span className="text-white font-medium">
                                                {member.user.name}
                                                {member.user.id === currentUserId && (
                                                    <span className="ml-2 text-xs text-gray-500">(Tú)</span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-gray-400 text-sm">{member.user.email}</td>
                                    <td className="py-3 px-2">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${member.role === "OWNER"
                                            ? "bg-amber-500/20 text-amber-400"
                                            : member.role === "ADMIN"
                                                ? "bg-blue-500/20 text-blue-400"
                                                : "bg-gray-500/20 text-gray-400"
                                            }`}>
                                            {member.role === "OWNER" ? "Propietario" : member.role === "ADMIN" ? "Admin" : "Miembro"}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        {member.user.id !== currentUserId && member.role !== "OWNER" && canManage && (
                                            <button
                                                onClick={() => handleRemove(member.user.id)}
                                                disabled={deletingId === member.user.id}
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="Eliminar del grupo"
                                            >
                                                {deletingId === member.user.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Add User Modal */}
            {showAddModal && (
                <AddUserModal onClose={() => setShowAddModal(false)} />
            )}
        </>
    )
}

function AddUserModal({ onClose }: { onClose: () => void }) {
    const [state, formAction, isPending] = useActionState(createUser, null)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Agregar Usuario</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {state?.error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-4">
                        {state.error}
                    </div>
                )}

                {state?.success && (
                    <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg text-sm mb-4">
                        ¡Usuario creado exitosamente!
                    </div>
                )}

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                        <input
                            name="name"
                            required
                            placeholder="Juan Pérez"
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="juan@ejemplo.com"
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Crear Usuario
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
