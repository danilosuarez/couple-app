const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const lastTx = await prisma.transaction.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            payer: true,
            splits: {
                include: { user: true }
            }
        }
    })

    if (!lastTx) {
        console.log("No transactions found.")
        return
    }

    console.log("=== LAST TRANSACTION ===")
    console.log(`Description: ${lastTx.description}`)
    console.log(`Amount: ${lastTx.amount}`)
    console.log(`Payer: ${lastTx.payer.name} (${lastTx.payerId})`)
    console.log(`Type: ${lastTx.type}`)

    console.log("\n--- SPLITS ---")
    lastTx.splits.forEach(s => {
        console.log(`User: ${s.user.name} (${s.userId})`)
        console.log(`Amount: ${s.amount}`)
        console.log(`Percentage (implied): ${(s.amount / lastTx.amount * 100).toFixed(2)}%`)
    })

    // Calculate Balance Impact for Payer
    const payerSplit = lastTx.splits.find(s => s.userId === lastTx.payerId)
    const payerShare = payerSplit ? payerSplit.amount : 0
    const owedToPayer = lastTx.amount - payerShare

    console.log("\n--- CALCULATION CHECK ---")
    console.log(`Payer Shared: ${payerShare}`)
    console.log(`Payer is Owed: ${owedToPayer}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
