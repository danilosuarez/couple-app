const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const transactions = await prisma.transaction.findMany({
        include: { splits: true }
    })

    const users = await prisma.user.findMany()
    const userBalances = {}

    users.forEach(u => userBalances[u.id] = { name: u.name, balance: 0 })

    console.log(`Found ${transactions.length} transactions.`)

    transactions.forEach(t => {
        if (t.status !== 'COMPLETED') return

        console.log(`\nTx: ${t.description} | Amount: ${t.amount} | Payer: ${t.payerId} | Type: ${t.type}`)

        users.forEach(u => {
            const userId = u.id
            const mySplit = t.splits.find(s => s.userId === userId)
            const myShare = mySplit ? mySplit.amount : 0

            // Logic from finance.ts
            if (t.payerId === userId) {
                userBalances[userId].balance += (t.amount - myShare)
                console.log(`  -> User ${u.name} PAID. Credit: ${t.amount - myShare}`)
            } else {
                userBalances[userId].balance -= myShare
                console.log(`  -> User ${u.name} OWES share: ${myShare}`)
            }
        })
    })

    console.log("\n=== FINAL BALANCES ===")
    Object.values(userBalances).forEach(u => {
        console.log(`${u.name}: ${u.balance}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
