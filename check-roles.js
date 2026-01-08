
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const members = await prisma.groupMember.findMany({
        include: {
            user: true,
            group: true
        }
    })

    console.log("Usuarios y Roles:")
    members.forEach(m => {
        console.log(`User: ${m.user.name} (${m.user.email}) - Role: ${m.role} - Group: ${m.group.name}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
