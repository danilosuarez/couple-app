const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pending = await prisma.transaction.findMany({
        where: { status: "PENDING" }
    });
    console.log("Pending Transactions:", JSON.stringify(pending, null, 2));

    const templates = await prisma.recurringTemplate.findMany();
    console.log("Templates:", JSON.stringify(templates, null, 2));
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
