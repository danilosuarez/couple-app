"use client";

import { AddAccountModal } from "@/components/AddAccountModal";
import { Shield, Eye, EyeOff, Building2, CreditCard, Banknote, Wallet } from "lucide-react";
import { labels } from "@/lib/i18n";

// Fallback utility if not present
const formatMoney = (amount: number, currency = "COP") => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    privacyLevel: string;
}

export default function AccountsClient({ accounts }: { accounts: Account[] }) {

    const getIcon = (type: string) => {
        switch (type) {
            case "CHECKING": return <Building2 className="w-5 h-5 text-blue-400" />;
            case "SAVINGS": return <Wallet className="w-5 h-5 text-emerald-400" />;
            case "CREDIT_CARD": return <CreditCard className="w-5 h-5 text-purple-400" />;
            case "CASH": return <Banknote className="w-5 h-5 text-green-400" />;
            default: return <Building2 className="w-5 h-5 text-gray-400" />;
        }
    };

    const getPrivacyBadge = (level: string) => {
        switch (level) {
            case "SHARED":
                return <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full"><Eye className="w-3 h-3" /> {labels.accounts.privacy.shared.title}</span>;
            case "PERSONAL":
                return <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full"><Shield className="w-3 h-3" /> {labels.accounts.privacy.personal.title}</span>;
            case "PRIVATE":
                return <span className="inline-flex items-center gap-1 text-xs bg-gray-500/10 text-gray-500 px-2 py-1 rounded-full"><EyeOff className="w-3 h-3" /> {labels.accounts.privacy.private.title}</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">{labels.dashboard.myAccounts}</h1>
                    <p className="text-gray-400 mt-1">Gestiona tus cuentas conectadas y privacidad</p>
                </div>
                <AddAccountModal />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((account) => (
                    <div key={account.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl flex flex-col gap-4 hover:border-gray-700 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-950 rounded-lg border border-gray-800">
                                    {getIcon(account.type)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{account.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{account.type.replace("_", " ")}</p>
                                </div>
                            </div>
                            {getPrivacyBadge(account.privacyLevel)}
                        </div>

                        <div className="mt-auto">
                            <p className="text-sm text-gray-400">{labels.accounts.balance}</p>
                            <p className={`text-2xl font-bold ${account.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                                {formatMoney(account.balance, account.currency)}
                            </p>
                        </div>
                    </div>
                ))}

                {accounts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                        <p>Aún no hay cuentas agregadas.</p>
                        <p className="text-sm">Haz clic en &quot;Agregar Cuenta&quot; para comenzar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
