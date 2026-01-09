'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CreditCard, Target, Settings, LogOut, FileText, CalendarClock, Wallet, Menu, X } from "lucide-react"
import { signOut } from "next-auth/react"
import Image from "next/image"

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
    const [isOpen, setIsOpen] = useState(false)

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 border border-gray-800 text-white rounded-lg shadow-lg"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop (Mobile only) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 border-r border-gray-800 flex flex-col 
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="p-6 md:pt-8 pt-16 flex justify-center bg-black items-center">
                    <Image
                        src="/logo.png"
                        alt="Couple Finance Logo"
                        width={220}
                        height={220}
                        className="object-contain w-full h-auto max-h-48"
                        priority
                    />
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
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
        </>
    )
}
