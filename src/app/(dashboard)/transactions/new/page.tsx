import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCategories, getGroupMembers, getUserGroup, getGoals } from "@/lib/data"
import NewTransactionClient from "./client"
import { redirect } from "next/navigation"

export default async function NewTransactionPage() {
    const session = await getServerSession(authOptions)
    // @ts-expect-error - next-auth types don't include custom user.id
    const userId = session?.user?.id
    if (!userId) redirect("/")

    const group = await getUserGroup(userId)
    if (!group) redirect("/onboarding")

    const categories = await getCategories(group.id)
    const groupMembers = await getGroupMembers(group.id)
    const goals = await getGoals(group.id)

    // Transform members to simple objects
    const members = groupMembers.map(gm => ({ id: gm.user.id, name: gm.user.name }))

    return (
        <NewTransactionClient
            userId={userId}
            groupId={group.id}
            categories={categories}
            members={members}
            goals={goals}
        />
    )
}
