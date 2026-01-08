'use client'

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

type AIInputProps = {
    groupId: string
    onParsed: (data: any) => void
}

export default function AIInput({ groupId, onParsed }: AIInputProps) {
    const [text, setText] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleParse = async () => {
        if (!text.trim()) return
        setIsLoading(true)
        setError("")

        try {
            const res = await fetch("/api/ai/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, groupId })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to parse")
            }

            const data = await res.json()
            onParsed(data)
            setText("") // Clear input on success
        } catch (e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 p-6 rounded-xl border border-emerald-500/30 mb-8">
            <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" />
                Asistente IA
            </h3>
            <p className="text-xs text-gray-400 mb-3">
                Pega un mensaje, texto de factura o describe el gasto naturalmente.
                <br />Ejemplo: <em>"Cena en Crepes ayer 50000 pagado por mi dividido igual"</em>
            </p>

            <div className="flex gap-2 items-start">
                <textarea
                    className="flex-1 bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-20"
                    placeholder="Describe el gasto..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleParse()
                        }
                    }}
                />
                <button
                    onClick={handleParse}
                    disabled={isLoading || !text.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg h-20 flex items-center justify-center min-w-[80px]"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Procesar"}
                </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
    )
}
