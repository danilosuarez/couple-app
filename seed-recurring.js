const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    /* Find ANY valid membership */
    const membership = await prisma.groupMember.findFirst({
        include: { group: true, user: true }
    });

    if (!membership) {
        console.log("No memberships found in DB");
        return;
    }
    const group = membership.group;
    const user = membership.user;
    console.log("Seeding for group:", group.id, "User:", user.email);
    const category = await prisma.category.findFirst({ where: { groupId: group.id } });

    // Create a template that is due today/past
    const template = await prisma.recurringTemplate.create({
        data: {
            name: "Test Netflix Subscription " + Date.now(),
            amount: 15000,
            dayOfMonth: new Date().getDate(), // Due today
            categoryId: category.id,
            payerId: user.id,
            groupId: group.id,
            active: true,
            nextRun: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday (Due)
            frequency: "MONTHLY"
        }
    });

    console.log("Created template:", template.id);
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
