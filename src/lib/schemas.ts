import { z } from "zod";

export const splitSchema = z.object({
    userId: z.string(),
    amount: z.number().min(0),
    percentage: z.number().optional()
});

export const createTransactionSchema = z.object({
    amount: z.number().positive("El monto debe ser positivo"),
    description: z.string().min(1, "La descripción es requerida"),
    categoryId: z.string().min(1, "La categoría es requerida"),
    payedBy: z.string().min(1, "El pagador es requerido"),
    date: z.date().default(() => new Date()),
    type: z.enum(["EXPENSE", "INCOME", "SAVING", "TRANSFER", "ADJUSTMENT"]).default("EXPENSE"),
    goalId: z.string().optional(),
    splits: z.array(splitSchema).optional(),
    // We do NOT allow groupId to be passed from client for creation; strictly derived from session.
});

export const createRecurringTemplateSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    amount: z.number().positive("El monto debe ser positivo"),
    dayOfMonth: z.number().min(1).max(31),
    categoryId: z.string().min(1, "La categoría es requerida"),
    payerId: z.string().min(1, "El responsable es requerido"),
    frequency: z.enum(["MONTHLY"]).default("MONTHLY"), // Fixed for MVP
});
