
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = "invitado@example.com" // The default guest user

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        console.log("User not found")
        return
    }

    await prisma.groupMember.updateMany({
        where: { userId: user.id },
        data: { role: 'OWNER' }
    })

    console.log(`Updated ${email} to OWNER`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
