import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Fallback for build time, will fail runtime if not set
    dangerouslyAllowBrowser: false,
});

export type ParsedTransaction = {
    amount?: number;
    description?: string;
    categoryId?: string;
    categoryName?: string;
    date?: string;
    payerName?: string;
    type?: string; // EXPENSE, SAVING, etc
    split?: {
        type: 'ALL' | 'CUSTOM' | 'ONE_PERSON';
        percentages?: Record<string, number>;
        assigneeName?: string;
    }
}

export async function parseTransaction(text: string, categories: string[], members: string[]): Promise<ParsedTransaction> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OpenAI API Key");
    }

    const prompt = `
    You are a financial assistant. Parse the following text into a transaction JSON.
    Text: "${text}"
    
    Available Categories: ${categories.join(', ')}.
    Available Members: ${members.join(', ')}.
    
    Return strict JSON with fields: 
    - amount (number)
    - description (string)
    - categoryName (one of the available categories or null)
    - date (YYYY-MM-DD, infer from text or null)
    - payerName (infer who paid based on context if obvious, e.g. "I paid" -> "Me", "Partner paid". If unsure, null)
    - type (EXPENSE, SAVING, INCOME, TRANSFER). Default EXPENSE.
    - split (optional object):
       - type: "ALL" (default, equal split), "CUSTOM" (percentages), or "ONE_PERSON" (assigned to one specific member).
       - percentages: (if CUSTOM) Object mapping Member Name -> Percentage (number 0-100).
       - assigneeName: (if ONE_PERSON) Name of the member.
    
    Do not include markdown formatting.
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Faster and cheaper than 3.5
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
    });

    const content = response.choices[0].message?.content;
    if (!content) throw new Error("No response from AI");

    try {
        return JSON.parse(content);
    } catch (_e) {
        throw new Error("Failed to parse AI response");
    }
}

// ...
export async function generateFinancialInsight(
    totalSpent: number,
    categorySummary: { name: string, total: number }[],
    recentLargeTransactions: { description: string, amount: number, date: string }[],
    balanceInfo?: { balance: number, status: string },
    goals?: { name: string, current: number, target: number }[]
): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OpenAI API Key");
    }

    const summaryText = categorySummary.map(c => `- ${c.name}: $${c.total.toLocaleString()}`).join('\n');
    const largeTxText = recentLargeTransactions.map(t => `- ${t.description} ($${t.amount.toLocaleString()}) el ${t.date}`).join('\n');

    let balanceSection = "";
    if (balanceInfo) {
        balanceSection = `
    **Estado de Deudas:**
    - Balance actual: $${Math.abs(balanceInfo.balance).toLocaleString()} (${balanceInfo.status})
        `;
    }

    let goalsSection = "";
    if (goals && goals.length > 0) {
        goalsSection = `
    **Metas de Ahorro:**
    ${goals.map(g => `- ${g.name}: $${g.current.toLocaleString()} / $${g.target.toLocaleString()} (${Math.round(g.current / g.target * 100)}%)`).join('\n')}
        `;
    }

    const prompt = `
    Actúa como un analista financiero personal de alto nivel.
    Analiza los siguientes datos de gastos:

    **Resumen del Periodo:**
    - Total: $${totalSpent.toLocaleString()}
    ${balanceSection}
    ${goalsSection}
    
    **Top Categorías:**
    ${summaryText}

    **Transacciones Relevantes:**
    ${largeTxText}

    Genera un reporte visualmente atractivo y directo en Markdown. Usa el siguiente formato estricto:

    ## 📊 Análisis Ejecutivo
    [Un párrafo breve y perspicaz sobre el estado financiero general. Sé directo.]
    ${balanceInfo ? '- Menciona brevemente si debe dinero o le deben.' : ''}

    ## 💸 ¿Dónde se fue el dinero?
    - Crea una lista con los principales "agujeros" de dinero.
    - Si el mercado es alto, compáralo proporcionalmente.
    
    ## ⚖️ Estado de Deudas
    [Analiza el balance. Si es 0, di que están a mano. Si debe, sugiere pagarlo. Si le deben, sugiere cobrar amablemente.]

    ${goals ? '## 🎯 Progreso de Metas' : ''}
    ${goals ? '[Comentario motivador sobre el avance de las metas].' : ''}

    ## 💡 Consejos de Acción
    - Dame 2 tips de ahorro MUY específicos basados en estos datos.
    - Usa emojis para hacer los puntos más digeribles.

    ## 🚀 Conclusión
    [Frase corta y motivadora]

    Nota: Usa formato rico (negritas, listas), sé conversacional pero profesional.
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Best cost/performance balance
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
    });

    return response.choices[0].message?.content || "No se pudo generar el reporte.";
}
