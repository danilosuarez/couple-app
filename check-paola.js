
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: { name: { contains: 'Paola', mode: 'insensitive' } },
        include: { memberships: { include: { group: true } } }
    })

    console.log("Usuarios encontrados (Paola):")
    users.forEach(u => {
        console.log(`User: ${u.name} (${u.email})`)
        console.log(`  Memberships: ${u.memberships.length}`)
        u.memberships.forEach(m => {
            console.log(`  - Group: ${m.group.name}, Role: ${m.role}`)
        })
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
