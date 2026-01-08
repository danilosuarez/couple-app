'use client'

import { useState } from "react"
import TransactionForm from "@/components/TransactionForm"
import AIInput from "@/components/AIInput"
import { labels } from "@/lib/i18n"

interface Category {
    id: string;
    name: string;
}

interface Member {
    id: string;
    name: string | null;
}

interface Goal {
    id: string;
    name: string;
}

interface InitialValues {
    amount?: number;
    description?: string;
    categoryId?: string;
    date?: string;
    payerId?: string;
    payerName?: string;
    type?: string;
    assignedTo?: string;
    customPercentages?: Record<string, number>;
}

type Props = {
    userId: string
    groupId: string
    categories: Category[]
    members: Member[]
    goals: Goal[]
}

export default function NewTransactionClient({ userId, groupId, categories, members, goals }: Props) {
    const [initialValues, setInitialValues] = useState<InitialValues | undefined>(undefined)

    const findMember = (name: string) => {
        const nameLower = name.toLowerCase();
        return members.find(m => m.name && m.name.toLowerCase().includes(nameLower)) ||
            members.find(m => m.name && nameLower.includes(m.name.toLowerCase()));
    }

    const handleParsed = (data: any) => {
        // Map data to InitialValues

        let payerId = undefined
        if (data.payerName) {
            const match = findMember(data.payerName)
            if (match) payerId = match.id
        }

        let newAssignedTo = "ALL";
        let newCustomPercentages: Record<string, number> | undefined = undefined;

        if (data.split) {
            if (data.split.type === 'ONE_PERSON' && data.split.assigneeName) {
                const match = findMember(data.split.assigneeName);
                if (match) newAssignedTo = match.id;
            } else if (data.split.type === 'CUSTOM' && data.split.percentages) {
                newAssignedTo = "CUSTOM";
                newCustomPercentages = {};
                for (const [name, perc] of Object.entries(data.split.percentages as Record<string, number>)) { // Type assertion
                    const match = findMember(name);
                    if (match) newCustomPercentages[match.id] = perc;
                }
            } else if (data.split.type) {
                newAssignedTo = data.split.type; // ALL
            }
        }

        setInitialValues({
            amount: data.amount,
            description: data.description,
            categoryId: data.categoryId,
            date: data.date,
            payerId,
            type: data.type,
            assignedTo: newAssignedTo,
            customPercentages: newCustomPercentages
        })
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-emerald-400">{labels.dashboard.addTransaction}</h1>

            <AIInput groupId={groupId} onParsed={handleParsed} />

            <TransactionForm
                members={members}
                categories={categories}
                userId={userId}
                goals={goals}
                initialValues={initialValues}
            />
        </div>
    )
}
