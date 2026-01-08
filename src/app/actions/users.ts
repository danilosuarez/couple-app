'use server'

import { prisma } from "@/lib/prisma"
import { getPrimaryGroup } from "@/lib/auth-helpers"
import { GroupRole } from "@prisma/client"
import bcrypt from "bcrypt"
import { z } from "zod"
import { revalidatePath } from "next/cache"

// ---------- Schemas ----------

const createUserSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres")
})

// ---------- Helpers ----------

async function requireOwner() {
    const primary = await getPrimaryGroup()
    if (!primary) return null

    const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: primary.user.id, groupId: primary.groupId } }
    })

    if (!membership || membership.role !== GroupRole.OWNER) return null

    return { ...primary, membership }
}

// ---------- Actions ----------

// Helper to check if user is in the group (any role)
async function requireGroupMembership() {
    const primary = await getPrimaryGroup()
    if (!primary) return null

    const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: primary.user.id, groupId: primary.groupId } }
    })

    if (!membership) return null
    return { ...primary, membership }
}

export async function listGroupMembers() {
    const access = await requireGroupMembership()
    if (!access) return { error: "Unauthorized", members: [] }

    const members = await prisma.groupMember.findMany({
        where: { groupId: access.groupId },
        include: {
            user: {
                select: { id: true, name: true, email: true, image: true, isActive: true }
            }
        },
        orderBy: { joinedAt: 'asc' }
    })

    return { members }
}

export async function createUser(prevState: any, formData: FormData) {
    const owner = await requireOwner()
    if (!owner) return { error: "Solo el propietario puede agregar usuarios" }

    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password")
    }

    const validation = createUserSchema.safeParse(rawData)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }
    const data = validation.data

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
        return { error: "Ya existe un usuario con ese email" }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user and add to group
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
            memberships: {
                create: {
                    groupId: owner.groupId,
                    role: GroupRole.MEMBER
                }
            }
        }
    })

    revalidatePath("/settings")
    return { success: true, userId: user.id }
}

export async function removeUserFromGroup(userId: string) {
    const owner = await requireOwner()
    if (!owner) return { error: "Solo el propietario puede eliminar usuarios" }

    // Cannot remove yourself
    if (userId === owner.user.id) {
        return { error: "No puedes eliminarte a ti mismo" }
    }

    // Check user is in group
    const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: owner.groupId } }
    })
    if (!membership) return { error: "Usuario no encontrado en el grupo" }

    // Remove from group
    await prisma.groupMember.delete({
        where: { id: membership.id }
    })

    // Optionally deactivate the user if they have no other memberships
    const otherMemberships = await prisma.groupMember.count({ where: { userId } })
    if (otherMemberships === 0) {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
        })
    }

    revalidatePath("/settings")
    return { success: true }
}

export async function updateUserRole(userId: string, role: "OWNER" | "ADMIN" | "MEMBER") {
    const owner = await requireOwner()
    if (!owner) return { error: "Solo el propietario puede cambiar roles" }

    // Cannot change your own role
    if (userId === owner.user.id) {
        return { error: "No puedes cambiar tu propio rol" }
    }

    const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: owner.groupId } }
    })
    if (!membership) return { error: "Usuario no encontrado" }

    await prisma.groupMember.update({
        where: { id: membership.id },
        data: { role }
    })

    revalidatePath("/settings")
    return { success: true }
}
