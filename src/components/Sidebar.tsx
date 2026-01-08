'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CreditCard, PiggyBank, Target, Settings, LogOut, FileText, CalendarClock, Wallet } from "lucide-react"
import { signOut } from "next-auth/react"

const navItems = [
    { name: "Inicio", href: "/dashboard", icon: Home },
    { name: "Transacciones", href: "/transactions", icon: CreditCard },
    { name: "Cuentas", href: "/accounts", icon: Wallet },
    { name: "Recurrentes", href: "/recurring", icon: CalendarClock },
    { name: "Metas", href: "/goals", icon: Target },
    { name: "Reportes", href: "/reports", icon: FileText },
    { name: "Configuración", href: "/settings", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
            <div className="p-6">
                <h2 className="text-xl font-bold text-emerald-400">Couple Finance</h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? "bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 border-l-2 border-emerald-500"
                                : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:bg-gray-900 hover:text-white rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    )
}
