import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcrypt"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        // Email + Password for admin-created users
        CredentialsProvider({
            id: "credentials",
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.passwordHash || !user.isActive) return null

                const valid = await bcrypt.compare(credentials.password, user.passwordHash)
                if (!valid) return null

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image
                }
            }
        }),
        // Guest access for demo/testing
        CredentialsProvider({
            id: "guest",
            name: "Invitado",
            credentials: {
                username: { label: "Nombre", type: "text", placeholder: "Invitado" }
            },
            async authorize(credentials) {
                const username = credentials?.username || "Guest User"
                const email = `${username.toLowerCase().replace(/\s+/g, '')}@example.com`

                const user = await prisma.user.upsert({
                    where: { email },
                    update: { name: username },
                    create: {
                        email,
                        name: username,
                        image: `https://ui-avatars.com/api/?name=${username}&background=random`
                    }
                })

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account: _account, profile: _profile }) {
            if (!user.email) return false

            // Upsert user
            await prisma.user.upsert({
                where: { email: user.email },
                update: {
                    name: user.name,
                    image: user.image,
                },
                create: {
                    email: user.email,
                    name: user.name,
                    image: user.image,
                },
            })

            return true
        },
        async session({ session, token: _token }) {
            if (session.user?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email },
                })
                if (dbUser) {
                    // @ts-expect-error - next-auth types don't include custom user.id
                    session.user.id = dbUser.id
                }
            }
            return session
        },
    },
    // pages: {
    //     signIn: '/auth/signin',
    // },
}
