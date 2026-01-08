import { createGroup } from "../actions"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Info } from "lucide-react"

export default async function OnboardingPage() {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-emerald-400">¡Bienvenido!</h1>
                    <p className="mt-2 text-gray-400">Configura tu espacio financiero compartido.</p>
                </div>

                <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-400 mb-1">¿Buscas unirte a un grupo existente?</h3>
                        <p className="text-sm text-gray-400">
                            Si tu pareja o administrador ya creó un grupo, pídeles que te agreguen usando tu correo:
                        </p>
                        <div className="mt-2 text-sm font-mono bg-blue-950 px-3 py-1.5 rounded-lg text-blue-200 border border-blue-900/50 break-all">
                            {email || "Tu correo no está disponible"}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-2 bg-gray-950 text-sm text-gray-500">O crea uno nuevo</span>
                    </div>
                </div>

                <form action={createGroup} className="bg-gray-900 p-8 rounded-xl border border-gray-800 space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                            Nombre del Nuevo Grupo
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            placeholder="ej. Familia Pérez"
                            className="mt-1 block w-full rounded-md bg-gray-950 border-gray-700 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-3"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                        Crear Grupo
                    </button>
                </form>
            </div>
        </div>
    )
}
