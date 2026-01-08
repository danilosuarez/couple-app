"use client";

import { useState } from "react";
import { generateReport } from "@/app/actions/reports";
import { Sparkles, Loader2, FileText } from "lucide-react";

export default function ReportsClient() {
    const [report, setReport] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        setLoading(true);
        setError("");
        setReport("");

        const res = await generateReport();
        if (res.error) {
            setError(res.error);
        } else if (res.report) {
            setReport(res.report);
        }
        setLoading(false);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-4">
                <div className="inline-flex p-4 bg-emerald-500/10 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Análisis Financiero IA</h1>
                <p className="text-gray-400 max-w-md mx-auto">
                    Obtén un resumen inteligente de tus gastos del último mes, recomendaciones de ahorro y análisis de categorías.
                </p>
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2 mx-auto shadow-lg shadow-emerald-900/20"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {loading ? "Analizando tus finanzas..." : "Generar Reporte con IA"}
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-center">
                    {error}
                </div>
            )}

            {report && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="prose prose-invert max-w-none">
                        {/* Simple markdown-like rendering handling */}
                        {report.split('\n').map((line, i) => {
                            // Helper for bold text
                            const renderFormattedText = (text: string) => {
                                const parts = text.split(/(\*\*.*?\*\*)/g);
                                return parts.map((part, j) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <strong key={j} className="text-white">{part.slice(2, -2)}</strong>
                                    }
                                    return <span key={j}>{part}</span>;
                                });
                            };

                            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-emerald-400 mb-4">{renderFormattedText(line.replace('# ', ''))}</h1>
                            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3">{renderFormattedText(line.replace('## ', ''))}</h2>
                            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-white mt-4 mb-2">{renderFormattedText(line.replace('### ', ''))}</h3>
                            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-gray-300 mb-1 list-disc">{renderFormattedText(line.replace(/^[-*] /, ''))}</li>
                            if (line.match(/^\d+\. /)) return <div key={i} className="font-bold text-emerald-400 mt-4 mb-2">{renderFormattedText(line)}</div>

                            return (
                                <p key={i} className="text-gray-300 mb-2 leading-relaxed">
                                    {renderFormattedText(line)}
                                </p>
                            )
                        })}
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-center text-gray-500 flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        Generado por IA basado en tus últimas transacciones
                    </div>
                </div>
            )}
        </div>
    )
}
